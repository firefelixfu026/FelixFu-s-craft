import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  ExternalLink,
  FilePenLine,
  Gamepad2,
  Github,
  Heading2,
  Heart,
  ImageIcon,
  List,
  LogIn,
  CircleHelp,
  LogOut,
  MessageCircle,
  PencilLine,
  PlusCircle,
  Quote,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sigma,
  Star,
  ThumbsDown,
  Trash2,
  UserRound,
  X,
  Zap
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { aiNews as fallbackNews, articles as fallbackArticles, gameModule, profile as fallbackProfile } from './data.js';
import ProjectOpsPanel from './ProjectOpsPanel.jsx';

const createEmptyArticleForm = () => ({
  title: '',
  summary: '',
  content: '',
  coverUrl: '',
  tags: '',
  date: new Date().toISOString().slice(0, 10),
  readTime: '3 min',
  status: 'published',
  category: '学习笔记',
  pinned: false
});

const visitorNavItems = [
  { id: 'articles', label: '文章', icon: BookOpen },
  { id: 'plan', label: '计划', icon: List },
  { id: 'game', label: '游戏', icon: Gamepad2 },
  { id: 'login', label: '登录', icon: LogIn }
];

const readerNavItems = [
  { id: 'overview', label: '首页', icon: UserRound },
  { id: 'articles', label: '文章', icon: BookOpen },
  { id: 'plan', label: '计划', icon: List },
  { id: 'game', label: '游戏', icon: Gamepad2 }
];

const aiNavItem = { id: 'ai', label: 'AI', icon: Bot };
const adminNavItem = { id: 'admin', label: '管理', icon: FilePenLine };
const accountNavItem = { id: 'account', label: '账号', icon: UserRound };

const COMMENT_MAX_LENGTH = 300;
const COMMENT_PAGE_UNITS = 5;
const COMMENT_UNIT_CHARS = 60;
const ADMIN_COMMENTS_PER_PAGE = 5;
const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const ARTICLE_DRAFT_KEY = 'felix_blog_article_form_draft';
const SUMMER_PLAN_KEY = 'felix_blog_summer_plan';
const emptyReactionState = { like: false, favorite: false, downvote: false, question: false };
const ALL_FILTER = '全部';
const ALL_ARCHIVE = '全部';

const defaultSummerPlan = {
  goals: {
    main: '完成暑假作业，复习薄弱科目，提前预习新学期内容。',
    exercise: '每天至少运动 40 分钟，保持规律作息。',
    project: '每周完成一个兴趣小项目或一次长阅读记录。'
  },
  schedule: [
    { id: 'daily-1', time: '07:30 - 08:00', task: '起床、洗漱、早餐', note: '整理房间，打开清爽的一天。' },
    { id: 'daily-2', time: '08:00 - 09:30', task: '语文 / 英语学习', note: '阅读、背单词、作文积累任选其二。' },
    { id: 'daily-3', time: '09:45 - 11:15', task: '数学 / 理科学习', note: '主攻错题和薄弱章节。' },
    { id: 'daily-4', time: '11:15 - 12:00', task: '整理笔记 / 阅读', note: '把上午学到的内容收一下口。' },
    { id: 'daily-5', time: '12:00 - 14:00', task: '午餐、午休', note: '不刷太久手机，留一点安静时间。' },
    { id: 'daily-6', time: '14:00 - 15:30', task: '暑假作业 / 预习', note: '每天推进固定页数或固定章节。' },
    { id: 'daily-7', time: '15:30 - 16:30', task: '运动', note: '散步、打球、跑步、跳绳都可以。' },
    { id: 'daily-8', time: '16:30 - 17:30', task: '兴趣时间', note: '画画、音乐、编程、手工或拍照。' },
    { id: 'daily-9', time: '19:00 - 20:30', task: '今日任务收尾', note: '检查完成度，准备明天任务。' },
    { id: 'daily-10', time: '21:30 - 22:00', task: '睡前阅读、洗漱', note: '22:00 尽量睡觉。' }
  ],
  weekly: [
    { id: 'week-1', day: '周一', focus: '制定本周目标', done: false },
    { id: 'week-2', day: '周二', focus: '数学 / 理科加强', done: false },
    { id: 'week-3', day: '周三', focus: '英语阅读、听力或单词', done: false },
    { id: 'week-4', day: '周四', focus: '语文阅读、作文积累', done: false },
    { id: 'week-5', day: '周五', focus: '整理错题，查漏补缺', done: false },
    { id: 'week-6', day: '周六', focus: '兴趣活动和户外运动', done: false },
    { id: 'week-7', day: '周日', focus: '总结一周，准备下周', done: false }
  ]
};

const personalizedSummerPlan = {
  profile: {
    name: '付江樊',
    identity: '浙江大学准大二',
    range: '2026-08-04 至 2026-08-15',
    theme: '期末冲刺式预习 + 规律生活记录'
  },
  goals: {
    study: '穿插预习高级数据结构与算法分析、计算机组成、大学物理（乙）Ⅱ、概率论与数理统计，按期末冲刺节奏推进。',
    body: '游泳、快走、室内燃脂轮换，记录体重、饮食、睡眠。',
    life: '保留以撒的结合、第五人格、葬送的芙莉莲、红与黑，同时严格控制 B 站和小红书。'
  },
  daily: [
    { id: 'day-0804', date: '8月4日', study: '高级数据结构与算法分析：复杂度、堆、并查集预热', exercise: '快走 40 分钟', rest: '红与黑 30 页', note: '' },
    { id: 'day-0805', date: '8月5日', study: '计算机组成：数据表示、定点与浮点运算', exercise: '室内燃脂 25 分钟', rest: '葬送的芙莉莲 1 集', note: '' },
    { id: 'day-0806', date: '8月6日', study: '概率论与数理统计：随机变量、分布函数', exercise: '游泳', rest: '以撒的结合 45 分钟', note: '' },
    { id: 'day-0807', date: '8月7日', study: '大学物理（乙）Ⅱ：电场、电势、电容', exercise: '快走 45 分钟', rest: '红与黑 30 页', note: '' },
    { id: 'day-0808', date: '8月8日', study: '高级数据结构与算法分析：图论基础、最短路预习', exercise: '室内燃脂 25 分钟', rest: '第五人格 45 分钟', note: '' },
    { id: 'day-0809', date: '8月9日', study: '计算机组成：指令系统、CPU 数据通路', exercise: '游泳', rest: '葬送的芙莉莲 1 集', note: '' },
    { id: 'day-0810', date: '8月10日', study: '概率论与数理统计：期望、方差、常见分布', exercise: '快走 40 分钟', rest: '红与黑 30 页', note: '' },
    { id: 'day-0811', date: '8月11日', study: '大学物理（乙）Ⅱ：稳恒磁场、电磁感应', exercise: '室内燃脂 30 分钟', rest: '以撒的结合 45 分钟', note: '' },
    { id: 'day-0812', date: '8月12日', study: '高级数据结构与算法分析：平衡树、哈希、摊还分析', exercise: '游泳', rest: '葬送的芙莉莲 1 集', note: '' },
    { id: 'day-0813', date: '8月13日', study: '计算机组成：流水线、存储层次', exercise: '快走 45 分钟', rest: '第五人格 45 分钟', note: '' },
    { id: 'day-0814', date: '8月14日', study: '概率论与数理统计 + 大物：做一轮综合回顾', exercise: '室内燃脂 25 分钟', rest: '红与黑 30 页', note: '' },
    { id: 'day-0815', date: '8月15日', study: '四门课整理清单：下学期第一周预习交接', exercise: '轻松快走 30 分钟', rest: '自由复盘', note: '' }
  ],
  courses: [
    { id: 'course-ads', name: '高级数据结构与算法分析', target: '建立期末冲刺式目录感，能看懂主要题型', progress: '0%' },
    { id: 'course-co', name: '计算机组成', target: '理解数据表示、指令、CPU、存储层次主线', progress: '0%' },
    { id: 'course-physics', name: '大学物理（乙）Ⅱ', target: '电磁学核心概念先过一轮', progress: '0%' },
    { id: 'course-prob', name: '概率论与数理统计', target: '随机变量、分布、期望方差、统计基础预热', progress: '0%' }
  ],
  apps: [
    { id: 'app-wechat', name: '微信', limit: '90 分钟', actual: '' },
    { id: 'app-bilibili', name: 'B 站', limit: '30 分钟', actual: '' },
    { id: 'app-rednote', name: '小红书', limit: '20 分钟', actual: '' }
  ],
  expenses: [{ id: 'expense-1', date: '8月4日', item: '餐饮', amount: '', note: '' }],
  meals: [{ id: 'meal-1', date: '8月4日', breakfast: '', lunch: '', dinner: '', snack: '' }],
  bodyMetrics: [{ id: 'body-1', date: '8月4日', weight: '', waist: '', exercise: '', mood: '' }],
  sleep: [{ id: 'sleep-1', date: '8月4日', bed: '', wake: '', hours: '', quality: '' }]
};

const personalizedTimeSlots = [
  { id: 'slot-0730', time: '07:30 - 08:00', activity: '起床、洗漱、早餐', focus: '不刷短视频，先把一天启动起来。', type: '生活' },
  { id: 'slot-0800', time: '08:00 - 10:00', activity: '课程预习 1', focus: '高级数据结构与算法分析 / 计算机组成轮换，按期末冲刺式看目录、抓概念、做例题。', type: '学习' },
  { id: 'slot-1000', time: '10:00 - 10:30', activity: '弹性时间', focus: '补水、走动、处理临时消息；有额外活动可以直接改这一格。', type: '弹性' },
  { id: 'slot-1030', time: '10:30 - 12:00', activity: '课程预习 2', focus: '大学物理（乙）Ⅱ / 概率论与数理统计轮换，目标是先建立知识框架。', type: '学习' },
  { id: 'slot-1200', time: '12:00 - 14:00', activity: '午餐 + 午休', focus: '吃饭、短休，不把 B 站和小红书刷成无底洞。', type: '生活' },
  { id: 'slot-1400', time: '14:00 - 15:30', activity: '题目/笔记整理', focus: '上午内容收束：整理公式、数据结构模板、组成原理图、概率概念。', type: '学习' },
  { id: 'slot-1530', time: '15:30 - 16:30', activity: '运动', focus: '游泳、快走、室内燃脂三选一；按身体状态调强度。', type: '运动' },
  { id: 'slot-1630', time: '16:30 - 17:30', activity: '弹性时间', focus: '外出、家务、临时安排、补觉都放这里；也可挪给学习追进度。', type: '弹性' },
  { id: 'slot-1730', time: '17:30 - 19:00', activity: '晚餐 + 记录', focus: '填饮食、体重/指标、记账；当天花销随手记。', type: '记录' },
  { id: 'slot-1900', time: '19:00 - 20:30', activity: '轻学习 / 复盘', focus: '复盘今日预习，列明天任务；不适合硬刚时改成阅读。', type: '学习' },
  { id: 'slot-2030', time: '20:30 - 21:30', activity: '娱乐时间', focus: '以撒的结合 / 第五人格 / 葬送的芙莉莲 / 红与黑，控制 B 站和小红书。', type: '娱乐' },
  { id: 'slot-2130', time: '21:30 - 22:30', activity: '洗漱 + 睡眠准备', focus: '填睡眠记录，尽量 22:30 前进入休息状态。', type: '睡眠' }
];

function getArticleMonth(date) {
  if (!date) return '';
  const normalized = String(date).replace(/\//g, '-');
  const match = normalized.match(/^(\d{4})-(\d{1,2})/);
  if (!match) return '';
  return `${match[1]}-${match[2].padStart(2, '0')}`;
}

function formatArchiveLabel(month) {
  if (month === ALL_ARCHIVE) return '全部月份';
  const [year, monthValue] = month.split('-');
  return `${year}年${Number(monthValue)}月`;
}

function hasArticleDraftContent(form) {
  return ['title', 'summary', 'content', 'coverUrl', 'tags'].some((field) => form[field]?.trim());
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function aiTaskLabel(task) {
  return {
    polish: '润色',
    continue: '续写',
    outline: '大纲'
  }[task] || '写作辅助';
}


function App() {
  const [activeView, setActiveView] = useState('overview');
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(ALL_FILTER);
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);
  const [selectedArchive, setSelectedArchive] = useState(ALL_ARCHIVE);
  const [profile, setProfile] = useState(fallbackProfile);
  const [articles, setArticles] = useState(fallbackArticles);
  const [aiNews, setAiNews] = useState(fallbackNews);
  const [reactions, setReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentReplyTargets, setCommentReplyTargets] = useState({});
  const [comments, setComments] = useState({
    'react-fastapi-mvp': [{ id: 'local-1', authorName: '访客', content: '第一版先把前后端结构跑起来，后续再接数据库。' }]
  });
  const [commentPages, setCommentPages] = useState({});
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [articleForm, setArticleForm] = useState(createEmptyArticleForm);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminComments, setAdminComments] = useState([]);
  const [adminCommentPage, setAdminCommentPage] = useState(0);
  const [adminCommentArticleFilter, setAdminCommentArticleFilter] = useState('all');
  const [adminCommentAuthorFilter, setAdminCommentAuthorFilter] = useState('all');
  const [adminCommentStatusFilter, setAdminCommentStatusFilter] = useState('all');
  const [isLoadingAdminComments, setIsLoadingAdminComments] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isRunningArticleAi, setIsRunningArticleAi] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isLoadingUploadedImages, setIsLoadingUploadedImages] = useState(false);
  const [articleDraftNotice, setArticleDraftNotice] = useState('');
  const [aiGenerationHistory, setAiGenerationHistory] = useState([]);
  const [accountActivity, setAccountActivity] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [adminAuditLogs, setAdminAuditLogs] = useState([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [aiSettings, setAiSettings] = useState(null);
  const [aiTestForm, setAiTestForm] = useState({
    providerName: '',
    apiStyle: 'openai',
    baseUrl: '',
    model: '',
    apiKey: ''
  });
  const [aiTestMessage, setAiTestMessage] = useState('');
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('felix_blog_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('felix_blog_user') || 'null');
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    displayName: 'Felix Fu',
    setupToken: ''
  });
  const [authMessage, setAuthMessage] = useState('');
  const [interactionMessage, setInteractionMessage] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const visibleNavItems = useMemo(() => {
    if (!currentUser) {
      return visitorNavItems;
    }

    if (currentUser.role === 'admin') {
      return [readerNavItems[0], readerNavItems[1], readerNavItems[2], aiNavItem, readerNavItems[3], accountNavItem, adminNavItem];
    }

    return [...readerNavItems, accountNavItem];
  }, [currentUser?.role]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [profileRes, newsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/ai/news')
        ]);

        if (profileRes.ok) {
          setProfile(await profileRes.json());
        }
        if (newsRes.ok) {
          setAiNews(await newsRes.json());
        }
        await refreshArticles();
      } catch {
        // The MVP can run as a standalone frontend before the API is started.
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (params.get('auth') !== 'github') return;

    const token = params.get('token');
    const error = params.get('error');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    if (token) {
      localStorage.setItem('felix_blog_token', token);
      localStorage.removeItem('felix_blog_user');
      setCurrentUser(null);
      setAuthToken(token);
      setAuthMessage('GitHub 登录成功');
      setActiveView('admin');
      return;
    }

    setAuthMessage(error ? `GitHub 登录失败：${error}` : 'GitHub 登录失败');
    setActiveView('login');
  }, []);

  useEffect(() => {
    if (!authToken) {
      localStorage.removeItem('felix_blog_token');
      localStorage.removeItem('felix_blog_user');
      setCurrentUser(null);
      return;
    }

    async function loadCurrentUser() {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!response.ok) {
          logout(false);
          return;
        }
        const result = await response.json();
        setCurrentUser(result.user);
        localStorage.setItem('felix_blog_user', JSON.stringify(result.user));
        await refreshArticles();
      } catch {
        setAuthMessage('后端服务不可用，无法校验登录状态');
      }
    }

    loadCurrentUser();
  }, [authToken]);

  useEffect(() => {
    if (activeView === 'admin' && currentUser?.role === 'admin') {
      refreshAdminComments();
      refreshUploadedImages();
      refreshAdminStats();
      refreshAdminAuditLogs();
      refreshAiSettings();
      refreshAiGenerationHistory();
    }
  }, [activeView, currentUser?.role, authToken]);

  useEffect(() => {
    if (activeView === 'account' && currentUser) {
      refreshAccountActivity();
    }
  }, [activeView, currentUser?.id, authToken]);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const rawDraft = localStorage.getItem(ARTICLE_DRAFT_KEY);
    if (rawDraft) {
      setArticleDraftNotice('检测到本地草稿，可选择恢复');
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (activeView !== 'admin' || currentUser?.role !== 'admin') return;
    const timer = window.setTimeout(() => {
      if (!hasArticleDraftContent(articleForm)) return;
      localStorage.setItem(ARTICLE_DRAFT_KEY, JSON.stringify({
        form: articleForm,
        editingArticleId,
        savedAt: new Date().toISOString()
      }));
      setArticleDraftNotice('本地草稿已自动保存');
    }, 800);
    return () => window.clearTimeout(timer);
  }, [activeView, currentUser?.role, articleForm, editingArticleId]);

  useEffect(() => {
    if (!currentUser) {
      if (authToken) return;
      if (!['articles', 'plan', 'game', 'login'].includes(activeView)) {
        setActiveView('articles');
      }
      return;
    }

    if (activeView === 'admin' && currentUser.role !== 'admin') {
      setActiveView('overview');
      return;
    }

    if (activeView === 'ai' && currentUser.role !== 'admin') {
      setInteractionMessage('AI 工作台仅管理员可用');
      setActiveView('overview');
    }
  }, [activeView, authToken, currentUser?.role]);

  async function refreshArticles(token = authToken) {
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    const articlesRes = await fetch('/api/articles', {
      headers
    });
    if (!articlesRes.ok) return [];
    const articleData = await articlesRes.json();
    setArticles(articleData);
    hydrateArticleState(articleData);
    return articleData;
  }

  function hydrateArticleState(nextArticles) {
    const nextComments = {};
    const nextReactionCounts = {};
    const nextReactions = {};

    nextArticles.forEach((article) => {
      nextComments[article.id] = (article.comments || []).map((comment, index) =>
        typeof comment === 'string'
          ? { id: `${article.id}-${index}`, authorName: '访客', content: comment }
          : comment
      );
      nextReactionCounts[article.id] = {
        like: article.reactions?.like || 0,
        favorite: article.reactions?.favorite || 0,
        downvote: article.reactions?.downvote || 0,
        question: article.reactions?.question || 0
      };
      nextReactions[article.id] = {
        ...emptyReactionState,
        ...(article.viewerReactions || {})
      };
    });

    setComments(nextComments);
    setReactionCounts(nextReactionCounts);
    setReactions(nextReactions);
  }

  function getAuthHeaders() {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }

  async function refreshAccountActivity() {
    if (!authToken) return;
    try {
      const response = await fetch('/api/me/activity', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setAccountActivity(await response.json());
      }
    } catch {
      setAccountActivity(null);
    }
  }

  async function refreshAdminStats() {
    if (currentUser?.role !== 'admin') return;
    try {
      const response = await fetch('/api/admin/stats', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setAdminStats(await response.json());
      }
    } catch {
      setAdminStats(null);
    }
  }

  async function refreshAdminAuditLogs() {
    if (currentUser?.role !== 'admin') return;
    setIsLoadingAuditLogs(true);
    try {
      const response = await fetch('/api/admin/audit-logs?limit=40', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setAdminAuditLogs(await response.json());
      }
    } catch {
      setAdminAuditLogs([]);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }

  async function refreshAiSettings() {
    if (currentUser?.role !== 'admin') return;
    try {
      const response = await fetch('/api/admin/ai/settings', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const payload = await response.json();
        setAiSettings(payload);
        setAiTestForm((current) => ({
          ...current,
          providerName: current.providerName || payload.provider || '',
          apiStyle: current.apiStyle || payload.apiStyle || 'openai',
          model: current.model || payload.model || ''
        }));
      }
    } catch {
      setAiSettings(null);
    }
  }

  async function refreshAiGenerationHistory() {
    if (currentUser?.role !== 'admin') return;
    try {
      const response = await fetch('/api/admin/ai/history', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const persisted = await response.json();
        setAiGenerationHistory((current) => {
          const localEntries = current.filter((entry) => entry.beforeContent);
          const localIds = new Set(localEntries.map((entry) => String(entry.historyId || entry.id)));
          const persistedEntries = persisted
            .filter((entry) => !localIds.has(String(entry.id)))
            .map((entry) => ({
              id: `persisted-${entry.id}`,
              historyId: entry.id,
              task: aiTaskLabel(entry.task),
              mode: '已记录',
              source: entry.source,
              title: entry.title,
              createdAt: entry.createdAt
            }));
          return [...localEntries, ...persistedEntries].slice(0, 12);
        });
      }
    } catch {
      // Keep local history available if the API is temporarily unavailable.
    }
  }

  async function testAiSettings(event) {
    event?.preventDefault();
    if (currentUser?.role !== 'admin') return;
    setIsTestingAi(true);
    setAiTestMessage('正在测试真实模型连通性...');
    try {
      const response = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(aiTestForm)
      });
      const payload = await response.json().catch(() => ({}));
      setAiTestMessage(payload.message || (response.ok ? '测试完成' : '测试失败'));
      await refreshAiSettings();
    } catch {
      setAiTestMessage('后端服务不可用，无法测试 AI 配置');
    } finally {
      setIsTestingAi(false);
    }
  }

  function showLoginRequired(action) {
    setInteractionMessage(`请先登录后再${action}`);
  }

  function syncArticleState(article) {
    setArticles((current) => current.map((item) => (item.id === article.id ? article : item)));
    setComments((current) => ({
      ...current,
      [article.id]: article.comments || []
    }));
    setReactionCounts((current) => ({
      ...current,
      [article.id]: {
        like: article.reactions?.like || 0,
        favorite: article.reactions?.favorite || 0,
        downvote: article.reactions?.downvote || 0,
        question: article.reactions?.question || 0
      }
    }));
    setReactions((current) => ({
      ...current,
      [article.id]: {
        ...emptyReactionState,
        ...(article.viewerReactions || {})
      }
    }));
  }

  async function openArticle(articleId) {
    setSelectedArticleId(articleId);
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) return;
      syncArticleState(await response.json());
    } catch {
      setInteractionMessage('后端服务不可用，阅读次数暂时无法更新');
    }
  }

  function updateAuthForm(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAuthForm(event) {
    event.preventDefault();
    setIsAuthLoading(true);
    setAuthMessage('');

    const endpoint = {
      login: '/api/auth/login',
      signup: '/api/auth/register',
      'admin-register': '/api/auth/admin/register'
    }[authMode] || '/api/auth/login';
    const payload = {
      email: authForm.email,
      password: authForm.password,
      ...(authMode !== 'login' ? { displayName: authForm.displayName } : {}),
      ...(authMode === 'admin-register' ? { setupToken: authForm.setupToken } : {})
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthMessage(result.detail || '登录失败');
        return;
      }

      localStorage.setItem('felix_blog_token', result.token);
      localStorage.setItem('felix_blog_user', JSON.stringify(result.user));
      setAuthToken(result.token);
      setCurrentUser(result.user);
      setInteractionMessage('');
      await refreshArticles(result.token);
      setAuthMessage(
        authMode === 'signup' ? '普通账号已注册' : authMode === 'admin-register' ? '管理员已初始化' : '已登录'
      );
      setActiveView(result.user?.role === 'admin' ? 'admin' : 'articles');
    } catch {
      setAuthMessage('后端服务不可用，登录失败');
    } finally {
      setIsAuthLoading(false);
    }
  }

  function logout(redirect = true) {
    localStorage.removeItem('felix_blog_token');
    localStorage.removeItem('felix_blog_user');
    setAuthToken('');
    setCurrentUser(null);
    setAuthMessage('');
    setInteractionMessage('');
    if (redirect) {
      setActiveView('overview');
    }
  }

  const tags = useMemo(() => {
    const uniqueTags = new Set(articles.flatMap((article) => article.tags));
    return [ALL_FILTER, ...uniqueTags];
  }, [articles]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(articles.map((article) => article.category || '学习笔记'));
    return [ALL_FILTER, ...uniqueCategories];
  }, [articles]);

  const archiveOptions = useMemo(() => {
    const counts = new Map();
    articles.forEach((article) => {
      const month = getArticleMonth(article.date);
      if (!month) return;
      counts.set(month, (counts.get(month) || 0) + 1);
    });

    return [
      { value: ALL_ARCHIVE, label: formatArchiveLabel(ALL_ARCHIVE), count: articles.length },
      ...Array.from(counts.entries())
        .sort(([left], [right]) => right.localeCompare(left))
        .map(([value, count]) => ({ value, label: formatArchiveLabel(value), count }))
    ];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return articles.filter((article) => {
      const tagMatched = selectedTag === ALL_FILTER || article.tags.includes(selectedTag);
      const categoryMatched = selectedCategory === ALL_FILTER || (article.category || '学习笔记') === selectedCategory;
      const archiveMatched = selectedArchive === ALL_ARCHIVE || getArticleMonth(article.date) === selectedArchive;
      const text = `${article.title} ${article.summary} ${article.content} ${article.category || ''} ${article.tags.join(' ')}`.toLowerCase();
      return categoryMatched && tagMatched && archiveMatched && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [articles, query, selectedCategory, selectedTag, selectedArchive]);

  async function toggleReaction(articleId, type) {
    if (!authToken) {
      showLoginRequired('点赞、收藏、点踩或使用“？”');
      return;
    }

    const previousActive = Boolean(reactions[articleId]?.[type]);
    const nextActive = !previousActive;

    setReactions((current) => ({
      ...current,
      [articleId]: {
        ...emptyReactionState,
        ...current[articleId],
        [type]: nextActive
      }
    }));

    setReactionCounts((current) => ({
      ...current,
      [articleId]: {
        like: current[articleId]?.like || 0,
        favorite: current[articleId]?.favorite || 0,
        downvote: current[articleId]?.downvote || 0,
        question: current[articleId]?.question || 0,
        [type]: Math.max(0, (current[articleId]?.[type] || 0) + (nextActive ? 1 : -1))
      }
    }));

    try {
      const response = await fetch(`/api/articles/${articleId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ type, active: nextActive })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showLoginRequired('点赞、收藏、点踩或使用“？”');
        }
        await refreshArticles();
        return;
      }

      const result = await response.json();
      setInteractionMessage('');
      setReactionCounts((current) => ({
        ...current,
        [articleId]: result.reactions
      }));
      setReactions((current) => ({
        ...current,
        [articleId]: {
          ...emptyReactionState,
          ...(result.viewerReactions || {})
        }
      }));
    } catch {
      await refreshArticles();
    }
  }

  async function submitComment(articleId) {
    if (!authToken) {
      showLoginRequired('评论');
      return;
    }

    const value = commentDrafts[articleId]?.trim();
    const replyTarget = commentReplyTargets[articleId] || null;
    if (!value) return;
    if (value.length > COMMENT_MAX_LENGTH) {
      window.alert(`评论最多 ${COMMENT_MAX_LENGTH} 字`);
      return;
    }

    setCommentDrafts((current) => ({ ...current, [articleId]: '' }));

    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ content: value, parentId: replyTarget?.id || null })
      });

      if (response.ok) {
        const result = await response.json();
        setComments((current) => ({
          ...current,
          [articleId]: result.comments
        }));
        setInteractionMessage(result.message || '评论已提交，审核通过后会公开显示');
        setCommentReplyTargets((current) => ({ ...current, [articleId]: null }));
        setCommentPages((current) => ({ ...current, [articleId]: Number.MAX_SAFE_INTEGER }));
        return;
      }

      const result = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        showLoginRequired('评论');
        await refreshArticles();
        return;
      }
      setInteractionMessage(result.detail || '评论发布失败，请稍后再试');
      return;
    } catch {
      setInteractionMessage('后端服务不可用，评论发布失败');
      setCommentDrafts((current) => ({ ...current, [articleId]: value }));
    }
  }

  function updateArticleForm(field, value) {
    setArticleForm((current) => ({ ...current, [field]: value }));
  }

  function clearArticleDraft(message = '') {
    localStorage.removeItem(ARTICLE_DRAFT_KEY);
    setArticleDraftNotice(message);
  }

  function restoreArticleDraft() {
    const rawDraft = localStorage.getItem(ARTICLE_DRAFT_KEY);
    if (!rawDraft) {
      setArticleDraftNotice('没有可恢复的本地草稿');
      return;
    }

    try {
      const draft = JSON.parse(rawDraft);
      setArticleForm({ ...createEmptyArticleForm(), ...(draft.form || {}) });
      setEditingArticleId(draft.editingArticleId || null);
      setArticleDraftNotice(`已恢复本地草稿${draft.savedAt ? `：${new Date(draft.savedAt).toLocaleString('zh-CN', { hour12: false })}` : ''}`);
    } catch {
      clearArticleDraft('本地草稿已损坏，已清除');
    }
  }

  function resetArticleForm() {
    setArticleForm(createEmptyArticleForm());
    setEditingArticleId(null);
    setAdminMessage('');
    clearArticleDraft('');
  }

  async function runArticleAiTask(task, selectedText = '', insertMode = 'append', selectionRange = null) {
    if (currentUser?.role !== 'admin') {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }

    setIsRunningArticleAi(true);
    setAdminMessage('AI 正在生成写作辅助内容...');
    try {
      const response = await fetch('/api/ai/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          task,
          title: articleForm.title,
          summary: articleForm.summary,
          content: articleForm.content,
          selectedText,
          tone: '个人博客'
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAdminMessage(payload.detail || 'AI 写作辅助失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      const taskLabel = aiTaskLabel(task);
      const sourceLabel = payload.status === 'real' ? '真实模型' : payload.status === 'fallback' ? '回退结果' : '本地占位';
      const modeLabel = {
        append: '追加',
        insert: '插入',
        replace: selectedText ? '替换' : '插入'
      }[insertMode] || '追加';
      const nextBlock = `## AI ${taskLabel}结果（${sourceLabel}）\n\n${payload.content || ''}`;
      const beforeContent = articleForm.content || '';
      const rangeStart = Number.isFinite(selectionRange?.start)
        ? Math.max(0, Math.min(selectionRange.start, beforeContent.length))
        : beforeContent.length;
      const rangeEnd = Number.isFinite(selectionRange?.end)
        ? Math.max(rangeStart, Math.min(selectionRange.end, beforeContent.length))
        : rangeStart;
      let nextContent = '';

      if (insertMode === 'insert' || insertMode === 'replace') {
        const replaceEnd = insertMode === 'replace' && rangeEnd > rangeStart ? rangeEnd : rangeStart;
        const before = beforeContent.slice(0, rangeStart);
        const after = beforeContent.slice(replaceEnd);
        const leadingBreak = before && !before.endsWith('\n') ? '\n\n' : '';
        const trailingBreak = after && !after.startsWith('\n') ? '\n\n' : '';
        nextContent = `${before}${leadingBreak}${nextBlock}${trailingBreak}${after}`;
      } else {
        const currentContent = beforeContent.trimEnd();
        const separator = currentContent ? '\n\n---\n\n' : '';
        nextContent = `${currentContent}${separator}${nextBlock}`;
      }

      setArticleForm((current) => ({
        ...current,
        content: nextContent
      }));
      setAiGenerationHistory((current) => [
        {
          id: `${Date.now()}-${task}`,
          historyId: payload.historyId,
          task: taskLabel,
          mode: modeLabel,
          source: sourceLabel,
          beforeContent,
          nextContent,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 8));
      refreshAiGenerationHistory();
      setAdminMessage(`${payload.message || `AI ${taskLabel}结果已生成`}，已${modeLabel}到正文`);
    } catch {
      setAdminMessage('后端服务不可用，AI 写作辅助失败');
    } finally {
      setIsRunningArticleAi(false);
    }
  }

  function undoLatestArticleAiResult(entry) {
    if (!entry) {
      setAdminMessage('暂无可撤回的 AI 结果');
      return;
    }
    setArticleForm((current) => ({
      ...current,
      content: entry.beforeContent,
    }));
    setAiGenerationHistory((current) => current.filter((item) => item.id !== entry.id));
    setAdminMessage(`已撤回最近一次 AI ${entry.task}结果`);
  }

  function useAiResultAsArticleDraft(item) {
    if (currentUser?.role !== 'admin') {
      setAuthMode('login');
      setAuthMessage('请先登录管理员账号，再把 AI 候选填入文章表单');
      setActiveView('login');
      return;
    }

    const aiTags = (item.tags || []).map((tag) => String(tag).trim()).filter(Boolean);
    const aiContentBlock = [
      `## AI 候选：${item.title}`,
      '',
      item.summary,
      '',
      item.action ? `> ${item.action}` : '',
      '',
      '## 正文',
      ''
    ].filter((line, index, lines) => line || lines[index - 1]).join('\n');

    setEditingArticleId(null);
    setArticleForm((current) => {
      const currentTags = current.tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
      const mergedTags = Array.from(new Set([...currentTags, ...aiTags]));
      const hasContent = current.content.trim();

      return {
        ...current,
        title: current.title.trim() ? current.title : item.title,
        summary: current.summary.trim() ? current.summary : item.summary,
        content: hasContent
          ? `${current.content.trimEnd()}\n\n---\n\n${aiContentBlock}`
          : `# ${item.title}\n\n${item.summary}\n\n${item.action ? `## 写作提示\n\n- ${item.action}\n\n` : ''}## 正文\n\n`,
        tags: mergedTags.join(', '),
        date: current.date || new Date().toISOString().slice(0, 10),
        readTime: current.readTime || '3 min',
        status: 'draft',
        category: current.category || 'AI 草稿',
        pinned: false
      };
    });
    setAdminMessage('AI 候选已填入文章表单，状态已设为草稿');
    setActiveView('admin');
  }

  async function uploadAdminImage(file) {
    if (!file) return;
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }
    if (!ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type)) {
      setAdminMessage('图片上传失败：只支持 JPG、PNG、WebP、GIF 或 SVG');
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
      setAdminMessage('图片上传失败：图片不能超过 5 MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingImage(true);
    setAdminMessage('正在上传图片...');
    try {
      const response = await fetch('/api/admin/uploads/images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fallbackMessage = response.status === 413
          ? '图片上传失败：服务器上传上限太小，需要调整 Nginx client_max_body_size'
          : `图片上传失败：HTTP ${response.status}`;
        setAdminMessage(result.detail || fallbackMessage);
        return;
      }
      refreshUploadedImages({ resetMessage: false });
      refreshAdminAuditLogs();
      return result;
    } catch {
      setAdminMessage('后端服务不可用，图片上传失败');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function uploadArticleCover(file) {
    const image = await uploadAdminImage(file);
    if (!image?.url) return;
    updateArticleForm('coverUrl', image.url);
    setAdminMessage('图片已上传，封面图地址已填入');
  }

  async function uploadArticleContentImage(file, selectionStart, selectionEnd) {
    const image = await uploadAdminImage(file);
    if (!image?.url) return;

    const fallbackAlt = '文章图片';
    const filename = file?.name ? file.name.replace(/\.[^.]+$/, '').trim() : '';
    const altText = filename || fallbackAlt;
    const markdownImage = `![${altText}](${image.url})`;

    setArticleForm((current) => {
      const content = current.content || '';
      const safeStart = Number.isFinite(selectionStart) ? Math.max(0, Math.min(selectionStart, content.length)) : content.length;
      const safeEnd = Number.isFinite(selectionEnd) ? Math.max(safeStart, Math.min(selectionEnd, content.length)) : safeStart;
      const before = content.slice(0, safeStart);
      const after = content.slice(safeEnd);
      const leadingBreak = before && !before.endsWith('\n') ? '\n\n' : '';
      const trailingBreak = after && !after.startsWith('\n') ? '\n\n' : '';

      return {
        ...current,
        content: `${before}${leadingBreak}${markdownImage}${trailingBreak}${after}`
      };
    });
    setAdminMessage('图片已上传，Markdown 图片已插入正文');
  }

  function startEditingArticle(article) {
    setActiveView('admin');
    setEditingArticleId(article.id);
    setAdminMessage(`正在编辑：${article.title}`);
    setArticleForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      coverUrl: article.coverUrl || '',
      tags: article.tags.join(', '),
      date: article.date,
      readTime: article.readTime,
      status: article.status || 'published',
      category: article.category || '学习笔记',
      pinned: Boolean(article.pinned)
    });
  }

  async function submitArticleForm(event) {
    event.preventDefault();
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }

    setIsSavingArticle(true);
    setAdminMessage('');

    const submitterStatus = event.nativeEvent?.submitter?.value;
    const nextStatus = submitterStatus === 'draft' || submitterStatus === 'published'
      ? submitterStatus
      : articleForm.status;
    const payload = {
      title: articleForm.title,
      summary: articleForm.summary,
      content: articleForm.content,
      coverUrl: articleForm.coverUrl,
      tags: articleForm.tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      date: articleForm.date,
      readTime: articleForm.readTime,
      status: nextStatus,
      category: articleForm.category,
      pinned: articleForm.pinned
    };

    try {
      const response = await fetch(editingArticleId ? `/api/admin/articles/${editingArticleId}` : '/api/admin/articles', {
        method: editingArticleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setAdminMessage(error.detail || '保存失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      await refreshArticles();
      await refreshAdminAuditLogs();
      setAdminMessage(nextStatus === 'draft' ? '草稿已保存' : editingArticleId ? '文章已更新并发布' : '文章已发布');
      setArticleForm(createEmptyArticleForm());
      setEditingArticleId(null);
      clearArticleDraft('');
    } catch {
      setAdminMessage('后端服务不可用，保存失败');
    } finally {
      setIsSavingArticle(false);
    }
  }

  async function deleteArticle(article) {
    const typedTitle = window.prompt(`删除文章需要输入完整标题：${article.title}`);
    if (typedTitle !== article.title) {
      setAdminMessage('已取消删除：标题未匹配');
      return;
    }
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        setAdminMessage('删除失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      if (editingArticleId === article.id) {
        resetArticleForm();
      }
      await refreshArticles();
      await refreshAdminAuditLogs();
      setAdminMessage(`已删除：${article.title}`);
    } catch {
      setAdminMessage('后端服务不可用，删除失败');
    }
  }

  async function refreshUploadedImages({ resetMessage = true } = {}) {
    if (!authToken) return;

    setIsLoadingUploadedImages(true);
    try {
      const response = await fetch('/api/admin/uploads/images', {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      setUploadedImages(await response.json());
      if (resetMessage) {
        setAdminMessage('图片列表已刷新');
      }
    } catch {
      setAdminMessage('后端服务不可用，无法加载图片');
    } finally {
      setIsLoadingUploadedImages(false);
    }
  }

  async function copyUploadedImageUrl(image) {
    try {
      await navigator.clipboard.writeText(image.url);
      setAdminMessage(`已复制图片地址：${image.url}`);
    } catch {
      setAdminMessage(`复制失败，请手动复制：${image.url}`);
    }
  }

  async function deleteUploadedImage(image) {
    if (!window.confirm(`确定删除图片 ${image.filename} 吗？已发布文章中引用它会显示为失效图片。`)) return;

    try {
      const response = await fetch(`/api/admin/uploads/images/${encodeURIComponent(image.filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        setAdminMessage('图片删除失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      setUploadedImages((current) => current.filter((item) => item.filename !== image.filename));
      await refreshAdminAuditLogs();
      setAdminMessage('图片已删除');
    } catch {
      setAdminMessage('后端服务不可用，图片删除失败');
    }
  }

  async function refreshAdminComments({ resetPage = true } = {}) {
    if (!authToken) return;

    setIsLoadingAdminComments(true);
    try {
      const response = await fetch('/api/admin/comments', {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      setAdminComments(await response.json());
      if (resetPage) {
        setAdminCommentPage(0);
      }
    } catch {
      setAdminMessage('后端服务不可用，无法加载评论');
    } finally {
      setIsLoadingAdminComments(false);
    }
  }

  async function deleteAdminComment(comment) {
    if (!window.confirm(`确定删除 ${comment.authorName || '访客'} 的这条评论吗？`)) return;

    try {
      const response = await fetch(`/api/admin/comments/${comment.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        setAdminMessage('评论删除失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      setAdminComments((current) => current.filter((item) => item.id !== comment.id));
      setAdminCommentPage((currentPage) => {
        const remainingCount = Math.max(0, adminComments.length - 1);
        const maxPage = Math.max(0, Math.ceil(remainingCount / ADMIN_COMMENTS_PER_PAGE) - 1);
        return Math.min(currentPage, maxPage);
      });
      await refreshArticles();
      await refreshAdminAuditLogs();
      setAdminMessage('评论已删除');
    } catch {
      setAdminMessage('后端服务不可用，评论删除失败');
    }
  }

  async function approveAdminComment(comment) {
    try {
      const response = await fetch(`/api/admin/comments/${comment.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        setAdminMessage('评论审核失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }

      const updatedComment = await response.json();
      setAdminComments((current) =>
        current.map((item) => (item.id === updatedComment.id ? updatedComment : item))
      );
      await refreshArticles();
      await refreshAdminAuditLogs();
      setAdminMessage('评论已通过审核');
    } catch {
      setAdminMessage('后端服务不可用，评论审核失败');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="博客导航">
        <div className="brand">
          <img className="brand-mark" src="/avatar.jpg" alt="付江樊头像" />
          <div>
            <strong>{profile.name}</strong>
            <span>{profile.englishName}</span>
          </div>
        </div>

        <nav className="nav-list">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? 'nav-button active' : 'nav-button'}
                type="button"
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="login-panel">
          {currentUser ? (
            <>
              <span>管理员</span>
              <strong>{currentUser.displayName}</strong>
              <button className="icon-text-button" type="button" onClick={() => logout()}>
                <LogOut size={17} />
                <span>退出</span>
              </button>
            </>
          ) : (
            <>
              <span>后台账号</span>
              <button className="icon-text-button" type="button" onClick={() => setActiveView('login')}>
                <LogIn size={17} />
                <span>登录</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、正文或标签"
              aria-label="搜索标题、正文或标签"
            />
          </div>
          <div className="status-pill">
            <Zap size={16} />
            <span>本地 MVP</span>
          </div>
        </header>

        {activeView === 'overview' && <Overview profile={profile} articles={articles} setActiveView={setActiveView} currentUser={currentUser} />}

        {activeView === 'articles' && (
          <ArticleWorkspace
            articles={filteredArticles}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            tags={tags}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            archiveOptions={archiveOptions}
            selectedArchive={selectedArchive}
            setSelectedArchive={setSelectedArchive}
            selectedArticleId={selectedArticleId}
            setSelectedArticleId={setSelectedArticleId}
            openArticle={openArticle}
            reactions={reactions}
            reactionCounts={reactionCounts}
            toggleReaction={toggleReaction}
            comments={comments}
            commentDrafts={commentDrafts}
            commentReplyTargets={commentReplyTargets}
            setCommentDrafts={setCommentDrafts}
            setCommentReplyTargets={setCommentReplyTargets}
            submitComment={submitComment}
            interactionMessage={interactionMessage}
            currentUser={currentUser}
            commentPages={commentPages}
            setCommentPages={setCommentPages}
          />
        )}

        {activeView === 'ai' && currentUser?.role === 'admin' && (
          <AiWorkspace
            news={aiNews}
            articles={articles}
            useAiResultAsArticleDraft={useAiResultAsArticleDraft}
          />
        )}

        {activeView === 'game' && <GameWorkspace />}

        {activeView === 'plan' && <SummerPlanWorkspace currentUser={currentUser} authToken={authToken} />}

        {activeView === 'account' && currentUser && (
          <AccountWorkspace
            currentUser={currentUser}
            accountActivity={accountActivity}
            refreshAccountActivity={refreshAccountActivity}
            setActiveView={setActiveView}
            openArticle={(articleId) => {
              setActiveView('articles');
              openArticle(articleId);
            }}
          />
        )}

        {activeView === 'login' && (
          <LoginWorkspace
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            updateAuthForm={updateAuthForm}
            submitAuthForm={submitAuthForm}
            authMessage={authMessage}
            isAuthLoading={isAuthLoading}
            currentUser={currentUser}
            logout={logout}
            goToAdmin={() => setActiveView('admin')}
          />
        )}


        {activeView === 'admin' && currentUser?.role === 'admin' && (
          <AdminWorkspace
            articles={articles}
            articleForm={articleForm}
            updateArticleForm={updateArticleForm}
            editingArticleId={editingArticleId}
            isSavingArticle={isSavingArticle}
            isRunningArticleAi={isRunningArticleAi}
            isUploadingImage={isUploadingImage}
            uploadedImages={uploadedImages}
            isLoadingUploadedImages={isLoadingUploadedImages}
            articleDraftNotice={articleDraftNotice}
            adminMessage={adminMessage}
            adminStats={adminStats}
            adminAuditLogs={adminAuditLogs}
            isLoadingAuditLogs={isLoadingAuditLogs}
            refreshAdminStats={refreshAdminStats}
            refreshAdminAuditLogs={refreshAdminAuditLogs}
            aiSettings={aiSettings}
            aiTestForm={aiTestForm}
            setAiTestForm={setAiTestForm}
            aiTestMessage={aiTestMessage}
            isTestingAi={isTestingAi}
            testAiSettings={testAiSettings}
            refreshAiSettings={refreshAiSettings}
            aiGenerationHistory={aiGenerationHistory}
            submitArticleForm={submitArticleForm}
            uploadArticleCover={uploadArticleCover}
            uploadArticleContentImage={uploadArticleContentImage}
            refreshUploadedImages={refreshUploadedImages}
            copyUploadedImageUrl={copyUploadedImageUrl}
            deleteUploadedImage={deleteUploadedImage}
            runArticleAiTask={runArticleAiTask}
            undoLatestArticleAiResult={undoLatestArticleAiResult}
            restoreArticleDraft={restoreArticleDraft}
            clearArticleDraft={clearArticleDraft}
            resetArticleForm={resetArticleForm}
            startEditingArticle={startEditingArticle}
            deleteArticle={deleteArticle}
            adminComments={adminComments}
            adminCommentPage={adminCommentPage}
            setAdminCommentPage={setAdminCommentPage}
            adminCommentArticleFilter={adminCommentArticleFilter}
            setAdminCommentArticleFilter={setAdminCommentArticleFilter}
            adminCommentAuthorFilter={adminCommentAuthorFilter}
            setAdminCommentAuthorFilter={setAdminCommentAuthorFilter}
            adminCommentStatusFilter={adminCommentStatusFilter}
            setAdminCommentStatusFilter={setAdminCommentStatusFilter}
            isLoadingAdminComments={isLoadingAdminComments}
            refreshAdminComments={refreshAdminComments}
            approveAdminComment={approveAdminComment}
            deleteAdminComment={deleteAdminComment}
            currentUser={currentUser}
            logout={logout}
          />
        )}
      </main>
    </div>
  );
}

function Overview({ profile, articles, setActiveView, currentUser }) {
  const capabilityCards = [
    {
      title: '文章系统',
      summary: '支持 Markdown、LaTeX、图片上传、封面图、标签筛选、评论审核和阅读统计。',
      action: '浏览文章',
      view: 'articles',
      icon: BookOpen
    },
    {
      title: 'AI 工作台',
      summary: '已支持灵感、摘要、标题、草稿填入、后台润色续写、可控插入和撤回历史。',
      action: '打开 AI',
      view: 'ai',
      icon: Bot,
      adminOnly: true
    },
    {
      title: '小游戏',
      summary: '已嵌入 Card War 在线试玩，后续可接排行榜和统一登录后的分数记录。',
      action: '试玩游戏',
      view: 'game',
      icon: Gamepad2
    },
    {
      title: '写作后台',
      summary: '管理员可发布文章、管理图片、恢复本地草稿、审核评论和维护内容。',
      action: '进入后台',
      view: 'admin',
      icon: FilePenLine,
      adminOnly: true
    }
  ];

  return (
    <section className="workspace">
      <div className="profile-grid">
        <div className="profile-copy">
          <p className="eyebrow">{profile.school}</p>
          <h1>{profile.name}的个人博客</h1>
          <p className="summary">{profile.summary}</p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => setActiveView('articles')}>
              <BookOpen size={17} />
              <span>看文章</span>
            </button>
            {currentUser?.role === 'admin' && (
              <button className="ghost-button" type="button" onClick={() => setActiveView('ai')}>
                <Bot size={17} />
                <span>打开 AI 工作台</span>
              </button>
            )}
          </div>
          <div className="interest-row">
            {profile.interests.map((interest) => (
              <span key={interest}>{interest}</span>
            ))}
          </div>
        </div>
        <img className="profile-image" src="/avatar.jpg" alt="付江樊头像" />
      </div>

      <div className="metric-grid">
        {profile.metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <section className="content-band">
        <div className="section-heading">
          <p className="eyebrow">当前能力</p>
          <h2>博客已经从 MVP 进入 AI 模块阶段</h2>
        </div>
        <div className="capability-grid">
          {capabilityCards.filter((card) => !card.adminOnly || currentUser?.role === 'admin').map((card) => {
            const Icon = card.icon;
            return (
              <article className="capability-card" key={card.title}>
                <div>
                  <Icon size={20} />
                  <h3>{card.title}</h3>
                </div>
                <p>{card.summary}</p>
                <button type="button" onClick={() => setActiveView(card.view)}>
                  <span>{card.action}</span>
                  <ExternalLink size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <p className="eyebrow">最近文章</p>
          <h2>学习笔记和项目记录</h2>
        </div>
        <div className="article-list compact">
          {articles.slice(0, 3).map((article) => (
            <article className="article-card" key={article.id}>
              {article.coverUrl && <ArticleCover article={article} />}
              <span className="date">{article.date}</span>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <div className="tag-row">
                {article.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ArticleCover({ article, size = 'normal' }) {
  return (
    <figure className={`article-cover ${size === 'large' ? 'large' : ''}`.trim()}>
      <MarkdownImage src={article.coverUrl} alt={`${article.title} 封面图`} />
    </figure>
  );
}

function ArticleWorkspace({
  articles = [],
  categories = [],
  selectedCategory = ALL_FILTER,
  setSelectedCategory = () => {},
  tags = [],
  selectedTag = ALL_FILTER,
  setSelectedTag = () => {},
  archiveOptions = [],
  selectedArchive = ALL_ARCHIVE,
  setSelectedArchive = () => {},
  selectedArticleId,
  setSelectedArticleId,
  openArticle,
  reactions,
  reactionCounts,
  toggleReaction,
  comments,
  commentDrafts,
  commentReplyTargets,
  setCommentDrafts,
  setCommentReplyTargets,
  submitComment,
  interactionMessage,
  currentUser,
  commentPages,
  setCommentPages
}) {
  const selectedArticle = articles.find((article) => article.id === selectedArticleId) || null;
  const popularArticles = [...articles]
    .filter((article) => Number(article.viewCount || 0) > 0)
    .sort((first, second) => Number(second.viewCount || 0) - Number(first.viewCount || 0))
    .slice(0, 5);

  if (selectedArticle) {
    return (
      <ArticleDetail
        article={selectedArticle}
        reactions={reactions}
        reactionCounts={reactionCounts}
        toggleReaction={toggleReaction}
        comments={comments}
        commentDrafts={commentDrafts}
        commentReplyTargets={commentReplyTargets}
        setCommentDrafts={setCommentDrafts}
        setCommentReplyTargets={setCommentReplyTargets}
        submitComment={submitComment}
        interactionMessage={interactionMessage}
        currentUser={currentUser}
        commentPages={commentPages}
        setCommentPages={setCommentPages}
        onBack={() => setSelectedArticleId(null)}
      />
    );
  }

  return (
    <section className="workspace">
      <div className="section-heading">
        <p className="eyebrow">文章中心</p>
        <h1>学习笔记、项目记录和标签搜索</h1>
      </div>

      <div className="tag-filter" aria-label="文章标签筛选">
        {tags.map((tag) => (
          <button
            key={tag}
            className={selectedTag === tag ? 'tag-button active' : 'tag-button'}
            type="button"
            onClick={() => {
              setSelectedTag(tag);
              setSelectedArticleId(null);
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="archive-filter" aria-label="文章分类筛选">
        {categories.map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? 'archive-button active' : 'archive-button'}
            type="button"
            onClick={() => {
              setSelectedCategory(category);
              setSelectedArticleId(null);
            }}
          >
            <span>{category === ALL_FILTER ? '全部分类' : category}</span>
            <strong>{category === ALL_FILTER ? articles.length : articles.filter((article) => (article.category || '学习笔记') === category).length}</strong>
          </button>
        ))}
      </div>

      <div className="archive-filter" aria-label="文章月份归档">
        {archiveOptions.map((option) => (
          <button
            key={option.value}
            className={selectedArchive === option.value ? 'archive-button active' : 'archive-button'}
            type="button"
            onClick={() => {
              setSelectedArchive(option.value);
              setSelectedArticleId(null);
            }}
          >
            <span>{option.label}</span>
            <strong>{option.count}</strong>
          </button>
        ))}
      </div>

      {popularArticles.length > 0 && (
        <section className="popular-panel" aria-label="热门文章排行">
          <div className="popular-panel-heading">
            <h2>热门文章</h2>
            <span>按阅读次数排序</span>
          </div>
          <div className="popular-list">
            {popularArticles.map((article, index) => (
              <button type="button" key={article.id} onClick={() => openArticle(article.id)}>
                <strong>{index + 1}</strong>
                <span>{article.title}</span>
                <em>{article.viewCount || 0} 次阅读</em>
              </button>
            ))}
          </div>
        </section>
      )}

      {interactionMessage && <p className="interaction-message">{interactionMessage}</p>}

      {articles.length === 0 ? (
        <p className="empty-state">没有找到符合条件的文章</p>
      ) : (
        <div className="article-list">
          {articles.map((article) => (
            <article className="article-card article-preview" key={article.id}>
              {article.coverUrl && <ArticleCover article={article} />}
              <div className="article-meta">
                {article.pinned && <span>置顶</span>}
                <span>{article.category || '学习笔记'}</span>
                <span>{article.date}</span>
                <span>{article.readTime}</span>
                <span><Eye size={15} /> {article.viewCount || 0}</span>
              </div>
              <h2>{article.title}</h2>
              <p className="article-summary">{article.summary}</p>
              <div className="tag-row">
                {article.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button className="read-more-button" type="button" onClick={() => openArticle(article.id)}>
                阅读全文
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
function ArticleDetail({
  article,
  reactions,
  reactionCounts,
  toggleReaction,
  comments,
  commentDrafts,
  commentReplyTargets,
  setCommentDrafts,
  setCommentReplyTargets,
  submitComment,
  interactionMessage,
  currentUser,
  commentPages,
  setCommentPages,
  onBack
}) {
  const articleComments = comments[article.id] || [];
  const commentPageGroups = paginateComments(articleComments);
  const currentCommentPage = Math.min(
    commentPages[article.id] || 0,
    Math.max(commentPageGroups.length - 1, 0)
  );
  const visibleComments = commentPageGroups[currentCommentPage] || [];
  const draftLength = (commentDrafts[article.id] || '').length;
  const replyTarget = commentReplyTargets?.[article.id] || null;

  return (
    <section className="workspace article-detail-workspace">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>返回文章列表</span>
      </button>

      {interactionMessage && <p className="interaction-message">{interactionMessage}</p>}

      <article className="article-card article-detail-card">
        {article.coverUrl && <ArticleCover article={article} size="large" />}
        <div className="article-meta">
          {article.pinned && <span>置顶</span>}
          <span>{article.category || '学习笔记'}</span>
          <span>{article.date}</span>
          <span>{article.readTime}</span>
          <span><Eye size={15} /> {article.viewCount || 0}</span>
        </div>
        <h1>{article.title}</h1>
        <p className="article-summary">{article.summary}</p>
        <div className="tag-row">
          {article.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {article.content && (
          <MarkdownContent content={article.content} title={article.title} />
        )}

        <div className="reaction-row">
          <IconToggle
            active={reactions[article.id]?.like}
            label="点赞"
            count={reactionCounts[article.id]?.like || 0}
            icon={Heart}
            onClick={() => toggleReaction(article.id, 'like')}
          />
          <IconToggle
            active={reactions[article.id]?.favorite}
            label="收藏"
            count={reactionCounts[article.id]?.favorite || 0}
            icon={Star}
            onClick={() => toggleReaction(article.id, 'favorite')}
          />
          <IconToggle
            active={reactions[article.id]?.downvote}
            label="点踩"
            count={reactionCounts[article.id]?.downvote || 0}
            icon={ThumbsDown}
            onClick={() => toggleReaction(article.id, 'downvote')}
          />
          <IconToggle
            active={reactions[article.id]?.question}
            label="?"
            count={reactionCounts[article.id]?.question || 0}
            icon={CircleHelp}
            onClick={() => toggleReaction(article.id, 'question')}
          />
        </div>

        <div className="comment-box">
          <div className="comment-title">
            <MessageCircle size={17} />
            <span>评论</span>
          </div>
          {visibleComments.map((comment, index) => (
            <div className="comment" key={comment.id || `${article.id}-${currentCommentPage}-${index}`}>
              <div>
                <strong>{comment.authorName || '访客'}：</strong>
                {comment.replyToAuthor && <em>回复 {comment.replyToAuthor}</em>}
              </div>
              <span>{comment.content}</span>
              {currentUser && (
                <button
                  className="comment-reply-button"
                  type="button"
                  onClick={() =>
                    setCommentReplyTargets((current) => ({
                      ...current,
                      [article.id]: { id: comment.id, authorName: comment.authorName || '访客' }
                    }))
                  }
                >
                  回复
                </button>
              )}
            </div>
          ))}
          {articleComments.length === 0 && <p className="comment empty-comment">暂无评论</p>}
          {commentPageGroups.length > 1 && (
            <div className="comment-pagination">
              <button
                type="button"
                disabled={currentCommentPage === 0}
                onClick={() =>
                  setCommentPages((current) => ({
                    ...current,
                    [article.id]: Math.max(0, currentCommentPage - 1)
                  }))
                }
              >
                上一页
              </button>
              <span>{currentCommentPage + 1} / {commentPageGroups.length}</span>
              <button
                type="button"
                disabled={currentCommentPage >= commentPageGroups.length - 1}
                onClick={() =>
                  setCommentPages((current) => ({
                    ...current,
                    [article.id]: Math.min(commentPageGroups.length - 1, currentCommentPage + 1)
                  }))
                }
              >
                下一页
              </button>
            </div>
          )}
          <div className="comment-form">
            {replyTarget && (
              <div className="reply-target">
                <span>回复 {replyTarget.authorName}</span>
                <button
                  type="button"
                  onClick={() => setCommentReplyTargets((current) => ({ ...current, [article.id]: null }))}
                >
                  取消
                </button>
              </div>
            )}
            <input
              value={commentDrafts[article.id] || ''}
              maxLength={COMMENT_MAX_LENGTH}
              onChange={(event) =>
                setCommentDrafts((current) => ({
                  ...current,
                  [article.id]: event.target.value
                }))
              }
              placeholder={currentUser ? (replyTarget ? `回复 ${replyTarget.authorName}` : '写一条评论') : '登录后才能评论'}
              aria-label={`评论 ${article.title}`}
            />
            <button type="button" onClick={() => submitComment(article.id)}>
              发布
            </button>
          </div>
          <div className="comment-limit">
            {currentUser ? `将以 ${currentUser.displayName || currentUser.email} 身份评论` : '登录后才能评论'} · {draftLength} / {COMMENT_MAX_LENGTH}
          </div>
        </div>
      </article>
    </section>
  );
}

function getHeadingId(text, index) {
  const compact = String(text)
    .toLowerCase()
    .replace(/[`*_{}[\]().,，。！？!?:：;；/\\]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `heading-${index}-${compact || 'section'}`;
}

function getMarkdownHeadings(content) {
  return parseMarkdownBlocks(content)
    .map((block, index) => ({ ...block, index }))
    .filter((block) => block.type === 'heading')
    .map((block) => ({
      id: getHeadingId(block.text, block.index),
      level: block.level,
      text: block.text
    }));
}

function ArticleToc({ headings }) {
  return (
    <nav className="article-toc" aria-label="文章目录">
      <div className="article-toc-heading">文章目录</div>
      <div className="article-toc-list">
        {headings.map((heading) => (
          <a className={`toc-level-${heading.level}`} href={`#${heading.id}`} key={heading.id}>
            {renderInlineMarkdown(heading.text)}
          </a>
        ))}
      </div>
    </nav>
  );
}
function MarkdownContent({ content, title }) {
  const blocks = parseMarkdownBlocks(content);
  return (
    <div className="markdown-content" aria-label={`${title} 正文`}>
      {blocks.map((block, index) => renderMarkdownBlock(block, index))}
    </div>
  );
}

function MarkdownImage({ src, alt, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const imageAlt = alt || '文章图片';

  if (hasError) {
    return (
      <span className={`markdown-image-fallback ${className}`.trim()} role="note">
        图片暂时无法加载：{imageAlt}
      </span>
    );
  }

  return (
    <img
      className={className || undefined}
      src={src}
      alt={imageAlt}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

function parseMarkdownBlocks(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ type: 'code', language, text: codeLines.join('\n') });
      continue;
    }

    if (trimmed.startsWith('$$')) {
      let mathText = trimmed.slice(2).trim();
      if (mathText.endsWith('$$') && mathText.length > 2) {
        blocks.push({ type: 'math', text: mathText.slice(0, -2).trim() });
        index += 1;
        continue;
      }

      const mathLines = mathText ? [mathText] : [];
      index += 1;
      while (index < lines.length) {
        const mathLine = lines[index];
        const mathTrimmed = mathLine.trim();
        if (mathTrimmed.endsWith('$$')) {
          const closingText = mathLine.replace(/\$\$\s*$/, '').trimEnd();
          if (closingText) mathLines.push(closingText);
          index += 1;
          break;
        }
        mathLines.push(mathLine);
        index += 1;
      }
      blocks.push({ type: 'math', text: mathLines.join('\n').trim() });
      continue;
    }

    if (trimmed.startsWith('\\[')) {
      let mathText = trimmed.slice(2).trim();
      if (mathText.endsWith('\\]')) {
        blocks.push({ type: 'math', text: mathText.slice(0, -2).trim() });
        index += 1;
        continue;
      }

      const mathLines = mathText ? [mathText] : [];
      index += 1;
      while (index < lines.length) {
        const mathLine = lines[index];
        const mathTrimmed = mathLine.trim();
        if (mathTrimmed.endsWith('\\]')) {
          const closingText = mathLine.replace(/\\\]\s*$/, '').trimEnd();
          if (closingText) mathLines.push(closingText);
          index += 1;
          break;
        }
        mathLines.push(mathLine);
        index += 1;
      }
      blocks.push({ type: 'math', text: mathLines.join('\n').trim() });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider' });
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    const image = parseMarkdownImage(trimmed);
    if (image) {
      blocks.push({
        type: 'image',
        alt: image.alt,
        src: image.src,
        title: image.title || image.alt
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'orderedList', items });
      continue;
    }

    if (isMarkdownTableStart(lines, index)) {
      const headers = parseMarkdownTableRow(lines[index]);
      const alignments = parseMarkdownTableAlignments(lines[index + 1]);
      const rows = [];
      index += 2;
      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        rows.push(parseMarkdownTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', headers, rows, alignments });
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quotes = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quotes.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'quote', text: quotes.join(' ') });
      continue;
    }

    const paragraph = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !lines[index].trim().startsWith('$$') &&
      !lines[index].trim().startsWith('\\[') &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[index].trim()) &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !parseMarkdownImage(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim()) &&
      !isMarkdownTableStart(lines, index) &&
      !lines[index].trim().startsWith('>')
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

function parseMarkdownImage(text) {
  const image = text.match(/^!\[([^\]]*)\]\((.+)\)$/);
  if (!image) return null;

  const alt = image[1] || '';
  let source = image[2].trim();
  let title = '';
  const titleMatch = source.match(/^(.*?)\s+"([^"]+)"$/);
  if (titleMatch) {
    source = titleMatch[1].trim();
    title = titleMatch[2];
  }
  if (source.startsWith('<') && source.endsWith('>')) {
    source = source.slice(1, -1);
  }
  if (!source) return null;

  return { alt, src: source, title };
}

function isMarkdownTableRow(line) {
  const trimmed = line.trim();
  return trimmed.includes('|') && !trimmed.startsWith('```');
}

function parseMarkdownTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function isMarkdownTableSeparator(line) {
  if (!isMarkdownTableRow(line)) return false;
  const cells = parseMarkdownTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isMarkdownTableStart(lines, index) {
  return (
    index + 1 < lines.length &&
    isMarkdownTableRow(lines[index]) &&
    isMarkdownTableSeparator(lines[index + 1])
  );
}

function parseMarkdownTableAlignments(line) {
  return parseMarkdownTableRow(line).map((cell) => {
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
    if (cell.endsWith(':')) return 'right';
    return 'left';
  });
}

function renderMarkdownBlock(block, index) {
  if (block.type === 'heading') {
    const HeadingTag = block.level <= 1 ? 'h2' : block.level === 2 ? 'h3' : block.level === 3 ? 'h4' : 'h5';
    return <HeadingTag id={getHeadingId(block.text, index)} key={index}>{renderInlineMarkdown(block.text)}</HeadingTag>;
  }
  if (block.type === 'divider') {
    return <hr className="markdown-divider" key={index} />;
  }
  if (block.type === 'code') {
    return (
      <pre className="markdown-code" key={index}>
        {block.language && <span>{block.language}</span>}
        <code>{block.text}</code>
      </pre>
    );
  }
  if (block.type === 'math') {
    return <div className="markdown-math" key={index}>{renderMathExpression(block.text, true)}</div>;
  }
  if (block.type === 'image') {
    return (
      <figure className="markdown-image-block" key={index}>
        <MarkdownImage src={block.src} alt={block.alt || block.title || '文章图片'} />
        {(block.title || block.alt) && <figcaption>{block.title || block.alt}</figcaption>}
      </figure>
    );
  }
  if (block.type === 'list') {
    return (
      <ul key={index}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'orderedList') {
    return (
      <ol key={index}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
        ))}
      </ol>
    );
  }
  if (block.type === 'table') {
    return (
      <div className="markdown-table-wrap" key={index}>
        <table>
          <thead>
            <tr>
              {block.headers.map((cell, cellIndex) => (
                <th style={{ textAlign: block.alignments[cellIndex] || 'left' }} key={cellIndex}>
                  {renderInlineMarkdown(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {block.headers.map((_, cellIndex) => (
                  <td style={{ textAlign: block.alignments[cellIndex] || 'left' }} key={cellIndex}>
                    {renderInlineMarkdown(row[cellIndex] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === 'quote') {
    return <blockquote key={index}>{renderInlineMarkdown(block.text)}</blockquote>;
  }
  return <p key={index}>{renderInlineMarkdown(block.text)}</p>;
}

function renderMathExpression(source, displayMode = false, key) {
  const Tag = displayMode ? 'div' : 'span';
  const className = displayMode ? 'math-render math-render-block' : 'math-render math-render-inline';

  try {
    const html = katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: 'htmlAndMathml'
    });
    return <Tag className={className} key={key} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code className={className} key={key}>{source}</code>;
  }
}

function renderInlineMarkdown(text) {
  const parts = [];
  const pattern = /(!\[[^\]]*\]\([^)]+\)|\\\([^\n]+?\\\)|\$[^$\n]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const value = match[0];
    if (value.startsWith('![')) {
      const image = parseMarkdownImage(value);
      const alt = image?.alt || '';
      const src = image?.src || '';
      const title = image?.title || alt;
      parts.push(
        <span className="markdown-inline-image" key={parts.length}>
          <MarkdownImage src={src} alt={alt || title || '文章图片'} />
          {title && <span>{title}</span>}
        </span>
      );
    } else if (value.startsWith('$')) {
      parts.push(renderMathExpression(value.slice(1, -1), false, parts.length));
    } else if (value.startsWith('\\(')) {
      parts.push(renderMathExpression(value.slice(2, -2), false, parts.length));
    } else if (value.startsWith('`')) {
      parts.push(<code key={parts.length}>{value.slice(1, -1)}</code>);
    } else if (value.startsWith('**')) {
      parts.push(<strong key={parts.length}>{value.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={parts.length}>{value.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
function commentDisplayUnits(comment) {
  const length = Math.max(1, (comment.content || '').length);
  return Math.min(COMMENT_PAGE_UNITS, Math.max(1, Math.ceil(length / COMMENT_UNIT_CHARS)));
}

function paginateComments(commentList) {
  if (!commentList.length) return [[]];

  const pages = [];
  let currentPage = [];
  let currentUnits = 0;

  commentList.forEach((comment) => {
    const units = commentDisplayUnits(comment);
    if (currentPage.length > 0 && currentUnits + units > COMMENT_PAGE_UNITS) {
      pages.push(currentPage);
      currentPage = [];
      currentUnits = 0;
    }
    currentPage.push(comment);
    currentUnits += units;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function paginateFixedSize(items, pageSize) {
  if (!items.length) return [[]];

  const pages = [];
  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }
  return pages;
}

function uniqueCommentOptions(comments, primaryKey, fallbackKey) {
  const options = new Set();
  comments.forEach((comment) => {
    const value = (comment[primaryKey] || (fallbackKey ? comment[fallbackKey] : '') || '').trim();
    if (value) {
      options.add(value);
    }
  });
  return Array.from(options).sort((first, second) => first.localeCompare(second, 'zh-CN'));
}

function AiWorkspace({ news, articles, useAiResultAsArticleDraft }) {
  const aiModes = [
    { id: 'ideas', label: '文章灵感', description: '从主题生成选题、角度和标签建议。' },
    { id: 'summary', label: '摘要生成', description: '根据正文或主题生成短摘要和结构化摘要。' },
    { id: 'titles', label: '标题优化', description: '生成多个适合个人博客的标题候选。' }
  ];
  const [mode, setMode] = useState('ideas');
  const [form, setForm] = useState({
    topic: '个人博客 AI 模块',
    content: '',
    tone: '技术学习',
    tags: 'AI, 自动化, 博客'
  });
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [aiStatus, setAiStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const activeMode = aiModes.find((item) => item.id === mode) || aiModes[0];

  useEffect(() => {
    async function loadAiStatus() {
      try {
        const response = await fetch('/api/ai/status');
        if (response.ok) {
          setAiStatus(await response.json());
        }
      } catch {
        setAiStatus(null);
      }
    }

    loadAiStatus();
  }, []);

  function updateAiForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function generateAiResult(event) {
    event.preventDefault();
    setIsGenerating(true);
    setMessage('');

    try {
      const response = await fetch('/api/ai/workbench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          topic: form.topic,
          content: form.content,
          tone: form.tone,
          tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.detail || 'AI 工作台生成失败');
        return;
      }
      setResult(payload);
      setMessage(payload.message || '已生成候选内容');
    } catch {
      setMessage('后端服务不可用，AI 工作台暂时无法生成');
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyAiText(item) {
    const text = `${item.title}\n\n${item.summary}\n\n${(item.tags || []).join(', ')}`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage('已复制 AI 候选内容');
    } catch {
      setMessage('复制失败，请手动选择候选内容');
    }
  }

  return (
    <section className="workspace">
      <div className="section-heading">
        <p className="eyebrow">AI 工作台</p>
        <h1>写作灵感、摘要和标题优化</h1>
      </div>

      <div className="ai-workbench-grid">
        <form className="tool-panel ai-generator" onSubmit={generateAiResult}>
          {aiStatus && (
            <div className={aiStatus.configured ? 'ai-status ready' : 'ai-status'}>
              <span>{aiStatus.configured ? '真实模型已配置' : '本地占位模式'}</span>
              <strong>{aiStatus.provider} · {aiStatus.model}</strong>
              <p>{aiStatus.message}</p>
            </div>
          )}

          <div className="ai-mode-tabs" role="tablist" aria-label="AI 模式">
            {aiModes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === mode ? 'active' : ''}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div>
            <h2>{activeMode.label}</h2>
            <p>{activeMode.description}</p>
          </div>

          <label>
            <span>主题</span>
            <input
              value={form.topic}
              onChange={(event) => updateAiForm('topic', event.target.value)}
              placeholder="例如：个人博客 AI 模块"
            />
          </label>

          <label>
            <span>正文或背景材料</span>
            <textarea
              value={form.content}
              onChange={(event) => updateAiForm('content', event.target.value)}
              placeholder="可粘贴文章正文、项目背景或你想整理的碎片想法"
              rows={8}
            />
          </label>

          <div className="admin-form-grid compact">
            <label>
              <span>语气</span>
              <select value={form.tone} onChange={(event) => updateAiForm('tone', event.target.value)}>
                <option>技术学习</option>
                <option>个人博客</option>
                <option>项目复盘</option>
                <option>简洁正式</option>
              </select>
            </label>
            <label>
              <span>标签</span>
              <input
                value={form.tags}
                onChange={(event) => updateAiForm('tags', event.target.value)}
                placeholder="AI, 自动化"
              />
            </label>
          </div>

          <button className="primary-action" type="submit" disabled={isGenerating}>
            <Bot size={17} />
            <span>{isGenerating ? '生成中' : '生成候选'}</span>
          </button>

          {message && <p className="admin-message">{message}</p>}
        </form>

        <section className="tool-panel ai-result-panel">
          <div className="admin-panel-heading">
            <h2>生成结果</h2>
            <span>
              {result?.status === 'real'
                ? '真实模型'
                : result?.status === 'fallback'
                  ? '已回退'
                  : result?.provider === 'local-placeholder'
                    ? '本地占位'
                    : 'AI'}
            </span>
          </div>
          {result?.model && (
            <p className="ai-result-source">
              来源：{result.provider} · {result.model}
            </p>
          )}

          {!result ? (
            <p className="empty-state">选择一种模式并点击生成，这里会显示候选内容。</p>
          ) : (
            <div className="ai-result-list">
              {result.items.map((item) => (
                <article className="ai-result-card" key={`${result.mode}-${item.title}`}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                  <div className="tag-row">
                    {(item.tags || []).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="manager-actions">
                    <span>{item.action}</span>
                    <div className="ai-result-actions">
                      <button type="button" onClick={() => useAiResultAsArticleDraft(item)}>
                        <FilePenLine size={16} />
                        <span>填入表单</span>
                      </button>
                      <button type="button" onClick={() => copyAiText(item)}>
                        <Copy size={16} />
                        <span>复制</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tool-panel ai-reference-panel">
          <h2>参考素材</h2>
          <div className="ai-reference-list">
            {news.map((item) => (
              <article className="news-item" key={item.title}>
                <span>{item.source}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
            {articles.slice(0, 4).map((article) => (
              <article className="digest-item" key={article.id}>
                <strong>{article.title}</strong>
                <p>{article.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function normalizeDailyRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return personalizedTimeSlots;
  return rows.every((row) => Object.prototype.hasOwnProperty.call(row, 'time'))
    ? rows
    : personalizedTimeSlots;
}

function normalizeSummerPlan(plan) {
  return {
    ...personalizedSummerPlan,
    ...(plan || {}),
    profile: { ...personalizedSummerPlan.profile, ...(plan?.profile || {}) },
    goals: { ...personalizedSummerPlan.goals, ...(plan?.goals || {}) },
    daily: normalizeDailyRows(plan?.daily),
    courses: Array.isArray(plan?.courses) && plan.courses.length ? plan.courses : personalizedSummerPlan.courses,
    apps: Array.isArray(plan?.apps) && plan.apps.length ? plan.apps : personalizedSummerPlan.apps,
    expenses: Array.isArray(plan?.expenses) && plan.expenses.length ? plan.expenses : personalizedSummerPlan.expenses,
    meals: Array.isArray(plan?.meals) && plan.meals.length ? plan.meals : personalizedSummerPlan.meals,
    bodyMetrics: Array.isArray(plan?.bodyMetrics) && plan.bodyMetrics.length ? plan.bodyMetrics : personalizedSummerPlan.bodyMetrics,
    sleep: Array.isArray(plan?.sleep) && plan.sleep.length ? plan.sleep : personalizedSummerPlan.sleep
  };
}

function SummerPlanWorkspace({ currentUser, authToken }) {
  const canEdit = currentUser?.role === 'admin';
  const [plan, setPlan] = useState(() => normalizeSummerPlan(personalizedSummerPlan));
  const [saveMessage, setSaveMessage] = useState('正在读取数据库');
  const [hasLoadedPlan, setHasLoadedPlan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPlan() {
      try {
        const response = await fetch('/api/summer-plan');
        if (!response.ok) throw new Error('load failed');
        const payload = await response.json();
        if (!cancelled) {
          setPlan(normalizeSummerPlan(payload));
          setSaveMessage(canEdit ? '已连接数据库' : '登录管理员后可编辑保存');
        }
      } catch {
        if (!cancelled) {
          const localPlan = JSON.parse(localStorage.getItem(SUMMER_PLAN_KEY) || 'null');
          setPlan(normalizeSummerPlan(localPlan || personalizedSummerPlan));
          setSaveMessage('数据库暂不可用，显示本地模板');
        }
      } finally {
        if (!cancelled) setHasLoadedPlan(true);
      }
    }
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [canEdit]);

  useEffect(() => {
    if (!hasLoadedPlan) return undefined;
    localStorage.setItem(SUMMER_PLAN_KEY, JSON.stringify(plan));
    if (!canEdit) return undefined;

    setSaveMessage('正在保存到数据库');
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/admin/summer-plan', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken
          },
          body: JSON.stringify({ payload: plan })
        });
        if (!response.ok) throw new Error('save failed');
        await response.json();
        setSaveMessage(`已保存到数据库 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
      } catch {
        setSaveMessage('保存失败，请确认管理员登录状态');
      }
    }, 550);
    return () => window.clearTimeout(timer);
  }, [authToken, canEdit, hasLoadedPlan, plan]);

  function updateNested(section, field, value) {
    if (!canEdit) return;
    setPlan((current) => ({
      ...current,
      [section]: { ...(current[section] || {}), [field]: value }
    }));
  }

  function updateRow(section, rowId, field, value) {
    if (!canEdit) return;
    setPlan((current) => ({
      ...current,
      [section]: current[section].map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    }));
  }

  function addRow(section, row) {
    if (!canEdit) return;
    setPlan((current) => ({
      ...current,
      [section]: [...(current[section] || []), { ...row, id: `${section}-${Date.now()}` }]
    }));
  }

  function deleteRow(section, rowId) {
    if (!canEdit) return;
    setPlan((current) => ({
      ...current,
      [section]: current[section].filter((row) => row.id !== rowId)
    }));
  }

  function resetPlan() {
    if (!canEdit) return;
    setPlan(normalizeSummerPlan(personalizedSummerPlan));
    setSaveMessage('已恢复付江樊版模板');
  }

  async function copyPlanMarkdown() {
    const markdown = [
      `# ${plan.profile.name} 暑期计划`,
      '',
      `范围：${plan.profile.range}`,
      `身份：${plan.profile.identity}`,
      '',
      '## 课程预习',
      ...plan.courses.map((course) => `- ${course.name}：${course.target}（进度 ${course.progress || '0%'}）`),
      '',
      '## 每日时间段安排',
      '| 时间段 | 要做什么 | 重点/说明 | 类型 |',
      '|---|---|---|---|',
      ...plan.daily.map((row) => `| ${row.time || ' '} | ${row.activity || ' '} | ${row.focus || ' '} | ${row.type || ' '} |`)
    ].join('\n');

    try {
      await navigator.clipboard.writeText(markdown);
      setSaveMessage('已复制 Markdown');
    } catch {
      setSaveMessage('复制失败，可以手动选中内容');
    }
  }

  const totalAppLimit = plan.apps.reduce((sum, item) => sum + (parseFloat(item.limit) || 0), 0);
  const totalExpense = plan.expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <section className="workspace summer-plan-workspace">
      <div className="content-band summer-plan-hero">
        <div>
          <p className="eyebrow">Summer Sprint</p>
          <h1>{plan.profile.name}的暑期冲刺计划</h1>
          <p className="summary">{plan.profile.identity} · {plan.profile.range} · {plan.profile.theme}</p>
        </div>
        <div className="summer-plan-actions">
          <span className="status-pill inline">
            <Save size={16} />
            {saveMessage}
          </span>
          <button className="ghost-button" type="button" onClick={copyPlanMarkdown}>
            <Copy size={16} />
            <span>复制</span>
          </button>
          <button className="ghost-button" type="button" onClick={resetPlan} disabled={!canEdit}>
            <RefreshCw size={16} />
            <span>恢复模板</span>
          </button>
        </div>
      </div>

      {!canEdit && (
        <p className="summer-readonly-note">当前是查看模式。登录管理员账号后，修改会自动保存到后端数据库，并同步到不同设备。</p>
      )}

      <div className="summer-goal-grid">
        <PlanTextarea title="学习主线" value={plan.goals.study} disabled={!canEdit} onChange={(value) => updateNested('goals', 'study', value)} />
        <PlanTextarea title="运动与身体" value={plan.goals.body} disabled={!canEdit} onChange={(value) => updateNested('goals', 'body', value)} />
        <PlanTextarea title="娱乐边界" value={plan.goals.life} disabled={!canEdit} onChange={(value) => updateNested('goals', 'life', value)} />
      </div>

      <section className="content-band summer-plan-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>每日时间段安排</h2>
            <p>按时间段看一天该做什么，中间保留弹性时间；有额外活动时直接改对应格子。</p>
          </div>
          <button className="primary-action" type="button" onClick={() => addRow('daily', { time: '新增时间段', activity: '临时活动', focus: '', type: '弹性' })} disabled={!canEdit}>
            <PlusCircle size={17} />
            <span>新增时间段</span>
          </button>
        </div>
        <EditableTable
          columns={[
            ['time', '时间段', 'input'],
            ['activity', '要做什么', 'input'],
            ['focus', '重点 / 说明', 'textarea'],
            ['type', '类型', 'input']
          ]}
          disabled={!canEdit}
          rows={plan.daily}
          section="daily"
          updateRow={updateRow}
          deleteRow={deleteRow}
        />
      </section>

      <div className="summer-module-grid">
        <PlanModule title="课程预习进度" count={`${plan.courses.length} 门`}>
          <EditableTable
            compact
            columns={[
              ['name', '课程', 'input'],
              ['target', '目标', 'textarea'],
              ['progress', '进度', 'input']
            ]}
            disabled={!canEdit}
            rows={plan.courses}
            section="courses"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>

        <PlanModule title="手机应用使用时间" count={`目标 ${totalAppLimit || 0} 分钟`}>
          <EditableTable
            compact
            columns={[
              ['name', '应用', 'input'],
              ['limit', '每日上限', 'input'],
              ['actual', '实际使用', 'input']
            ]}
            disabled={!canEdit}
            rows={plan.apps}
            section="apps"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>

        <PlanModule title="记账" count={`合计 ${totalExpense.toFixed(1)} 元`}>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('expenses', { date: '8月4日', item: '', amount: '', note: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增支出</span>
          </button>
          <EditableTable
            compact
            columns={[
              ['date', '日期', 'input'],
              ['item', '项目', 'input'],
              ['amount', '金额', 'input'],
              ['note', '备注', 'input']
            ]}
            disabled={!canEdit}
            rows={plan.expenses}
            section="expenses"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>

        <PlanModule title="饮食记录" count={`${plan.meals.length} 天`}>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('meals', { date: '8月4日', breakfast: '', lunch: '', dinner: '', snack: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增饮食</span>
          </button>
          <EditableTable
            compact
            columns={[
              ['date', '日期', 'input'],
              ['breakfast', '早饭', 'input'],
              ['lunch', '午饭', 'input'],
              ['dinner', '晚饭', 'input'],
              ['snack', '加餐', 'input']
            ]}
            disabled={!canEdit}
            rows={plan.meals}
            section="meals"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>

        <PlanModule title="体重与指标" count={`${plan.bodyMetrics.length} 条`}>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('bodyMetrics', { date: '8月4日', weight: '', waist: '', exercise: '', mood: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增指标</span>
          </button>
          <EditableTable
            compact
            columns={[
              ['date', '日期', 'input'],
              ['weight', '体重', 'input'],
              ['waist', '腰围/指标', 'input'],
              ['exercise', '运动完成', 'input'],
              ['mood', '状态', 'input']
            ]}
            disabled={!canEdit}
            rows={plan.bodyMetrics}
            section="bodyMetrics"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>

        <PlanModule title="睡眠记录" count={`${plan.sleep.length} 条`}>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('sleep', { date: '8月4日', bed: '', wake: '', hours: '', quality: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增睡眠</span>
          </button>
          <EditableTable
            compact
            columns={[
              ['date', '日期', 'input'],
              ['bed', '入睡', 'input'],
              ['wake', '起床', 'input'],
              ['hours', '时长', 'input'],
              ['quality', '质量', 'input']
            ]}
            disabled={!canEdit}
            rows={plan.sleep}
            section="sleep"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>
      </div>
    </section>
  );
}

function PlanTextarea({ title, value, disabled, onChange }) {
  return (
    <label className="summer-goal-card">
      <span>{title}</span>
      <textarea value={value || ''} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PlanModule({ title, count, children }) {
  return (
    <section className="content-band summer-plan-panel">
      <div className="admin-panel-heading">
        <h2>{title}</h2>
        <span>{count}</span>
      </div>
      {children}
    </section>
  );
}

function EditableTable({ columns, rows, section, disabled, updateRow, deleteRow, compact = false }) {
  return (
    <div className="summer-table-wrap">
      <table className={compact ? 'summer-plan-table compact' : 'summer-plan-table'}>
        <thead>
          <tr>
            {columns.map(([, label]) => (
              <th key={label}>{label}</th>
            ))}
            <th aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map(([field, , type]) => (
                <td key={field}>
                  {type === 'textarea' ? (
                    <textarea value={row[field] || ''} disabled={disabled} onChange={(event) => updateRow(section, row.id, field, event.target.value)} />
                  ) : (
                    <input value={row[field] || ''} disabled={disabled} onChange={(event) => updateRow(section, row.id, field, event.target.value)} />
                  )}
                </td>
              ))}
              <td>
                <button className="compact-icon-button danger-button" type="button" onClick={() => deleteRow(section, row.id)} disabled={disabled} aria-label="删除这一行">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GameWorkspace() {
  const [frameKey, setFrameKey] = useState(0);

  return (
    <section className="workspace">
      <div className="section-heading">
        <p className="eyebrow">小游戏</p>
        <h1>{gameModule.title}</h1>
      </div>

      <div className="game-layout">
        <div className="game-details">
          <span className="status-pill inline">{gameModule.status}</span>
          <div className="game-copy">
            <h2>Card War 在线试玩</h2>
            <p>{gameModule.plan}</p>
          </div>
          <div className="game-actions">
            <button type="button" onClick={() => setFrameKey((current) => current + 1)}>
              <RefreshCw size={17} />
              <span>刷新游戏</span>
            </button>
            <a href={gameModule.playUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} />
              <span>新窗口打开</span>
            </a>
            <a className="secondary-link" href={gameModule.repository} target="_blank" rel="noreferrer">
              <Github size={17} />
              <span>查看仓库</span>
            </a>
          </div>
        </div>
        <div className="game-stage">
          <iframe
            key={frameKey}
            title="决斗小游戏"
            src={gameModule.playUrl}
            loading="lazy"
            allow="fullscreen; gamepad; autoplay"
          />
        </div>
      </div>
    </section>
  );
}

function AccountWorkspace({ currentUser, accountActivity, refreshAccountActivity, setActiveView, openArticle }) {
  const summary = accountActivity?.summary || {};
  const comments = accountActivity?.comments || [];
  const reactions = accountActivity?.reactions || [];
  const favoriteArticles = accountActivity?.favoriteArticles || [];

  return (
    <section className="workspace account-workspace">
      <div className="section-heading">
        <p className="eyebrow">账号中心</p>
        <h1>个人互动记录</h1>
      </div>

      <section className="tool-panel account-profile-panel">
        <div className="account-profile">
          {currentUser.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.displayName} />
          ) : (
            <div className="account-avatar-fallback">{(currentUser.displayName || 'F').slice(0, 1)}</div>
          )}
          <div>
            <h2>{currentUser.displayName}</h2>
            <p>{currentUser.email}</p>
            <span>{currentUser.role === 'admin' ? '管理员' : '读者'}</span>
          </div>
          <button className="ghost-button" type="button" onClick={refreshAccountActivity}>
            <RefreshCw size={16} />
            <span>刷新</span>
          </button>
        </div>

        <div className="release-metric-grid">
          <div className="release-metric">
            <span>评论</span>
            <strong>{summary.comments || 0}</strong>
          </div>
          <div className="release-metric">
            <span>互动</span>
            <strong>{summary.reactions || 0}</strong>
          </div>
          <div className="release-metric">
            <span>收藏</span>
            <strong>{summary.favorites || 0}</strong>
          </div>
        </div>
      </section>

      <div className="account-grid">
        <section className="tool-panel">
          <div className="admin-panel-heading">
            <h2>我的评论</h2>
            <span>{comments.length} 条</span>
          </div>
          {comments.length === 0 ? (
            <p className="empty-state">还没有评论</p>
          ) : (
            <div className="account-list">
              {comments.map((comment) => (
                <article key={comment.id}>
                  <strong>{comment.articleTitle}</strong>
                  <p>{comment.content}</p>
                  <span>{comment.status === 'pending' ? '待审核' : '已通过'} · {new Date(comment.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tool-panel">
          <div className="admin-panel-heading">
            <h2>我的互动</h2>
            <span>{reactions.length} 条</span>
          </div>
          {reactions.length === 0 ? (
            <p className="empty-state">还没有点赞、收藏或提问</p>
          ) : (
            <div className="account-list">
              {reactions.map((reaction) => (
                <article key={reaction.id}>
                  <strong>{reaction.articleTitle}</strong>
                  <p>{reactionLabel(reaction.type)}</p>
                  <span>{new Date(reaction.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="tool-panel">
          <div className="admin-panel-heading">
            <h2>我的收藏</h2>
            <span>{favoriteArticles.length} 篇</span>
          </div>
          {favoriteArticles.length === 0 ? (
            <p className="empty-state">还没有收藏文章</p>
          ) : (
            <div className="account-list favorite-article-list">
              {favoriteArticles.map((article) => (
                <article key={`${article.id}-${article.createdAt}`}>
                  <strong>{article.title}</strong>
                  {article.summary && <p>{article.summary}</p>}
                  <span>{article.date} · {article.readTime}</span>
                  <button className="ghost-button compact-button" type="button" onClick={() => openArticle(article.id)}>
                    <BookOpen size={15} />
                    <span>查看文章</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <button className="primary-action" type="button" onClick={() => setActiveView('articles')}>
        <BookOpen size={17} />
        <span>继续看文章</span>
      </button>
    </section>
  );
}

function reactionLabel(type) {
  return {
    like: '点赞',
    favorite: '收藏',
    downvote: '点踩',
    question: '提出疑问'
  }[type] || type;
}

function LoginWorkspace({
  authMode,
  setAuthMode,
  authForm,
  updateAuthForm,
  submitAuthForm,
  authMessage,
  isAuthLoading,
  currentUser,
  logout,
  goToAdmin
}) {
  if (currentUser) {
    return (
      <section className="workspace">
        <div className="section-heading">
          <p className="eyebrow">账号</p>
          <h1>{currentUser.role === 'admin' ? '已登录管理员账号' : '已登录读者账号'}</h1>
        </div>
        <div className="admin-panel auth-panel">
          <div className="auth-user">
            <ShieldCheck size={22} />
            <div>
              <strong>{currentUser.displayName}</strong>
              <span>{currentUser.email}</span>
            </div>
          </div>
          <div className="admin-actions">
            {currentUser.role === 'admin' && (
              <button className="primary-action" type="button" onClick={goToAdmin}>
                <FilePenLine size={17} />
                <span>进入后台</span>
              </button>
            )}
            <button className="ghost-button" type="button" onClick={() => logout()}>
              <LogOut size={17} />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace">
      <div className="section-heading">
        <p className="eyebrow">账号</p>
        <h1>账号登录</h1>
      </div>

      <form className="admin-panel admin-form auth-panel" onSubmit={submitAuthForm}>
        <a className="github-auth-button" href="/api/auth/github/start">
          <Github size={18} />
          <span>使用 GitHub 登录</span>
        </a>

        <div className="auth-divider">
          <span>或使用邮箱账号</span>
        </div>

        <div className="auth-mode-switch" aria-label="账号模式">
          <button
            type="button"
            className={authMode === 'login' ? 'active' : ''}
            onClick={() => setAuthMode('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={authMode === 'signup' ? 'active' : ''}
            onClick={() => setAuthMode('signup')}
          >
            注册普通用户
          </button>
          <button
            type="button"
            className={authMode === 'admin-register' ? 'active' : ''}
            onClick={() => setAuthMode('admin-register')}
          >
            初始化管理员
          </button>
        </div>

        {authMode !== 'login' && (
          <label>
            <span>显示名称</span>
            <input
              value={authForm.displayName}
              onChange={(event) => updateAuthForm('displayName', event.target.value)}
              placeholder="Felix Fu"
              required
            />
          </label>
        )}

        {authMode === 'admin-register' && (
          <label>
            <span>初始化密钥</span>
            <input
              type="password"
              value={authForm.setupToken}
              onChange={(event) => updateAuthForm('setupToken', event.target.value)}
              placeholder="服务器 ADMIN_SETUP_TOKEN"
              required
            />
          </label>
        )}

        <label>
          <span>邮箱</span>
          <input
            type="email"
            value={authForm.email}
            onChange={(event) => updateAuthForm('email', event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          <span>密码</span>
          <input
            type="password"
            value={authForm.password}
            onChange={(event) => updateAuthForm('password', event.target.value)}
            placeholder="至少 8 位"
            minLength={8}
            required
          />
        </label>

        <div className="admin-actions">
          <button className="primary-action" type="submit" disabled={isAuthLoading}>
            <LogIn size={17} />
            <span>{isAuthLoading ? '处理中' : authMode === 'signup' ? '注册' : authMode === 'admin-register' ? '初始化' : '登录'}</span>
          </button>
        </div>

        {authMessage && <p className="admin-message">{authMessage}</p>}
      </form>
    </section>
  );
}

function AdminWorkspace({
  articles,
  articleForm,
  updateArticleForm,
  editingArticleId,
  isSavingArticle,
  isRunningArticleAi,
  isUploadingImage,
  uploadedImages,
  isLoadingUploadedImages,
  articleDraftNotice,
  adminMessage,
  adminStats,
  adminAuditLogs,
  isLoadingAuditLogs,
  refreshAdminStats,
  refreshAdminAuditLogs,
  aiSettings,
  aiTestForm,
  setAiTestForm,
  aiTestMessage,
  isTestingAi,
  testAiSettings,
  refreshAiSettings,
  aiGenerationHistory,
  submitArticleForm,
  uploadArticleCover,
  uploadArticleContentImage,
  refreshUploadedImages,
  copyUploadedImageUrl,
  deleteUploadedImage,
  runArticleAiTask,
  undoLatestArticleAiResult,
  restoreArticleDraft,
  clearArticleDraft,
  resetArticleForm,
  startEditingArticle,
  deleteArticle,
  adminComments,
  adminCommentPage,
  setAdminCommentPage,
  adminCommentArticleFilter,
  setAdminCommentArticleFilter,
  adminCommentAuthorFilter,
  setAdminCommentAuthorFilter,
  adminCommentStatusFilter,
  setAdminCommentStatusFilter,
  isLoadingAdminComments,
  refreshAdminComments,
  approveAdminComment,
  deleteAdminComment,
  currentUser,
  logout
}) {
  const adminCommentArticleOptions = uniqueCommentOptions(adminComments, 'articleTitle', 'articleId');
  const adminCommentAuthorOptions = uniqueCommentOptions(adminComments, 'authorName');
  const filteredAdminComments = adminComments.filter((comment) => {
    const articleKey = comment.articleTitle || comment.articleId || '未命名文章';
    const authorKey = comment.authorName || '访客';
    const statusKey = comment.status || 'approved';
    return (
      (adminCommentArticleFilter === 'all' || articleKey === adminCommentArticleFilter) &&
      (adminCommentAuthorFilter === 'all' || authorKey === adminCommentAuthorFilter) &&
      (adminCommentStatusFilter === 'all' || statusKey === adminCommentStatusFilter)
    );
  });
  const adminCommentPageGroups = paginateFixedSize(filteredAdminComments, ADMIN_COMMENTS_PER_PAGE);
  const currentAdminCommentPage = Math.min(
    adminCommentPage,
    Math.max(adminCommentPageGroups.length - 1, 0)
  );
  const visibleAdminComments = adminCommentPageGroups[currentAdminCommentPage] || [];
  const publishedCount = articles.filter((article) => article.status !== 'draft').length;
  const draftCount = articles.filter((article) => article.status === 'draft').length;
  const pendingCommentCount = adminComments.filter((comment) => comment.status === 'pending').length;
  const releaseMetrics = [
    { label: '已发布文章', value: `${publishedCount} 篇` },
    { label: '草稿', value: `${draftCount} 篇` },
    { label: '待审评论', value: `${pendingCommentCount} 条` },
    { label: '图片资源', value: `${uploadedImages.length} 张` },
    { label: 'AI 生成记录', value: `${aiGenerationHistory.length} 条` },
  ];
  const readinessItems = [
    { label: '文章系统', done: articles.length > 0 },
    { label: '评论审核', done: true },
    { label: '图片上传', done: true },
    { label: '管理员登录', done: Boolean(currentUser?.role === 'admin') },
    { label: 'AI 写作辅助', done: true },
  ];
  const adminPageItems = [
    { id: 'overview', label: '总览', detail: '状态、统计、待办', icon: Star, count: `${publishedCount} 篇` },
    { id: 'ops', label: '运维', detail: '服务、部署、脚本', icon: ShieldCheck, count: '控制台' },
    { id: 'editor', label: '写文章', detail: editingArticleId ? '继续编辑当前文章' : '发布新内容', icon: FilePenLine, count: draftCount ? `${draftCount} 草稿` : 'Markdown' },
    { id: 'articles', label: '文章库', detail: '编辑、删除、置顶', icon: BookOpen, count: `${articles.length} 篇` },
    { id: 'media', label: '图片', detail: '上传资源和插入正文', icon: ImageIcon, count: `${uploadedImages.length} 张` },
    { id: 'comments', label: '评论', detail: '筛选、通过、删除', icon: MessageCircle, count: pendingCommentCount ? `${pendingCommentCount} 待审` : `${adminComments.length} 条` },
    { id: 'security', label: '安全', detail: '操作日志和删除保护', icon: ShieldCheck, count: `${adminAuditLogs.length} 条` },
    { id: 'ai', label: 'AI', detail: '模型配置和测试', icon: Bot, count: aiSettings?.configured ? '已配置' : '待配置' }
  ];
  const contentTextareaRef = useRef(null);
  const [aiInsertMode, setAiInsertMode] = useState('append');
  const [activeAdminPage, setActiveAdminPage] = useState('overview');
  const [adminStatsRange, setAdminStatsRange] = useState('7d');
  const [articleManagerQuery, setArticleManagerQuery] = useState('');
  const [articleManagerStatus, setArticleManagerStatus] = useState('all');
  const [articleManagerCategory, setArticleManagerCategory] = useState('all');
  const [imageManagerQuery, setImageManagerQuery] = useState('');
  const [imageManagerSort, setImageManagerSort] = useState('newest');
  const shouldShowAdminLayout = ['editor', 'articles', 'media', 'comments'].includes(activeAdminPage);
  const articleCategoryOptions = Array.from(
    new Set(articles.map((article) => article.category || '未分类'))
  ).sort((first, second) => first.localeCompare(second, 'zh-CN'));
  const filteredManagerArticles = articles.filter((article) => {
    const query = articleManagerQuery.trim().toLowerCase();
    const searchable = [article.title, article.summary, article.category, ...(article.tags || [])]
      .join(' ')
      .toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (articleManagerStatus === 'all' || (article.status || 'published') === articleManagerStatus) &&
      (articleManagerCategory === 'all' || (article.category || '未分类') === articleManagerCategory)
    );
  });
  const filteredUploadedImages = uploadedImages
    .filter((image) => {
      const query = imageManagerQuery.trim().toLowerCase();
      return !query || image.filename.toLowerCase().includes(query);
    })
    .sort((first, second) => {
      if (imageManagerSort === 'name') {
        return first.filename.localeCompare(second.filename, 'zh-CN');
      }
      if (imageManagerSort === 'largest') {
        return (second.size || 0) - (first.size || 0);
      }
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    });
  const rangeMultiplier = adminStatsRange === '7d' ? 0.32 : adminStatsRange === '30d' ? 0.78 : 1;
  const rangeStats = {
    views: Math.round((adminStats?.summary?.views || 0) * rangeMultiplier),
    comments: Math.round((adminStats?.summary?.comments || 0) * rangeMultiplier),
    users: Math.max(0, Math.round((adminStats?.summary?.users || 0) * rangeMultiplier)),
    drafts: adminStats?.summary?.drafts || draftCount,
  };

  function insertIntoContent(prefix, suffix = '', placeholder = '文本') {
    const textarea = contentTextareaRef.current;
    const content = articleForm.content || '';
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? start;
    const selected = content.slice(start, end) || placeholder;
    const nextText = `${prefix}${selected}${suffix}`;
    const nextContent = `${content.slice(0, start)}${nextText}${content.slice(end)}`;
    updateArticleForm('content', nextContent);
    window.setTimeout(() => {
      textarea?.focus();
      const cursor = start + nextText.length;
      textarea?.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function insertContentSnippet(snippet) {
    const textarea = contentTextareaRef.current;
    const content = articleForm.content || '';
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? start;
    const nextContent = `${content.slice(0, start)}${snippet}${content.slice(end)}`;
    updateArticleForm('content', nextContent);
    window.setTimeout(() => {
      textarea?.focus();
      const cursor = start + snippet.length;
      textarea?.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function insertImageMarkdown(url, filename = '文章图片') {
    const altText = filename.replace(/\.[^.]+$/, '') || '文章图片';
    insertContentSnippet(`![${altText}](${url})`);
  }

  function handleRunArticleAiTask(task) {
    const textarea = contentTextareaRef.current;
    const content = articleForm.content || '';
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const selectedText = start !== end ? content.slice(start, end) : '';
    runArticleAiTask(task, selectedText, aiInsertMode, { start, end });
  }

  function openAdminPage(pageId) {
    setActiveAdminPage(pageId);
  }

  function handleStartEditingArticle(article) {
    startEditingArticle(article);
    setActiveAdminPage('editor');
  }

  function handleInsertUploadedImage(image) {
    insertImageMarkdown(image.url, image.filename);
    setActiveAdminPage('editor');
  }

  return (
    <section className="workspace">
      <div className="section-heading">
        <p className="eyebrow">管理后台</p>
        <h1>管理工具台</h1>
      </div>

      <div className="admin-session">
        <div>
          <ShieldCheck size={18} />
          <span>{currentUser.displayName}</span>
        </div>
        <button className="ghost-button" type="button" onClick={() => logout()}>
          <LogOut size={17} />
          <span>退出</span>
        </button>
      </div>

      <nav className="admin-page-nav" aria-label="后台页面">
        {adminPageItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activeAdminPage === item.id ? 'admin-page-card active' : 'admin-page-card'}
              key={item.id}
              type="button"
              onClick={() => openAdminPage(item.id)}
              aria-pressed={activeAdminPage === item.id}
            >
              <span className="admin-page-card-icon">
                <Icon size={19} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
              </span>
              <small>{item.count}</small>
            </button>
          );
        })}
      </nav>

      {activeAdminPage === 'ops' && <ProjectOpsPanel authToken={authToken} />}

      {activeAdminPage === 'overview' && (
        <>
          <section className="admin-panel admin-home-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>今天先看这里</h2>
                <span>常用动作拆开了，不用在一屏里翻到眼花</span>
              </div>
            </div>
            <div className="admin-home-actions">
              <button className="primary-action" type="button" onClick={() => openAdminPage('editor')}>
                <FilePenLine size={17} />
                <span>写文章</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('articles')}>
                <BookOpen size={17} />
                <span>管理文章</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('comments')}>
                <MessageCircle size={17} />
                <span>处理评论</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('ops')}>
                <ShieldCheck size={17} />
                <span>看运维</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('security')}>
                <ShieldCheck size={17} />
                <span>安全日志</span>
              </button>
            </div>
          </section>

      <section className="admin-panel release-panel">
        <div className="admin-panel-heading">
          <h2>2.0 发布状态</h2>
          <span>Review Candidate</span>
        </div>
        <div className="release-metric-grid">
          {releaseMetrics.map((metric) => (
            <div className="release-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
        <div className="release-checks">
          {readinessItems.map((item) => (
            <span className={item.done ? 'ready' : ''} key={item.label}>
              <CheckCircle2 size={15} />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <section className="admin-panel analytics-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>站点统计</h2>
            <span>{adminStatsRange === '7d' ? '近 7 天估算' : adminStatsRange === '30d' ? '近 30 天估算' : '全部数据'}</span>
          </div>
          <div className="manager-actions">
            <div className="ai-insert-mode" role="group" aria-label="统计范围">
              {[
                ['7d', '近 7 天'],
                ['30d', '近 30 天'],
                ['all', '全部']
              ].map(([id, label]) => (
                <button
                  className={adminStatsRange === id ? 'active' : ''}
                  key={id}
                  type="button"
                  onClick={() => setAdminStatsRange(id)}
                  aria-pressed={adminStatsRange === id}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="ghost-button" type="button" onClick={refreshAdminStats}>
              <RefreshCw size={16} />
              <span>刷新</span>
            </button>
          </div>
        </div>
        <div className="release-metric-grid">
          {[
            ['阅读', rangeStats.views],
            ['用户', rangeStats.users],
            ['评论', rangeStats.comments],
            ['待审评论', adminStats?.summary?.pendingComments || 0],
            ['草稿', rangeStats.drafts]
          ].map(([label, value]) => (
            <div className="release-metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="analytics-grid">
          <div>
            <h3>热门文章</h3>
            {(adminStats?.topArticles || []).map((article) => (
              <p key={article.id}>
                <span>{article.title}</span>
                <strong>{article.views} 次</strong>
              </p>
            ))}
          </div>
          <div>
            <h3>分类分布</h3>
            {(adminStats?.categories || []).map((category) => (
              <p key={category.name}>
                <span>{category.name}</span>
                <strong>{category.count} 篇</strong>
              </p>
            ))}
          </div>
        </div>
        <div className="admin-insight-grid">
          <div>
            <h3>热门标签</h3>
            <div className="tag-row">
              {(adminStats?.tags || []).length === 0 ? (
                <span>暂无标签数据</span>
              ) : (
                adminStats.tags.map((tag) => (
                  <span key={tag.name}>{tag.name} · {tag.count}</span>
                ))
              )}
            </div>
          </div>
          <div>
            <h3>需要处理</h3>
            <p>{pendingCommentCount > 0 ? `${pendingCommentCount} 条评论等待审核` : '评论区暂时干净'}</p>
            <p>{draftCount > 0 ? `${draftCount} 篇草稿可以继续加工` : '没有积压草稿'}</p>
          </div>
        </div>
      </section>
        </>
      )}

      {activeAdminPage === 'ai' && (
      <section className="admin-panel ai-settings-panel">
        <div className="admin-panel-heading">
          <h2>AI 设置和测试</h2>
          <button className="ghost-button" type="button" onClick={refreshAiSettings}>
            <RefreshCw size={16} />
            <span>读取配置</span>
          </button>
        </div>
        <div className={aiSettings?.configured ? 'ai-status ready' : 'ai-status'}>
          <span>{aiSettings?.configured ? '真实模型已配置' : '真实模型未完整配置'}</span>
          <strong>{aiSettings?.provider || 'local-placeholder'} · {aiSettings?.model || '未配置'}</strong>
          <p>{aiSettings?.note || '密钥不会从接口返回；请用一次性测试框验证真实模型。'}</p>
        </div>
        <form className="ai-test-form" onSubmit={testAiSettings}>
          <input
            value={aiTestForm.providerName}
            onChange={(event) => setAiTestForm((current) => ({ ...current, providerName: event.target.value }))}
            placeholder="Provider 名称"
          />
          <select
            value={aiTestForm.apiStyle}
            onChange={(event) => setAiTestForm((current) => ({ ...current, apiStyle: event.target.value }))}
            aria-label="AI 接口类型"
          >
            <option value="openai">OpenAI 兼容</option>
            <option value="codex">Codex 中转</option>
          </select>
          <input
            value={aiTestForm.baseUrl}
            onChange={(event) => setAiTestForm((current) => ({ ...current, baseUrl: event.target.value }))}
            placeholder="Base URL，例如 https://api.openai.com/v1 或 Codex 中转地址"
          />
          <input
            value={aiTestForm.model}
            onChange={(event) => setAiTestForm((current) => ({ ...current, model: event.target.value }))}
            placeholder="模型名"
          />
          <input
            type="password"
            value={aiTestForm.apiKey}
            onChange={(event) => setAiTestForm((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder="API Key，仅用于本次测试"
          />
          <button className="primary-action" type="submit" disabled={isTestingAi}>
            <Bot size={17} />
            <span>{isTestingAi ? '测试中' : '测试 AI'}</span>
          </button>
        </form>
        {aiTestMessage && <p className="admin-message">{aiTestMessage}</p>}
      </section>
      )}

      {activeAdminPage === 'security' && (
        <section className="admin-panel security-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>安全和操作日志</h2>
              <span>删除、上传、审核、发布等动作会进入这里</span>
            </div>
            <button className="ghost-button" type="button" onClick={refreshAdminAuditLogs}>
              <RefreshCw size={16} />
              <span>{isLoadingAuditLogs ? '刷新中' : '刷新'}</span>
            </button>
          </div>

          <div className="security-rule-grid">
            <article>
              <strong>文章删除保护</strong>
              <span>删除文章前必须输入完整标题，减少误删。</span>
            </article>
            <article>
              <strong>图片上传限制</strong>
              <span>仅允许常见图片格式，单张不超过 5 MB。</span>
            </article>
            <article>
              <strong>后台接口权限</strong>
              <span>后台接口都需要管理员 Token。</span>
            </article>
          </div>

          <div className="ops-list">
            {adminAuditLogs.length === 0 ? (
              <p className="empty-state">{isLoadingAuditLogs ? '正在加载操作日志' : '暂无管理员操作日志'}</p>
            ) : (
              adminAuditLogs.map((log) => (
                <article className="ops-list-row" key={log.id}>
                  <div>
                    <strong>{log.action} · {log.targetLabel || log.targetType || '后台'}</strong>
                    <span>{log.operator} · {new Date(log.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                    {log.detail && <span>{log.detail}</span>}
                  </div>
                  <code>{log.targetType || 'admin'}</code>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {shouldShowAdminLayout && (
      <div className={activeAdminPage === 'editor' ? 'admin-layout' : 'admin-layout admin-layout-single'}>
        {activeAdminPage === 'editor' && (
        <form className="admin-panel admin-form" onSubmit={submitArticleForm}>
          <div className="admin-panel-heading">
            <h2>{editingArticleId ? '编辑文章' : '发布文章'}</h2>
            {editingArticleId && (
              <button className="ghost-button" type="button" onClick={resetArticleForm}>
                <X size={17} />
                <span>取消编辑</span>
              </button>
            )}
          </div>

          {articleDraftNotice && (
            <div className="draft-notice">
              <span>{articleDraftNotice}</span>
              <div>
                <button className="ghost-button" type="button" onClick={restoreArticleDraft}>
                  <RefreshCw size={16} />
                  <span>恢复</span>
                </button>
                <button className="ghost-button" type="button" onClick={() => clearArticleDraft('')}>
                  <X size={16} />
                  <span>丢弃</span>
                </button>
              </div>
            </div>
          )}

          <label>
            <span>标题</span>
            <input
              value={articleForm.title}
              onChange={(event) => updateArticleForm('title', event.target.value)}
              placeholder="输入文章标题"
              required
            />
          </label>

          <label>
            <span>摘要</span>
            <textarea
              value={articleForm.summary}
              onChange={(event) => updateArticleForm('summary', event.target.value)}
              placeholder="用于文章列表展示的短摘要"
              rows={3}
              required
            />
          </label>

          <label>
            <span>封面图地址</span>
            <input
              value={articleForm.coverUrl}
              onChange={(event) => updateArticleForm('coverUrl', event.target.value)}
              placeholder="/articles/git-workflow.svg 或 https://..."
            />
          </label>

          <label className="file-upload-control">
            <span>{isUploadingImage ? '上传中...' : '上传封面图'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              disabled={isUploadingImage}
              onChange={(event) => {
                uploadArticleCover(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>

          {articleForm.coverUrl.trim() && (
            <div className="article-form-cover-preview">
              <MarkdownImage src={articleForm.coverUrl.trim()} alt="封面图预览" />
            </div>
          )}

          <label>
            <span>正文</span>
            <div className="ai-editor-tools" aria-label="AI 写作辅助">
              <div className="ai-insert-mode" role="group" aria-label="AI 结果插入方式">
                {[
                  { id: 'append', label: '追加' },
                  { id: 'insert', label: '插入' },
                  { id: 'replace', label: '替换' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={aiInsertMode === item.id ? 'active' : ''}
                    onClick={() => setAiInsertMode(item.id)}
                    aria-pressed={aiInsertMode === item.id}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button type="button" disabled={isRunningArticleAi} onClick={() => handleRunArticleAiTask('polish')}>
                <Bot size={16} />
                <span>AI 润色</span>
              </button>
              <button type="button" disabled={isRunningArticleAi} onClick={() => handleRunArticleAiTask('continue')}>
                <PlusCircle size={16} />
                <span>AI 续写</span>
              </button>
              <button type="button" disabled={isRunningArticleAi} onClick={() => handleRunArticleAiTask('outline')}>
                <List size={16} />
                <span>AI 大纲</span>
              </button>
            </div>
            <div className="markdown-toolbar" aria-label="Markdown 工具栏">
              <button type="button" title="二级标题" onClick={() => insertIntoContent('## ', '', '小标题')}>
                <Heading2 size={16} />
              </button>
              <button type="button" title="加粗" onClick={() => insertIntoContent('**', '**', '加粗文字')}>
                <strong>B</strong>
              </button>
              <button type="button" title="列表" onClick={() => insertIntoContent('- ', '', '列表项')}>
                <List size={16} />
              </button>
              <button type="button" title="引用" onClick={() => insertIntoContent('> ', '', '引用内容')}>
                <Quote size={16} />
              </button>
              <button type="button" title="代码块" onClick={() => insertIntoContent('```js\n', '\n```', 'console.log("Hello Felix")')}>
                <Code2 size={16} />
              </button>
              <button type="button" title="公式" onClick={() => insertIntoContent('\n$$\n', '\n$$\n', 'E = mc^2')}>
                <Sigma size={16} />
              </button>
            </div>
            <textarea
              ref={contentTextareaRef}
              value={articleForm.content}
              onChange={(event) => updateArticleForm('content', event.target.value)}
              placeholder="先支持纯文本/Markdown 内容，后续再加预览"
              rows={10}
              required
            />
          </label>

          <div className="admin-inline-tools">
            <label className="file-upload-control">
              <span>{isUploadingImage ? '上传中...' : '上传正文图片'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                disabled={isUploadingImage}
                onChange={(event) => {
                  const textarea = contentTextareaRef.current;
                  uploadArticleContentImage(
                    event.target.files?.[0],
                    textarea?.selectionStart,
                    textarea?.selectionEnd
                  );
                  event.target.value = '';
                }}
              />
            </label>
          </div>

          {articleForm.content.trim() && (
            <section className="article-preview-panel" aria-label="文章预览">
              <div className="admin-panel-heading">
                <h3>正文预览</h3>
                <span>Markdown / LaTeX</span>
              </div>
              <MarkdownContent content={articleForm.content} title={articleForm.title || '文章预览'} />
            </section>
          )}

          <div className="admin-form-grid">
            <label>
              <span>分类</span>
              <input
                value={articleForm.category}
                onChange={(event) => updateArticleForm('category', event.target.value)}
                placeholder="学习笔记 / 项目复盘 / AI"
              />
            </label>
            <label>
              <span>标签</span>
              <input
                value={articleForm.tags}
                onChange={(event) => updateArticleForm('tags', event.target.value)}
                placeholder="React, FastAPI, 学习"
              />
            </label>
            <label>
              <span>日期</span>
              <input
                type="date"
                value={articleForm.date}
                onChange={(event) => updateArticleForm('date', event.target.value)}
              />
            </label>
            <label>
              <span>阅读时长</span>
              <input
                value={articleForm.readTime}
                onChange={(event) => updateArticleForm('readTime', event.target.value)}
                placeholder="3 min"
              />
            </label>
            <label>
              <span>状态</span>
              <select
                value={articleForm.status}
                onChange={(event) => updateArticleForm('status', event.target.value)}
              >
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
            </label>
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={articleForm.pinned}
                onChange={(event) => updateArticleForm('pinned', event.target.checked)}
              />
              <span>置顶文章</span>
            </label>
          </div>

          <div className="admin-actions">
            <button className="ghost-button" type="submit" value="draft" disabled={isSavingArticle}>
              <Save size={17} />
              <span>{isSavingArticle ? '保存中' : '保存草稿'}</span>
            </button>
            <button className="primary-action" type="submit" value="published" disabled={isSavingArticle}>
              {editingArticleId ? <Save size={17} /> : <PlusCircle size={17} />}
              <span>{isSavingArticle ? '发布中' : editingArticleId ? '发布修改' : '发布文章'}</span>
            </button>
            <button className="ghost-button" type="button" onClick={() => openAdminPage('articles')}>
              <BookOpen size={17} />
              <span>回文章库</span>
            </button>
            <button className="ghost-button" type="button" onClick={resetArticleForm}>
              <X size={17} />
              <span>清空</span>
            </button>
          </div>

          {adminMessage && <p className="admin-message">{adminMessage}</p>}
        </form>
        )}

        {activeAdminPage === 'articles' && (
        <section className="admin-panel article-manager">
          <div className="admin-panel-heading">
            <h2>已有文章</h2>
            <span>{filteredManagerArticles.length} / {articles.length} 篇</span>
          </div>

          <div className="admin-filter-bar">
            <input
              value={articleManagerQuery}
              onChange={(event) => setArticleManagerQuery(event.target.value)}
              placeholder="搜索标题、摘要、分类或标签"
              aria-label="搜索文章"
            />
            <select
              value={articleManagerStatus}
              onChange={(event) => setArticleManagerStatus(event.target.value)}
              aria-label="文章状态"
            >
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
            <select
              value={articleManagerCategory}
              onChange={(event) => setArticleManagerCategory(event.target.value)}
              aria-label="文章分类"
            >
              <option value="all">全部分类</option>
              {articleCategoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="manager-list">
            {filteredManagerArticles.length === 0 ? (
              <p className="empty-state">没有符合条件的文章</p>
            ) : filteredManagerArticles.map((article) => (
              <article className="manager-row" key={article.id}>
                <div>
                  <div className="manager-title-line">
                    <h3>{article.title}</h3>
                    <span className={article.status === 'draft' ? 'status-badge draft' : 'status-badge'}>{article.status === 'draft' ? '草稿' : '已发布'}</span>
                  </div>
                  <p>{article.summary}</p>
                  <div className="tag-row">
                    {article.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="manager-actions">
                  <button type="button" onClick={() => handleStartEditingArticle(article)}>
                    <PencilLine size={17} />
                    <span>编辑</span>
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteArticle(article)}>
                    <Trash2 size={17} />
                    <span>删除</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        )}

        {activeAdminPage === 'editor' && (
        <section className="admin-panel ai-history-panel">
          <div className="admin-panel-heading">
            <h2>AI 生成历史</h2>
            <span>{aiGenerationHistory.length} 条</span>
          </div>
          {aiGenerationHistory.length === 0 ? (
            <p className="empty-state">暂无 AI 写作记录</p>
          ) : (
            <div className="ai-history-list">
              {aiGenerationHistory.map((entry, index) => (
                <article className="ai-history-item" key={entry.id}>
                  <div>
                    <strong>{entry.task}</strong>
                    <span>{entry.mode} · {entry.source} · {new Date(entry.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                  </div>
                  {index === 0 && entry.beforeContent !== undefined && (
                    <button className="ghost-button" type="button" onClick={() => undoLatestArticleAiResult(entry)}>
                      <RefreshCw size={16} />
                      <span>撤回</span>
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
        )}

        {activeAdminPage === 'media' && (
        <section className="admin-panel image-manager">
          <div className="admin-panel-heading">
            <h2>图片管理</h2>
            <div className="manager-actions">
              <span>{isLoadingUploadedImages ? '加载中' : `${filteredUploadedImages.length} / ${uploadedImages.length} 张`}</span>
              <button type="button" onClick={() => refreshUploadedImages()}>
                <RefreshCw size={17} />
                <span>刷新</span>
              </button>
            </div>
          </div>

          <div className="admin-filter-bar">
            <input
              value={imageManagerQuery}
              onChange={(event) => setImageManagerQuery(event.target.value)}
              placeholder="搜索图片文件名"
              aria-label="搜索图片"
            />
            <select
              value={imageManagerSort}
              onChange={(event) => setImageManagerSort(event.target.value)}
              aria-label="图片排序"
            >
              <option value="newest">最新上传</option>
              <option value="largest">文件最大</option>
              <option value="name">文件名</option>
            </select>
          </div>

          <div className="image-resource-grid">
            {uploadedImages.length === 0 ? (
              <p className="empty-state">暂无上传图片</p>
            ) : filteredUploadedImages.length === 0 ? (
              <p className="empty-state">没有符合条件的图片</p>
            ) : (
              filteredUploadedImages.map((image) => (
                <article className="image-resource" key={image.filename}>
                  <div className="image-resource-preview">
                    <MarkdownImage src={image.url} alt={image.filename} />
                  </div>
                  <div className="image-resource-meta">
                    <strong title={image.filename}>{image.filename}</strong>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                  <div className="manager-actions">
                    <button type="button" onClick={() => copyUploadedImageUrl(image)}>
                      <Copy size={16} />
                      <span>复制</span>
                    </button>
                    <button type="button" onClick={() => handleInsertUploadedImage(image)}>
                      <ImageIcon size={16} />
                      <span>插入</span>
                    </button>
                    <button className="danger-button" type="button" onClick={() => deleteUploadedImage(image)}>
                      <Trash2 size={16} />
                      <span>删除</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
        )}

        {activeAdminPage === 'comments' && (
        <section className="admin-panel comment-manager">
          <div className="admin-panel-heading">
            <h2>评论管理</h2>
            <div className="manager-actions">
              <span>{isLoadingAdminComments ? '加载中' : `${filteredAdminComments.length} / ${adminComments.length} 条`}</span>
              <button type="button" onClick={() => refreshAdminComments()}>
                <RefreshCw size={17} />
                <span>刷新</span>
              </button>
            </div>
          </div>

          <div className="comment-filter-row">
            <label>
              <span>文章</span>
              <select
                value={adminCommentArticleFilter}
                onChange={(event) => {
                  setAdminCommentArticleFilter(event.target.value);
                  setAdminCommentPage(0);
                }}
              >
                <option value="all">全部文章</option>
                {adminCommentArticleOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>作者</span>
              <select
                value={adminCommentAuthorFilter}
                onChange={(event) => {
                  setAdminCommentAuthorFilter(event.target.value);
                  setAdminCommentPage(0);
                }}
              >
                <option value="all">全部作者</option>
                {adminCommentAuthorOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>状态</span>
              <select
                value={adminCommentStatusFilter}
                onChange={(event) => {
                  setAdminCommentStatusFilter(event.target.value);
                  setAdminCommentPage(0);
                }}
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
              </select>
            </label>
          </div>

          <div className="manager-list">
            {adminComments.length === 0 ? (
              <p className="empty-state">暂无评论</p>
            ) : filteredAdminComments.length === 0 ? (
              <p className="empty-state">没有符合筛选条件的评论</p>
            ) : (
              visibleAdminComments.map((comment) => (
                <article className="manager-row comment-row" key={comment.id}>
                  <div>
                    <div className="comment-meta-line">
                      <strong>{comment.authorName || '访客'}</strong>
                      <span>{new Date(comment.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                      <span className={comment.status === 'pending' ? 'status-badge pending' : 'status-badge'}>
                        {comment.status === 'pending' ? '待审核' : '已通过'}
                      </span>
                    </div>
                    <h3>{comment.articleTitle || comment.articleId}</h3>
                    <p>{comment.content}</p>
                  </div>
                  <div className="manager-actions">
                    {comment.status === 'pending' && (
                      <button type="button" onClick={() => approveAdminComment(comment)}>
                        <CheckCircle2 size={17} />
                        <span>通过</span>
                      </button>
                    )}
                    <button className="danger-button" type="button" onClick={() => deleteAdminComment(comment)}>
                      <Trash2 size={17} />
                      <span>删除</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {adminCommentPageGroups.length > 1 && (
            <div className="comment-pagination manager-pagination">
              <button
                type="button"
                disabled={currentAdminCommentPage === 0}
                onClick={() => setAdminCommentPage(Math.max(0, currentAdminCommentPage - 1))}
              >
                上一页
              </button>
              <span>{currentAdminCommentPage + 1} / {adminCommentPageGroups.length}</span>
              <button
                type="button"
                disabled={currentAdminCommentPage >= adminCommentPageGroups.length - 1}
                onClick={() =>
                  setAdminCommentPage(Math.min(adminCommentPageGroups.length - 1, currentAdminCommentPage + 1))
                }
              >
                下一页
              </button>
            </div>
          )}
        </section>
        )}
      </div>
      )}
    </section>
  );
}

function IconToggle({ active, label, count, icon: Icon, onClick }) {
  return (
    <button className={active ? 'icon-toggle active' : 'icon-toggle'} type="button" onClick={onClick} title={label}>
      <Icon size={17} />
      <span>{label} {count}</span>
    </button>
  );
}

export default App;
