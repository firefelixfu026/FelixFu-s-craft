import React, { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Eye,
  ExternalLink,
  FilePenLine,
  Gamepad2,
  Github,
  GripVertical,
  Heading2,
  Heart,
  ImageIcon,
  List,
  LogIn,
  CircleHelp,
  LogOut,
  MessageCircle,
  Moon,
  Music,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  PencilLine,
  Play,
  PlusCircle,
  Quote,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sigma,
  SkipBack,
  SkipForward,
  Star,
  Sun,
  ThumbsDown,
  Trash2,
  UserRound,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import changelogText from '../../CHANGELOG.md?raw';
import { aiNews as fallbackNews, articles as fallbackArticles, gameModule, profile as fallbackProfile } from './data.js';
const ProjectOpsPanel = React.lazy(() => import('./ProjectOpsPanel.jsx'));

const createEmptyArticleForm = () => ({
  title: '',
  summary: '',
  content: '',
  coverUrl: '',
  tags: '',
  date: new Date().toISOString().slice(0, 10),
  readTime: '3 min',
  createdAt: '',
  updatedAt: '',
  status: 'published',
  category: '学习笔记',
  noteCollection: '',
  notePath: '',
  pinned: false
});

const visitorNavItems = [
  { id: 'overview', label: '首页', icon: UserRound },
  { id: 'articles', label: '文章', icon: BookOpen },
  { id: 'plan', label: '计划', icon: List },
  { id: 'music', label: '音乐', icon: Music },
  { id: 'toolbox', label: '工具箱', icon: Wrench },
  { id: 'game', label: '游戏', icon: Gamepad2 },
  { id: 'login', label: '登录', icon: LogIn }
];

const readerNavItems = [
  { id: 'overview', label: '首页', icon: UserRound },
  { id: 'articles', label: '文章', icon: BookOpen },
  { id: 'plan', label: '计划', icon: List },
  { id: 'music', label: '音乐', icon: Music },
  { id: 'toolbox', label: '工具箱', icon: Wrench },
  { id: 'game', label: '游戏', icon: Gamepad2 }
];

const adminNavItem = { id: 'admin', label: '管理', icon: FilePenLine };
const accountNavItem = { id: 'account', label: '账号', icon: ShieldCheck };
const VIEW_PATHS = {
  overview: '/',
  articles: '/articles',
  plan: '/plan',
  music: '/music',
  toolbox: '/toolbox',
  game: '/game',
  login: '/login',
  account: '/account',
  admin: '/admin'
};
const ARTICLE_SECTION_PATHS = {
  essays: '/articles',
  notes: '/notes'
};
const PLAN_SECTION_PATHS = {
  schedule: '/plan/schedule',
  completion: '/plan/completion',
  courses: '/plan/courses',
  apps: '/plan/apps',
  finance: '/plan/finance',
  meals: '/plan/meals',
  body: '/plan/body',
  sleep: '/plan/sleep'
};
const ROUTED_VIEW_IDS = new Set(Object.keys(VIEW_PATHS));
const LIVE2D_MODEL_URL = '/live2d/shu-bubble/model.model3.json';
const LIVE2D_TEXTURE_FALLBACK_URL = '/live2d/shu-bubble/textures/texture_00.png';
const LIVE2D_HIDDEN_KEY = 'felix_blog_live2d_hidden';
const LIVE2D_POSITION_KEY = 'felix_blog_live2d_position_v2';
const LIVE2D_MODE_KEY = 'felix_blog_live2d_mode';
const LIVE2D_QUIET_KEY = 'felix_blog_live2d_quiet';
const LIVE2D_SHOW_EVENT = 'felix-live2d-show';
const LIVE2D_SCRIPT_SOURCES = [
  'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
  'https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js',
  'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js'
];
const mascotLines = [
  '欢迎回来，今天也要稳稳推进。',
  '首页已经瘦身，剩下的内容都在独立入口里。',
  '去看看最近更新吧，我帮你守着主页。',
  '学习累了可以切到音乐页听一首。',
  '记得给计划表留一点弹性时间。'
];
const mascotPageLines = {
  overview: ['主页只留关键入口，其他内容都藏进路由里了。'],
  articles: ['笔记页我会让开右侧，不挡你看正文。'],
  music: ['现在音乐有队列和歌词了，可以慢慢听。'],
  toolbox: ['工具箱适合放常用入口，别把主页塞满。'],
  game: ['休息也要有边界，打一局就回来。'],
  account: ['账号页可以控制我是否出现。'],
  plan: ['计划页先默认藏起来，需要公开再去后台开。']
};

const COMMENT_MAX_LENGTH = 300;
const COMMENT_PAGE_UNITS = 5;
const COMMENT_UNIT_CHARS = 60;
const ADMIN_COMMENTS_PER_PAGE = 5;
const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const AUDIO_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
const AUDIO_UPLOAD_CHUNK_BYTES = 768 * 1024;
const ALLOWED_IMAGE_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const ALLOWED_AUDIO_UPLOAD_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/x-flac', 'audio/mp4', 'audio/aac']);
const TECH_NOTE_KEYWORDS = ['技术', '笔记', '学习', 'React', '前端', '后端', 'FastAPI', 'Git', '网络', '算法', '数据结构', '计算机', '代码', '项目文档'];
const ARTICLE_DRAFT_KEY = 'felix_blog_article_form_draft';
const ARTICLE_DRAFT_HISTORY_KEY = 'felix_blog_article_draft_history';
const FRONTEND_ERROR_LOG_KEY = 'felix_blog_frontend_error_logs';
const BACKUP_CENTER_KEY = 'felix_blog_backup_records';
const BOT_CORPUS_KEY = 'felix_blog_bot_corpus_samples';
const STUDY_ASSISTANT_KEY = 'felix_blog_study_assistant';
const SUMMER_PLAN_KEY = 'felix_blog_summer_plan';
const AUTH_TOKEN_KEY = 'felix_blog_token';
const AUTH_USER_KEY = 'felix_blog_user';
const AUTH_EXPIRES_KEY = 'felix_blog_token_expires_at';
const ACTIVE_VIEW_KEY = 'felix_blog_active_view';
const ADMIN_PAGE_KEY = 'felix_blog_admin_page';
const MUSIC_PLAYLISTS_KEY = 'felix_blog_music_playlists';
const MUSIC_RECENT_KEY = 'felix_blog_music_recent';
const MUSIC_VOLUME_KEY = 'felix_blog_music_volume';
const TOOLBOX_DEFAULT_OVERRIDES_KEY = 'felix_blog_toolbox_default_overrides';
const THEME_KEY = 'felix_blog_theme';
const SIDEBAR_COLLAPSED_KEY = 'felix_blog_sidebar_collapsed';
const AUTH_FAIL_STATE_KEY = 'felix_blog_auth_fail_state';
const DEFAULT_SITE_PREFERENCES = { summerPlanVisible: false };
const SITE_LAUNCH_DATE = '2026-07-22T00:00:00+08:00';
const MARKDOWN_CACHE_LIMIT = 60;
const markdownBlockCache = new Map();
const LOGIN_LOCK_MS = 60 * 1000;
const emptyReactionState = { like: false, favorite: false, downvote: false, question: false };
const ALL_FILTER = '全部';
const ALL_ARCHIVE = '全部';
const SEARCH_FILTER_PATTERN = /(?:^|\s)(tag|标签|category|cat|分类|month|月份):([^\s]+)/gi;

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

function writeAuthCookie(token, expiresAt) {
  if (typeof document === 'undefined') return;
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const base = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  document.cookie = base;
  if (window.location.hostname.endsWith('felixfu.xyz')) {
    document.cookie = `${base}; Domain=.felixfu.xyz`;
  }
}

function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  if (window.location.hostname.endsWith('felixfu.xyz')) {
    document.cookie = `${AUTH_TOKEN_KEY}=; Path=/; Domain=.felixfu.xyz; Max-Age=0; SameSite=Lax${secure}`;
  }
}

function getTokenExpiresAt(token) {
  try {
    const payloadPart = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(payloadPart.padEnd(payloadPart.length + (-payloadPart.length % 4), '=')));
    return Number(payload.exp) ? Number(payload.exp) * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
  } catch {
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }
}

function clearStoredAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_EXPIRES_KEY);
  clearAuthCookies();
}

function persistAuthSession(token, user = null) {
  const expiresAt = getTokenExpiresAt(token);
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_EXPIRES_KEY, String(expiresAt));
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
  writeAuthCookie(token, expiresAt);
}

function readStoredAuthToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || decodeURIComponent(readCookie(AUTH_TOKEN_KEY) || '');
  if (!token) return '';
  const expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_KEY)) || getTokenExpiresAt(token);
  if (expiresAt <= Date.now()) {
    clearStoredAuthSession();
    return '';
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_EXPIRES_KEY, String(expiresAt));
  writeAuthCookie(token, expiresAt);
  return token;
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function readStoredActiveView() {
  if (typeof localStorage === 'undefined') return 'overview';
  const storedView = localStorage.getItem(ACTIVE_VIEW_KEY) || 'overview';
  const publicViews = new Set(['overview', 'articles', 'plan', 'music', 'toolbox', 'game', 'login', 'account', 'admin']);
  return publicViews.has(storedView) ? storedView : 'overview';
}

function readStoredTheme() {
  if (typeof localStorage === 'undefined') return 'light';
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function readStoredSidebarCollapsed() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

function readStoredAdminPage() {
  if (typeof localStorage === 'undefined') return 'overview';
  const storedPage = localStorage.getItem(ADMIN_PAGE_KEY) || 'overview';
  const knownPages = new Set(['overview', 'ops', 'releases', 'editor', 'notes', 'articles', 'music', 'toolbox', 'comments', 'visual', 'security']);
  return knownPages.has(storedPage) ? storedPage : 'overview';
}

function readStoredJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function writeStoredJson(key, value) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readStoredMusicPlaylists() {
  const stored = readStoredJson(MUSIC_PLAYLISTS_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((playlist) => playlist?.id && playlist?.name)
    .map((playlist) => ({
      id: String(playlist.id),
      name: String(playlist.name),
      trackFilenames: Array.isArray(playlist.trackFilenames)
        ? playlist.trackFilenames.map((filename) => String(filename)).filter(Boolean)
        : []
    }));
}

function readStoredRecentMusic() {
  const stored = readStoredJson(MUSIC_RECENT_KEY, []);
  return Array.isArray(stored) ? stored.map((filename) => String(filename)).filter(Boolean).slice(0, 8) : [];
}

function readDraftHistory() {
  const stored = readStoredJson(ARTICLE_DRAFT_HISTORY_KEY, []);
  return Array.isArray(stored) ? stored.slice(0, 12) : [];
}

function readFrontendErrorLogs() {
  const stored = readStoredJson(FRONTEND_ERROR_LOG_KEY, []);
  return Array.isArray(stored) ? stored.slice(0, 20) : [];
}

function readBackupRecords() {
  const stored = readStoredJson(BACKUP_CENTER_KEY, []);
  return Array.isArray(stored) ? stored.slice(0, 16) : [];
}

function readBotCorpusSamples() {
  const stored = readStoredJson(BOT_CORPUS_KEY, []);
  return Array.isArray(stored) ? stored.slice(0, 12) : [];
}

function createDefaultStudyState() {
  return {
    tasks: [
      { id: 'algo', title: '算法题复盘', detail: '整理今天卡住的题和关键思路', done: false },
      { id: 'paper', title: '论文阅读', detail: '读 1 篇摘要、方法、实验', done: false },
      { id: 'project', title: '项目推进', detail: '完成一个能截图展示的小功能', done: false },
      { id: 'review', title: '知识回顾', detail: '把当天笔记写成可发布片段', done: false }
    ]
  };
}

function readStudyState() {
  const stored = readStoredJson(STUDY_ASSISTANT_KEY, createDefaultStudyState());
  return {
    tasks: Array.isArray(stored.tasks) && stored.tasks.length ? stored.tasks : createDefaultStudyState().tasks
  };
}

const writingTemplates = [
  {
    id: 'project-retro',
    title: '项目复盘',
    category: '项目复盘',
    tags: '项目, 复盘, VibeCoding',
    summary: '记录一个项目从想法、实现到上线的关键决策和下一步。',
    content: `## 背景
这个项目想解决什么问题？

## 今天推进了什么
-

## 遇到的坑
-

## 学到的东西
-

## 下一步
- `
  },
  {
    id: 'paper-note',
    title: '论文阅读',
    category: '科研笔记',
    tags: '论文, 科研, 方法',
    summary: '用问题、方法、实验和启发四段式整理论文阅读笔记。',
    content: `## 论文信息
- 标题：
- 方向：

## 它想解决什么问题

## 核心方法

## 实验和结论

## 对我的启发`
  },
  {
    id: 'vuln-analysis',
    title: '漏洞分析',
    category: '安全学习',
    tags: '安全, 漏洞, 复现',
    summary: '记录一次漏洞学习或靶场复现，保留环境、触发点和修复建议。',
    content: `## 目标和环境

## 触发条件

## 复现过程

## 根因分析

## 修复建议

## 延伸阅读`
  },
  {
    id: 'weekly-review',
    title: '学习周报',
    category: '学习笔记',
    tags: '周报, 计划, 总结',
    summary: '把一周学习、项目、阅读和下周计划压缩成可追踪记录。',
    content: `## 本周完成
-

## 最有价值的一件事

## 消耗时间最多的地方

## 下周计划
- `
  }
];

const releaseRoadmap = [
  {
    version: 'v6.3.0',
    title: '站点设置、友链和音乐体验增强',
    date: '2026-08-12',
    status: '已上线',
    points: ['工具箱和友链支持头像/封面图片链接，后台可统一编辑', '备份中心新增站点 JSON 导出，文章、资料、音乐和工具箱配置可一键打包', '音乐队列和最近播放显示歌曲封面，当前播放更清楚', '工具箱卡片和高频入口进一步瘦身，页面滚动更轻', '图片增加懒加载与异步解码，减少前台卡顿']
  },
  {
    version: 'v6.2.0',
    title: '知识库、音乐和助手体验继续打磨',
    date: '2026-08-12',
    status: '已上线',
    points: ['Mermaid 流程图支持轻量图形预览，并保留源码切换', '技术笔记目录尊重后台排序，内容库目录增加统计概览', '黍泡泡新增低打扰模式，切页面不再强制弹话', '音乐歌词支持 LRC 时间戳高亮和自动滚动', 'Markdown 解析加入缓存，长文预览和目录生成更顺']
  },
  {
    version: 'v6.1.0',
    title: '体验细化与内容系统迭代',
    date: '2026-08-12',
    status: '已上线',
    points: ['Markdown 预览补充 Wiki 链接、标签、Callout 和 Mermaid 代码块展示', '首页入口继续瘦身，内容库更接近文件管理器视图', '黍泡泡会根据当前页面说不同的话', '音乐页新增歌词滚动、播放队列、音量记忆和封面氛围背景', '写作台预览改为延迟渲染，输入更顺滑']
  },
  {
    version: 'v6.0.6',
    title: '移除黍泡泡重置位置入口',
    date: '2026-08-12',
    status: '已上线',
    points: ['右键菜单移除重置位置，避免触发 Live2D 重新挂载后加载失败', '保留说句话、贴边/悬浮窗切换和关闭入口', '版本说明同步删除误导性的重置位置描述']
  },
  {
    version: 'v6.0.5',
    title: 'Markdown 预览向 Obsidian 体验靠拢',
    date: '2026-08-12',
    status: '已上线',
    points: ['正文预览支持 Setext 标题、波浪线代码块、任务列表、分割线、删除线和高亮语法', '预览保留软换行，不再把连续换行错误合并', '写作台预览面板改成更舒服的阅读纸张样式，并补齐常用 Markdown 工具按钮']
  },
  {
    version: 'v6.0.4',
    title: '文章表单置顶开关和阅读时长优化',
    date: '2026-08-12',
    status: '已上线',
    points: ['置顶文章从突兀的方框改成更轻量的胶囊开关', '预计阅读时间改为按正文内容自动计算，不再需要手填', '后端保存文章时同步兜底重算阅读时长，避免旧数据混入']
  },
  {
    version: 'v6.0.3',
    title: '站点名称和公开资料后台可编辑',
    date: '2026-08-12',
    status: '已上线',
    points: ["公开站点名称改为 FelixFu's Craft，首页不再用真实姓名做主标题", '公开展示名改为副将凡，侧边栏显示站点名和展示名', '后台总览新增公开资料编辑，可保存自我介绍、身份标签、兴趣标签和站点名称']
  },
  {
    version: 'v6.0.2',
    title: '页面留白、黍泡泡浮层与暑期计划隐私开关',
    date: '2026-08-12',
    status: '已上线',
    points: ['前台普通页面收紧顶部留白，并在桌面端给右侧浮层留出空间', '黍泡泡移出正文层级，固定在右侧视口，避免被正文内容遮挡', '暑期计划入口默认隐藏，后台总览新增公开开关，公开接口同步保护']
  },
  {
    version: 'v6.0.1',
    title: '工具箱编辑、笔记收纳与悬浮吉祥物手感修复',
    date: '2026-08-10',
    status: '已上线',
    points: ['工具箱管理页支持编辑和删除内置网站、友链与自定义网站，并把预置覆盖保存到后端', '内容库新增批量收纳笔记，可填写合集和目录路径', '迷你播放器左下角优先显示当前歌曲封面', '文章互动数字取消跳动动画，点击反馈更稳', '黍泡泡提升到最顶层，只在本体区域响应点击、拖动和右键菜单']
  },
  {
    version: 'v6.0',
    title: '内容管理、音乐资源与阅读交互修复',
    date: '2026-08-10',
    status: '已上线',
    points: ['黍泡泡悬浮层级和坐标缓存重置，默认回到右下角并避免卡住', '前台页面顶部留白收紧，接近后台管理页的起始高度', '文章互动按钮增强暗色激活态和数字变化动画', '文章目录点击改为主动平滑跳转到正文标题', '技术笔记导引保留后台排序，不再按标题强制重排', '音乐管理支持为歌曲上传封面和歌词，歌单歌曲支持拖拽排序', '后台工具箱管理统一展示内置网站、自定义网站和友链并支持搜索', '内容库改为文件资源管理器式列表，便于查看目录和拖拽调整顺序']
  },
  {
    version: 'v5.9',
    title: '工具箱归类、排序与性能整理',
    date: '2026-08-10',
    status: '已上线',
    points: ['首页顶部留白收紧，内容区改为更克制的横向留白', '友链从首页和导航移入工具箱友链分类', '后台工具箱管理页接入管理布局', '黍泡泡延迟加载并增加贴图兜底', '内容库支持文章和笔记拖拽排序并保存到后端', 'README 和 CHANGELOG 清理历史乱码']
  },
  {
    version: 'v5.8',
    title: '站点结构与阅读体验整理',
    date: '2026-08-10',
    status: '已上线',
    points: ['黍泡泡改为可拖动悬浮窗，支持点击说话、右键菜单和账号页唤回', '技术笔记索引改为不遮挡正文的左侧栏，右侧阅读进度和目录保持跟随', '计划页拆成时间安排、完成度、课程、应用、记账、饮食、身体和睡眠等独立路径', '工具箱公共页只展示资源，自定义网址移动到后台管理', '新增工具箱友链分类、游戏库选择入口和后台文件资源管理器式内容库', '整体卡片和标题尺寸收紧，页面留白更稳']
  },
  {
    version: 'v5.7.1',
    title: 'Live2D 加载修复',
    date: '2026-08-10',
    status: '已上线',
    points: ['Live2D 改用 Cubism4 专用运行包', '模型资源路径改为英文别名，减少静态资源编码问题', '加载失败时支持重试，并在控制台输出具体错误']
  },
  {
    version: 'v5.7',
    title: 'Live2D 吉祥物',
    date: '2026-08-10',
    status: '已上线',
    points: ['首页新增黍泡泡 Live2D 看板娘', 'Live2D 运行库仅在首页懒加载，不影响其它页面', '支持换台词、收起和再次叫出', '页面保留模型来源：切丁鱼片']
  },
  {
    version: 'v5.6',
    title: '首页门户化与内容体验升级',
    date: '2026-08-10',
    status: '已上线',
    points: ['首页瘦身为个人门户，详细模块改为独立入口', '最近更新改成时间线展示，更像维护日志', '文章详情 URL 支持 标题--id 形式并保留旧链接兼容', '技术笔记和文章详情增加上一篇 / 下一篇', '友链可复用工具箱自定义链接管理，分类填友链会自动出现在首页', '音乐支持同名封面和歌词文件展示']
  },
  {
    version: 'v5.5',
    title: '真实 URL 路由',
    date: '2026-08-10',
    status: '已上线',
    points: ['首页、文章、计划、音乐、工具箱、游戏、账号和后台都有独立路径', '技术笔记支持 /notes 和 /notes/文章id 直接访问', '浏览器前进后退、刷新和分享链接能保持当前页面']
  },
  {
    version: 'v5.4.6',
    title: '身体睡眠图表与友链',
    date: '2026-08-10',
    status: '已上线',
    points: ['体重与状态模块新增趋势折线图和记录完整度柱状图', '睡眠记录模块新增睡眠时长折线图和柱状图', '首页新增友链/推荐链接区，保留个人博客互访入口']
  },
  {
    version: 'v5.4.5',
    title: '后台视觉巡检',
    date: '2026-08-09',
    status: '已上线',
    points: ['管理后台新增视觉巡检页', '集中展示卡片、按钮、输入框和提示条的日夜间样式', '总览页增加巡检入口，后续排查漏白底更直接']
  },
  {
    version: 'v5.4.4',
    title: '后台夜间模式补漏',
    date: '2026-08-09',
    status: '已上线',
    points: ['修复管理后台登录状态卡片夜间模式仍为浅色的问题', '补齐提示条、登录用户块和危险按钮的深色样式', '统一后台常用控件在夜间模式下的边框和背景']
  },
  {
    version: 'v5.4.3',
    title: '正文预览对齐',
    date: '2026-08-09',
    status: '已上线',
    points: ['写作台正文输入和预览改为左右并排', '正文滚动时预览按比例同步滚动', '草稿历史移到编辑区下方避免顶开预览']
  },
  {
    version: 'v5.4.2',
    title: '侧栏性能、音乐续播与批量管理',
    date: '2026-08-09',
    status: '已上线',
    points: ['侧边栏折叠展开减少整页重排', '音乐页新增最近播放和快速续播', '内容库支持批量发布、转草稿和删除']
  },
  {
    version: 'v5.4.1',
    title: '侧边栏头像可修改',
    date: '2026-08-09',
    status: '已上线',
    points: ['账号中心新增侧边栏头像上传入口', '侧边栏头像改为读取后端保存的站点资料', '管理员上传后可立即同步到左侧导航']
  },
  {
    version: 'v5.4',
    title: '版本时间线',
    date: '2026-08-09',
    status: '已上线',
    points: ['版本页改为按大版本分段的时间线', '补充每个阶段的主题说明和版本数量', '记录后续优化顺序为 6 -> 3 -> 4 -> 1 -> 7']
  },
  {
    version: 'v5.3.2',
    title: '迷你播放器歌名滚动',
    date: '2026-08-09',
    status: '已上线',
    points: ['侧边栏迷你播放器歌名改为循环横向滚动', '长歌名不再只显示省略号', '悬停歌名时暂停动画方便阅读']
  },
  {
    version: 'v5.3.1',
    title: '版本清单修复',
    date: '2026-08-09',
    status: '已上线',
    points: ['恢复 v2.0 之前的 v1.x 和 v0.x 历史版本', '版本筛选改为自动识别全部大版本', 'CHANGELOG 重新串起早期项目演进记录']
  },
  {
    version: 'v5.3',
    title: '技术笔记收纳目录',
    date: '2026-08-09',
    status: '已上线',
    points: ['后台文章支持设置笔记合集和目录路径', '技术笔记左侧索引按层级折叠展示', '未设置目录的旧文章继续按分类自动归组']
  },
  {
    version: 'v5.2.1',
    title: '侧边栏动画优化',
    date: '2026-08-09',
    status: '已上线',
    points: ['侧边栏展开折叠减少布局重排', '导航文字改为轻量淡入淡出', '移动端导航保持稳定显示']
  },
  {
    version: 'v5.2',
    title: '技术笔记侧栏悬浮',
    date: '2026-08-09',
    status: '已上线',
    points: ['技术笔记左侧索引默认收起为悬浮把手', '鼠标悬停或键盘聚焦时滑出完整笔记列表', '右侧阅读进度和文章目录保持滚动跟随']
  },
  {
    version: 'v5.1',
    title: '工具箱自定义链接',
    date: '2026-08-09',
    status: '已上线',
    points: ['工具箱支持管理员新增自定义网址', '自定义链接保存到后端数据库并公开展示', '支持编辑、删除、置顶、分类和标签维护']
  },
  {
    version: 'v5.0.1',
    title: '仓库文档同步',
    date: '2026-08-09',
    status: '已上线',
    points: ['重写 README 为当前个人站定位', 'CHANGELOG 补齐 v5 内容架构重组后的关键版本', 'docs 文档导航同步文章分区、技术笔记和后台精简说明']
  },
  {
    version: 'v5.0',
    title: '内容架构重组',
    date: '2026-08-09',
    status: '已上线',
    points: ['文章中心拆成随笔娱乐和技术笔记两个入口', '技术笔记阅读页改成目录树、正文、阅读进度三栏结构', '后台精简为写作、笔记上传、内容管理和必要工具', '笔记上传支持 Markdown 与相对图片路径自动导入']
  },
  {
    version: 'v4.3.3',
    title: '账号退出入口整理',
    date: '2026-08-09',
    status: '已上线',
    points: ['侧边栏登录区域不再显示退出按钮', '退出登录移动到账号中心', '导航区域更轻、更省空间']
  },
  {
    version: 'v4.3.2',
    title: '导航图标微调',
    date: '2026-08-09',
    status: '已上线',
    points: ['账号入口换成身份确认图标', '避免首页和账号导航图标重复', '侧边栏识别度更清楚']
  },
  {
    version: 'v4.3.1',
    title: '写作台布局整理',
    date: '2026-08-09',
    status: '已上线',
    points: ['删除写文章页的 AI 生成历史', '收起正文上方的 AI 辅助按钮', '正文预览移动到右侧栏', '保留草稿版本历史方便恢复']
  },
  {
    version: 'v4.3',
    title: '个人工具箱上线',
    date: '2026-08-09',
    status: '已上线',
    points: ['前台新增工具箱板块', '按学习、开发、AI、设计素材和娱乐生活整理常用网站', '支持关键词搜索和分类筛选', '网站卡片补充用途说明和推荐标签']
  },
  {
    version: 'v4.2.2',
    title: '夜间文章可读性修复',
    date: '2026-08-09',
    status: '已上线',
    points: ['修复夜间模式下文章正文局部字体对比度不足', '补齐链接、引用、行内代码、表格和图片说明的深色样式', '文章详情和后台预览统一使用更清晰的阅读配色']
  },
  {
    version: 'v4.2.1',
    title: '折叠态播放器瘦身',
    date: '2026-08-09',
    status: '已上线',
    points: ['侧边栏折叠后迷你播放器只保留播放/暂停键', '隐藏上一首、下一首、唱片和进度条避免拥挤', '展开侧边栏后仍显示完整播放控制']
  },
  {
    version: 'v4.2',
    title: '夏活字标感标题字体',
    date: '2026-08-09',
    status: '已上线',
    points: ['参考开源方舟夏活字标生成器调整前台标题字效', '首页、文章、计划和音乐标题换成更圆润可爱的展示字体', '重点标签补充轻描边和错位阴影', '正文仍保留清晰易读的默认字体']
  },
  {
    version: 'v4.1',
    title: '原创二次元小贴纸',
    date: '2026-08-09',
    status: '已上线',
    points: ['前台加入方舟感和乐队感的原创小贴纸', '不同板块显示不同贴纸组合', '贴纸仅作轻装饰不影响阅读和操作', '继续保留后台管理页的干净布局']
  },
  {
    version: 'v4.0',
    title: '二次元个人站视觉改版',
    date: '2026-08-09',
    status: '已上线',
    points: ['前台改成更有个人气质的轻二次元视觉', '首页、文章、计划和音乐模块降低工具台感', '侧边栏迷你播放器支持拖动进度条', '后台管理保留稳定的工作台布局']
  },
  {
    version: 'v3.1',
    title: '常驻音乐和自建歌单',
    date: '2026-08-09',
    status: '已上线',
    points: ['播放器提升为全站常驻状态', '离开音乐页后侧边栏显示悬浮迷你播放器', '支持创建和删除自定义歌单', '支持给歌单加歌、移除和调整顺序']
  },
  {
    version: 'v3.0.2',
    title: '音乐分片上传兼容',
    date: '2026-08-09',
    status: '已上线',
    points: ['音乐上传分片降到 768KB 以内', '兼容服务器外层 1MB 上传限制', '后台上传错误统一转成可读提示', '修复特定 MP3 上传无反馈的问题']
  },
  {
    version: 'v3.0.1',
    title: '音乐上传热修',
    date: '2026-08-09',
    status: '已上线',
    points: ['音乐大文件改为分片上传', '前端容器上传上限提高到 60MB', '音乐上传失败时显示明确提示', '后台音乐页显示操作反馈']
  },
  {
    version: 'v3.0',
    title: '个人音乐和文章属性',
    date: '2026-08-09',
    status: '已上线',
    points: ['前台新增个人音乐播放器入口', '后台支持上传和删除本地音乐文件', '文章接口补充创建时间和最后修改时间', '为后续文章/笔记分区改版打基础']
  },
  {
    version: 'v2.8',
    title: '首页和计划体验整理',
    date: '2026-08-09',
    status: '已上线',
    points: ['首页新增时钟模块和最近更新说明', '前台隐藏 AI 工作台入口但保留代码', '文章阅读进度改为滚动吸顶', '计划相关日期选择统一为小日历浮层']
  },
  {
    version: 'v2.7.4',
    title: '首页秒级计时热修',
    date: '2026-08-08',
    status: '已上线',
    points: ['修复首页 homeNow 作用域错误', '秒级上线计时移动到首页组件内部', '恢复首页正常渲染', '保留每秒自动刷新']
  },
  {
    version: 'v2.7.3',
    title: '首页上线时间精确到秒',
    date: '2026-08-08',
    status: '已上线',
    points: ['首页站点状态新增实时秒级计时', '上线时间从整数天改为天时分秒', '计时每秒自动刷新', '移动端状态卡补充长文本防溢出']
  },
  {
    version: 'v2.7.2',
    title: '运维页加载稳定性',
    date: '2026-08-08',
    status: '已上线',
    points: ['运维面板取消动态分包', '避免部署后旧缓存导致运维模块加载失败', '保留运维页局部错误保护', '降低手机浏览器打开后台时的白屏概率']
  },
  {
    version: 'v2.7.1',
    title: '移动端布局整理',
    date: '2026-08-08',
    status: '已上线',
    points: ['移动端侧栏改为单行横向导航', '横屏时品牌区和导航并排', '暑期计划表手机端改为卡片流', '移动端夜间表格卡片同步适配']
  },
  {
    version: 'v2.7',
    title: '主页故事线和评论体验',
    date: '2026-08-08',
    status: '已上线',
    points: ['首页新增学习故事线和当前探索', '作品墙突出博客、AI 和运维项目', '评论区新增互动摘要和站长标识', '登录用户可看到自己的待审核评论']
  },
  {
    version: 'v2.6.3',
    title: '夜间模式文字对比度修复',
    date: '2026-08-08',
    status: '已上线',
    points: ['备份中心统计卡文字提亮', '版本指标和后台说明文字跟随主题变量', '暑期计划弱文本夜间可读性补齐', '减少硬编码浅色灰字残留']
  },
  {
    version: 'v2.6.2',
    title: '后台夜间模式补全',
    date: '2026-08-08',
    status: '已上线',
    points: ['文章库和图片管理卡片适配深色主题', '评论、安全、备份和群聊语料空状态适配', '上传按钮和删除按钮深色模式修正', '后台徽章和说明卡对比度优化']
  },
  {
    version: 'v2.6.1',
    title: '可用性、安全和性能打磨',
    date: '2026-08-08',
    status: '已上线',
    points: ['高级搜索和关键词高亮', '首页站点状态和最近更新', '评论批量审核', '登录失败限流和前端构建拆包']
  },
  {
    version: 'v2.6',
    title: '后台工具扩展',
    date: '2026-08-03',
    status: '已上线',
    points: ['AI 配置支持前端保存、停用和删除', '写作模板库和草稿版本历史', '备份中心、群聊语料和学习助手', '前端错误日志和容器状态面板']
  },
  {
    version: 'v2.5',
    title: '运维稳定性',
    date: '2026-08-03',
    status: '已上线',
    points: ['运维页局部错误保护', '真实健康检查数据兜底', '检查记录面板', '全局卡住页自救按钮']
  },
  {
    version: 'v2.4',
    title: '后台体验整理',
    date: '2026-08-03',
    status: '已上线',
    points: ['后台页面拆分', '管理入口卡片化', '刷新后保留后台位置', '移动端后台布局优化']
  },
  {
    version: 'v2.3',
    title: '登录会话',
    date: '2026-08-03',
    status: '已上线',
    points: ['本地保存登录信息', 'Cookie 同步登录令牌', '刷新页面不再反复登录', '过期后自动清理']
  },
  {
    version: 'v2.2',
    title: '内容管理',
    date: '2026-08-03',
    status: '已上线',
    points: ['删除默认样例文章', '文章编辑与删除入口整理', '图片资源管理', '评论审核面板']
  },
  {
    version: 'v2.1',
    title: 'AI 和发布基础',
    date: '2026-08-03',
    status: '已上线',
    points: ['AI 写作辅助入口', '发布状态总览', '站点统计卡片', '安全日志入口']
  }
];

const toolboxCategories = ['全部', '学习', '开发', 'AI', '设计素材', '效率', '娱乐生活', '友链'];

const defaultToolboxLinks = [
  {
    title: 'OI Wiki',
    category: '学习',
    url: 'https://oi-wiki.org/',
    description: '算法竞赛和数据结构知识库，适合预习高级数据结构与算法分析。',
    tags: ['算法', '数据结构', '中文']
  },
  {
    title: 'CP-Algorithms',
    category: '学习',
    url: 'https://cp-algorithms.com/',
    description: '偏竞赛向的算法讲解，适合查复杂算法细节和模板思路。',
    tags: ['算法', '英文', '模板']
  },
  {
    title: 'Hello 算法',
    category: '学习',
    url: 'https://www.hello-algo.com/',
    description: '动画图解数据结构与算法，适合把算法基础和代码实现连起来看。',
    tags: ['算法', '图解', '入门']
  },
  {
    title: '3Blue1Brown',
    category: '学习',
    url: 'https://www.3blue1brown.com/',
    description: '数学可视化讲解，概率统计和线代相关内容适合作为直觉补充。',
    tags: ['数学', '可视化', '直觉']
  },
  {
    title: 'MDN Web Docs',
    category: '开发',
    url: 'https://developer.mozilla.org/zh-CN/',
    description: '前端开发权威文档，查 HTML、CSS、JavaScript 很稳。',
    tags: ['前端', '文档', '标准']
  },
  {
    title: 'Compiler Explorer',
    category: '开发',
    url: 'https://godbolt.org/',
    description: '在线看代码编译后的汇编，学计算机组成时很有感觉。',
    tags: ['编译', '汇编', '组成原理']
  },
  {
    title: 'Python Tutor',
    category: '开发',
    url: 'https://pythontutor.com/',
    description: '逐步可视化运行代码，调理解、讲思路、看变量变化都方便。',
    tags: ['调试', '可视化', '代码']
  },
  {
    title: 'GitHub',
    category: '开发',
    url: 'https://github.com/',
    description: '项目代码、开源仓库和自己的博客维护都离不开。',
    tags: ['开源', '项目', '版本管理']
  },
  {
    title: 'ChatGPT',
    category: 'AI',
    url: 'https://chatgpt.com/',
    description: '整理笔记、解释概念、写代码草稿和复盘计划都可以用。',
    tags: ['AI', '学习助手', '写作']
  },
  {
    title: 'Papers with Code',
    category: 'AI',
    url: 'https://paperswithcode.com/',
    description: '看论文、数据集和模型实现，适合之后做 AI 项目时查资料。',
    tags: ['论文', 'AI', '代码']
  },
  {
    title: 'Hugging Face',
    category: 'AI',
    url: 'https://huggingface.co/',
    description: '模型、数据集和 Demo 聚合地，适合找开源 AI 资源。',
    tags: ['模型', '数据集', 'Demo']
  },
  {
    title: 'Excalidraw',
    category: '设计素材',
    url: 'https://excalidraw.com/',
    description: '手绘风流程图工具，整理课程框架和项目结构很顺手。',
    tags: ['画图', '流程图', '手绘']
  },
  {
    title: 'Iconify',
    category: '设计素材',
    url: 'https://icon-sets.iconify.design/',
    description: '大量图标合集，做网页和笔记配图时可以快速找图标。',
    tags: ['图标', '素材', 'UI']
  },
  {
    title: 'Carbon',
    category: '设计素材',
    url: 'https://carbon.now.sh/',
    description: '生成漂亮代码截图，适合文章配图和分享代码片段。',
    tags: ['代码截图', '排版', '文章']
  },
  {
    title: 'Overleaf',
    category: '效率',
    url: 'https://www.overleaf.com/',
    description: '在线 LaTeX 编辑器，写报告、论文模板和数学公式排版很好用。',
    tags: ['LaTeX', '报告', '公式']
  },
  {
    title: 'DeepL',
    category: '效率',
    url: 'https://www.deepl.com/translator',
    description: '英文资料和文档翻译辅助，适合读英文教程时快速过一遍。',
    tags: ['翻译', '英文', '阅读']
  },
  {
    title: 'Mermaid Live',
    category: '效率',
    url: 'https://mermaid.live/',
    description: '在线写流程图、时序图和架构图，适合技术笔记配图。',
    tags: ['图表', 'Markdown', '技术笔记']
  },
  {
    title: 'Bangumi',
    category: '娱乐生活',
    url: 'https://bgm.tv/',
    description: '番剧、书籍和游戏进度管理，适合记录看番和补番清单。',
    tags: ['看番', '记录', 'ACG']
  },
  {
    title: 'SteamDB',
    category: '娱乐生活',
    url: 'https://steamdb.info/',
    description: '查 Steam 游戏价格、史低和更新信息，买游戏前可以看一眼。',
    tags: ['游戏', 'Steam', '价格']
  },
  {
    title: 'Bilibili',
    category: '娱乐生活',
    url: 'https://www.bilibili.com/',
    description: '学习视频和娱乐视频都在这，但记得配合计划表限时使用。',
    tags: ['视频', '学习', '娱乐']
  }
];

function parseChangelogReleases(text) {
  return text
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const [heading = '', ...bodyLines] = section.trim().split('\n');
      const [, version = '未命名版本', title = '版本更新'] = heading.match(/^(v[\d.]+)\s*-\s*(.+)$/) || [];
      const points = bodyLines
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.slice(2))
        .slice(0, 5);
      return {
        version,
        title,
        date: '历史版本',
        status: '已归档',
        points: points.length ? points : ['版本记录已归档']
      };
    })
    .filter((release) => /^v\d+\.\d+/.test(release.version));
}

const releaseArchive = [
  ...releaseRoadmap,
  ...parseChangelogReleases(changelogText)
].filter((release, index, releases) => releases.findIndex((item) => item.version === release.version) === index);

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
    name: '副将凡',
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
  bodyMetrics: [{ id: 'body-1', date: '8月4日', weight: '', exercise: '', mood: '' }],
  sleep: [{ id: 'sleep-1', date: '8月4-5日', bed: '', wake: '', hours: '', quality: '' }]
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
  { id: 'slot-1730', time: '17:30 - 19:00', activity: '晚餐 + 记录', focus: '填饮食、体重/状态、记账；当天花销随手记。', type: '记录' },
  { id: 'slot-1900', time: '19:00 - 20:30', activity: '轻学习 / 复盘', focus: '复盘今日预习，列明天任务；不适合硬刚时改成阅读。', type: '学习' },
  { id: 'slot-2030', time: '20:30 - 21:30', activity: '娱乐时间', focus: '以撒的结合 / 第五人格 / 葬送的芙莉莲 / 红与黑，控制 B 站和小红书。', type: '娱乐' },
  { id: 'slot-2130', time: '21:30 - 22:30', activity: '洗漱 + 睡眠准备', focus: '填睡眠记录，尽量 22:30 前进入休息状态。', type: '睡眠' }
];

const personalizedDailyPlans = [
  createDailyPlan('2026-08-04', '8月4日', '启动日：数据结构 + 大物框架', {
    'slot-0800': { activity: '高级数据结构与算法分析', focus: '复杂度、堆、并查集预热；先建立期末冲刺目录。' },
    'slot-1030': { activity: '大学物理（乙）Ⅱ', focus: '电场、电势、电容先过概念和公式。' },
    'slot-1400': { activity: '数据结构题目整理', focus: '整理复杂度常见坑，写 3-5 道基础题。' },
    'slot-1530': { activity: '快走', focus: '40 分钟，低压力启动。' },
    'slot-2030': { activity: '红与黑', focus: '阅读 30 页，B 站和小红书只保留应用限时。' }
  }),
  createDailyPlan('2026-08-05', '8月5日', '计组启动 + 概率基础', {
    'slot-0800': { activity: '计算机组成', focus: '数据表示、定点数、浮点数和补码。' },
    'slot-1030': { activity: '概率论与数理统计', focus: '随机变量、分布函数、离散/连续分布。' },
    'slot-1400': { activity: '计组笔记整理', focus: '把数制转换、补码、浮点表示整理成速查表。' },
    'slot-1530': { activity: '室内燃脂', focus: '25 分钟，控制强度但要出汗。' },
    'slot-2030': { activity: '葬送的芙莉莲', focus: '看 1 集，结束后填睡眠记录。' }
  }),
  createDailyPlan('2026-08-06', '8月6日', '概率推进 + 数据结构图论', {
    'slot-0800': { activity: '概率论与数理统计', focus: '期望、方差、常见分布，先抓公式适用条件。' },
    'slot-1030': { activity: '高级数据结构与算法分析', focus: '图论基础、BFS/DFS、最短路预习。' },
    'slot-1400': { activity: '概率题目训练', focus: '做随机变量与期望方差例题，整理错因。' },
    'slot-1530': { activity: '游泳', focus: '以恢复和舒展为主。' },
    'slot-2030': { activity: '以撒的结合', focus: '45 分钟内收住，避免顺手刷视频。' }
  }),
  createDailyPlan('2026-08-07', '8月7日', '大物电磁 + 计组指令', {
    'slot-0800': { activity: '大学物理（乙）Ⅱ', focus: '稳恒电流、磁场基础和典型公式。' },
    'slot-1030': { activity: '计算机组成', focus: '指令系统、寻址方式、CPU 数据通路。' },
    'slot-1400': { activity: '大物公式卡片', focus: '把电场/磁场公式按场景归类。' },
    'slot-1530': { activity: '快走', focus: '45 分钟，顺便复盘上午知识点。' },
    'slot-2030': { activity: '红与黑', focus: '阅读 30 页，做一句话摘要。' }
  }),
  createDailyPlan('2026-08-08', '8月8日', '数据结构强化日', {
    'slot-0800': { activity: '高级数据结构与算法分析', focus: '平衡树、哈希、摊还分析先看概念。' },
    'slot-1030': { activity: '高级数据结构与算法分析', focus: '图论最短路和数据结构应用题型。' },
    'slot-1400': { activity: '算法题练习', focus: '做 2-3 道图论/并查集/堆相关题。' },
    'slot-1530': { activity: '室内燃脂', focus: '25 分钟，结束后记录体重和状态。' },
    'slot-2030': { activity: '第五人格', focus: '45 分钟，结束即停。' }
  }),
  createDailyPlan('2026-08-09', '8月9日', '计组主线日', {
    'slot-0800': { activity: '计算机组成', focus: 'CPU 数据通路、控制器、流水线概念。' },
    'slot-1030': { activity: '计算机组成', focus: '存储层次、Cache 基础和命中率理解。' },
    'slot-1400': { activity: '计组结构图整理', focus: '画 CPU/存储层次结构图，建立整体感。' },
    'slot-1530': { activity: '游泳', focus: '放松肩颈，控制疲劳。' },
    'slot-2030': { activity: '葬送的芙莉莲', focus: '看 1 集，顺手记今天花销。' }
  }),
  createDailyPlan('2026-08-10', '8月10日', '概率统计推进日', {
    'slot-0800': { activity: '概率论与数理统计', focus: '二维随机变量、边缘分布、条件分布。' },
    'slot-1030': { activity: '概率论与数理统计', focus: '大数定律、中心极限定理先看直觉。' },
    'slot-1400': { activity: '概率错题整理', focus: '做 3-5 道分布与期望相关题。' },
    'slot-1530': { activity: '快走', focus: '40 分钟，保持稳定运动量。' },
    'slot-2030': { activity: '红与黑', focus: '阅读 30 页，睡前不刷信息流。' }
  }),
  createDailyPlan('2026-08-11', '8月11日', '大物电磁推进日', {
    'slot-0800': { activity: '大学物理（乙）Ⅱ', focus: '电磁感应、法拉第定律、楞次定律。' },
    'slot-1030': { activity: '大学物理（乙）Ⅱ', focus: '典型题型：感应电动势、磁通量变化。' },
    'slot-1400': { activity: '大物题目训练', focus: '把公式代入和方向判断分开练。' },
    'slot-1530': { activity: '室内燃脂', focus: '30 分钟，练完补水。' },
    'slot-2030': { activity: '以撒的结合', focus: '45 分钟；如果白天进度落后，改为红与黑。' }
  }),
  createDailyPlan('2026-08-12', '8月12日', '算法 + 计组交叉复盘', {
    'slot-0800': { activity: '高级数据结构与算法分析', focus: '平衡树、哈希、图算法回顾。' },
    'slot-1030': { activity: '计算机组成', focus: '流水线和存储层次复盘。' },
    'slot-1400': { activity: '综合笔记整理', focus: '把数据结构模板和计组结构图归档。' },
    'slot-1530': { activity: '游泳', focus: '中等强度，避免过累。' },
    'slot-2030': { activity: '葬送的芙莉莲', focus: '看 1 集，记录当天应用使用时间。' }
  }),
  createDailyPlan('2026-08-13', '8月13日', '概率 + 大物交叉复盘', {
    'slot-0800': { activity: '概率论与数理统计', focus: '常见分布、期望方差、CLT 回顾。' },
    'slot-1030': { activity: '大学物理（乙）Ⅱ', focus: '电磁学公式和题型串联。' },
    'slot-1400': { activity: '综合题目训练', focus: '概率和大物各做一组基础题。' },
    'slot-1530': { activity: '快走', focus: '45 分钟，轻松一点。' },
    'slot-2030': { activity: '第五人格', focus: '45 分钟，结束后填睡眠计划。' }
  }),
  createDailyPlan('2026-08-14', '8月14日', '四门课总复盘', {
    'slot-0800': { activity: '四门课清单复盘', focus: '列出每门课“已懂/半懂/没懂”三栏。' },
    'slot-1030': { activity: '薄弱点补齐', focus: '优先补最影响开学听课的概念。' },
    'slot-1400': { activity: '下学期第一周准备', focus: '整理资料、课程文件夹、预习目录。' },
    'slot-1530': { activity: '室内燃脂', focus: '25 分钟，轻量收尾。' },
    'slot-2030': { activity: '红与黑 / 自由娱乐', focus: '优先阅读；如果完成度高再游戏。' }
  }),
  createDailyPlan('2026-08-15', '8月15日', '收尾日：整理与调整', {
    'slot-0800': { activity: '暑期计划收尾', focus: '总结 8/4-8/15 完成情况和遗留问题。' },
    'slot-1030': { activity: '开学预习交接', focus: '给四门课写下一步任务清单。' },
    'slot-1400': { activity: '自由调整 / 补漏', focus: '哪里欠账补哪里；没有欠账就整理博客记录。' },
    'slot-1530': { activity: '轻松快走', focus: '30 分钟，恢复为主。' },
    'slot-2030': { activity: '自由复盘', focus: '可以看番/阅读/游戏，但把应用时长记上。' }
  })
];

function createDailyPlan(date, label, theme, overrides = {}) {
  return {
    id: date,
    date,
    label,
    theme,
    slots: personalizedTimeSlots.map((slot) => ({
      ...slot,
      ...(overrides[slot.id] || {}),
      id: `${date}-${slot.id}`
    }))
  };
}

const personalizedAppUsageDays = personalizedDailyPlans.map((day) => ({
  id: day.date,
  date: day.date,
  label: day.label,
  theme: day.theme,
  apps: personalizedSummerPlan.apps.map((app) => ({
    ...app,
    id: `${day.date}-${app.id}`,
    actual: ''
  }))
}));

const completionStatusOptions = ['未开始', '完成', '部分完成', '未完成', '不计入'];

const personalizedCompletionDays = personalizedDailyPlans.map((day) => ({
  id: day.date,
  date: day.date,
  label: day.label,
  theme: day.theme,
  tasks: day.slots.map((slot) => ({
    id: `${day.date}-done-${slot.id}`,
    time: slot.time,
    planned: slot.activity,
    actual: '',
    status: '未开始',
    note: ''
  }))
}));

function parseMinutes(value) {
  if (value === null || value === undefined) return 0;
  const text = String(value).trim();
  if (!text) return 0;
  const number = parseFloat(text);
  if (!Number.isFinite(number)) return 0;
  if (/小时|hour|hr|h/i.test(text)) return number * 60;
  return number;
}

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

function parseSearchQuery(value) {
  const filters = { tags: [], categories: [], months: [] };
  const cleaned = String(value || '').replace(SEARCH_FILTER_PATTERN, (_, key, rawValue) => {
    const normalizedKey = String(key).toLowerCase();
    const normalizedValue = String(rawValue || '').trim();
    if (!normalizedValue) return ' ';
    if (normalizedKey === 'tag' || normalizedKey === '标签') filters.tags.push(normalizedValue);
    if (normalizedKey === 'category' || normalizedKey === 'cat' || normalizedKey === '分类') filters.categories.push(normalizedValue);
    if (normalizedKey === 'month' || normalizedKey === '月份') filters.months.push(normalizedValue);
    return ' ';
  });
  const terms = cleaned
    .split(/\s+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return { filters, terms, hasAdvancedFilters: filters.tags.length > 0 || filters.categories.length > 0 || filters.months.length > 0 };
}

function highlightText(value, terms = []) {
  const source = String(value || '');
  const uniqueTerms = Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)));
  if (!source || uniqueTerms.length === 0) return source;

  const lowerSource = source.toLowerCase();
  const matches = [];
  uniqueTerms.forEach((term) => {
    let index = lowerSource.indexOf(term.toLowerCase());
    while (index !== -1) {
      matches.push([index, index + term.length]);
      index = lowerSource.indexOf(term.toLowerCase(), index + Math.max(term.length, 1));
    }
  });
  if (!matches.length) return source;

  const merged = matches
    .sort((left, right) => left[0] - right[0])
    .reduce((result, match) => {
      const previous = result[result.length - 1];
      if (previous && match[0] <= previous[1]) {
        previous[1] = Math.max(previous[1], match[1]);
      } else {
        result.push([...match]);
      }
      return result;
    }, []);

  const parts = [];
  let cursor = 0;
  merged.forEach(([start, end], index) => {
    if (start > cursor) parts.push(source.slice(cursor, start));
    parts.push(<mark key={`${start}-${end}-${index}`}>{source.slice(start, end)}</mark>);
    cursor = end;
  });
  if (cursor < source.length) parts.push(source.slice(cursor));
  return parts;
}

function formatLaunchDuration(now = new Date()) {
  const startedAt = new Date(SITE_LAUNCH_DATE);
  const totalSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return `${days} 天 ${pad(hours)} 小时 ${pad(minutes)} 分 ${pad(seconds)} 秒`;
}

function readAuthFailState() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_FAIL_STATE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAuthFailState(value) {
  localStorage.setItem(AUTH_FAIL_STATE_KEY, JSON.stringify(value));
}

function hasArticleDraftContent(form) {
  return ['title', 'summary', 'content', 'coverUrl', 'tags', 'noteCollection', 'notePath'].some((field) => form[field]?.trim());
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatArticleTimestamp(value, fallback = '保存后生成') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function isTechnicalArticle(article = {}) {
  const haystack = [
    article.category || '',
    article.noteCollection || '',
    article.notePath || '',
    article.title || '',
    article.summary || '',
    ...(article.tags || [])
  ].join(' ');
  return TECH_NOTE_KEYWORDS.some((keyword) => haystack.toLowerCase().includes(keyword.toLowerCase()));
}

function getArticleSection(article) {
  return isTechnicalArticle(article) ? 'notes' : 'essays';
}

function slugifyArticleTitle(title = '') {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function getArticleRouteKey(article = {}) {
  const id = String(article.id || '').trim();
  if (!id) return '';
  const titleSlug = slugifyArticleTitle(article.title || '');
  if (!titleSlug || titleSlug === id) return id;
  return `${titleSlug}--${id}`;
}

function resolveArticleRouteKey(articles = [], routeKey = '') {
  const key = String(routeKey || '').trim();
  if (!key) return '';
  const directMatch = articles.find((article) => String(article.id) === key);
  if (directMatch) return directMatch.id;
  const routeMatch = articles.find((article) => getArticleRouteKey(article) === key);
  if (routeMatch) return routeMatch.id;
  const [, possibleId] = key.match(/--(.+)$/) || [];
  if (possibleId && articles.some((article) => String(article.id) === possibleId)) {
    return possibleId;
  }
  return key;
}

function normalizeRoutePath(pathname = '/') {
  const rawPath = pathname || '/';
  const withoutTrailingSlash = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  return withoutTrailingSlash || '/';
}

function decodeRoutePart(value = '') {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseRoutePath(pathname = '/') {
  const path = normalizeRoutePath(pathname);
  if (path === '/') return { view: 'overview', articleSection: 'essays', articleId: null };

  const parts = path.split('/').filter(Boolean).map(decodeRoutePart);
  const [area, id] = parts;
  if (area === 'articles') return { view: 'articles', articleSection: 'essays', articleId: id || null };
  if (area === 'notes') return { view: 'articles', articleSection: 'notes', articleId: id || null };
  if (area === 'plan') return { view: 'plan', articleSection: 'essays', articleId: null, planSection: PLAN_SECTION_PATHS[id] ? id : 'schedule' };

  const matchedView = Object.entries(VIEW_PATHS).find(([, viewPath]) => normalizeRoutePath(viewPath).slice(1) === area);
  if (matchedView) return { view: matchedView[0], articleSection: 'essays', articleId: null };

  return null;
}

function readCurrentRoute() {
  if (typeof window === 'undefined') return null;
  return parseRoutePath(window.location.pathname);
}

function readInitialActiveView() {
  return readCurrentRoute()?.view || readStoredActiveView();
}

function readInitialArticleSection() {
  return readCurrentRoute()?.articleSection || 'essays';
}

function readInitialArticleId() {
  return readCurrentRoute()?.articleId || null;
}

function readInitialPlanSection() {
  return readCurrentRoute()?.planSection || 'schedule';
}

function getViewPath(view, articleSection = 'essays') {
  if (view === 'articles') return ARTICLE_SECTION_PATHS[articleSection] || ARTICLE_SECTION_PATHS.essays;
  return VIEW_PATHS[view] || VIEW_PATHS.overview;
}

function getPlanPath(section = 'schedule') {
  return PLAN_SECTION_PATHS[section] || VIEW_PATHS.plan;
}

function getArticlePath(articleOrId, fallbackSection = 'essays') {
  const article = typeof articleOrId === 'object' ? articleOrId : null;
  const articleId = article ? getArticleRouteKey(article) : articleOrId;
  const section = article ? getArticleSection(article) : fallbackSection;
  const basePath = ARTICLE_SECTION_PATHS[section] || ARTICLE_SECTION_PATHS.essays;
  return `${basePath}/${encodeURIComponent(articleId)}`;
}

function loadExternalScript(src) {
  if (typeof document === 'undefined') return Promise.resolve();
  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript?.dataset.loaded === 'true') return Promise.resolve();
  if (existingScript?.dataset.loading === 'true') {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.loading = 'true';
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      script.dataset.loading = 'false';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      script.dataset.loading = 'false';
      script.dataset.failed = 'true';
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    }, { once: true });
    document.head.appendChild(script);
  });
}

async function ensureLive2DRuntime() {
  for (const src of LIVE2D_SCRIPT_SOURCES) {
    await loadExternalScript(src);
  }
  const Live2DModel = window.PIXI?.live2d?.Live2DModel;
  if (!window.PIXI || !Live2DModel) {
    throw new Error('Live2D runtime is unavailable');
  }
  return { PIXI: window.PIXI, Live2DModel };
}

function splitNotePath(value = '') {
  return String(value)
    .split(/[\/>｜|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getArticleNoteCollection(article = {}) {
  return article.noteCollection?.trim() || article.category || '技术笔记';
}

function getArticleNotePathSegments(article = {}) {
  const segments = splitNotePath(article.notePath || '');
  if (segments.length) return segments;
  return [article.category || '未收纳'];
}

function createNoteTreeNode(name) {
  return {
    name,
    order: Number.MAX_SAFE_INTEGER,
    children: new Map(),
    articles: []
  };
}

function buildNoteTree(articles = []) {
  const root = new Map();
  articles.forEach((article, index) => {
    const articleOrder = getArticleSortValue(article, index);
    const collectionName = getArticleNoteCollection(article);
    if (!root.has(collectionName)) root.set(collectionName, createNoteTreeNode(collectionName));
    let currentNode = root.get(collectionName);
    currentNode.order = Math.min(currentNode.order, articleOrder);
    getArticleNotePathSegments(article).forEach((segment) => {
      if (segment === collectionName) return;
      if (!currentNode.children.has(segment)) currentNode.children.set(segment, createNoteTreeNode(segment));
      currentNode = currentNode.children.get(segment);
      currentNode.order = Math.min(currentNode.order, articleOrder);
    });
    currentNode.articles.push(article);
  });
  return Array.from(root.values()).sort((first, second) => (first.order || 0) - (second.order || 0));
}

function getArticleSortValue(article = {}, fallbackIndex = 0) {
  const candidates = [article.sortOrder, article.order, article.displayOrder, article.position];
  const numeric = candidates.map(Number).find((value) => Number.isFinite(value));
  return Number.isFinite(numeric) ? numeric : fallbackIndex;
}

function noteNodeHasActiveArticle(node, activeArticleId) {
  return node.articles.some((article) => article.id === activeArticleId)
    || Array.from(node.children.values()).some((child) => noteNodeHasActiveArticle(child, activeArticleId));
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

function countReadableWords(content = '') {
  const plainText = String(content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_\-~=[\]{}()|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cjkCount = (plainText.match(/[\u3400-\u9fff]/g) || []).length;
  const latinWordCount = (plainText.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length;
  return cjkCount + latinWordCount;
}

function estimateReadingTime(content = '') {
  const wordCount = countReadableWords(content);
  const minutes = Math.max(1, Math.ceil(wordCount / 500));
  return `${minutes} min`;
}

function normalizeUploadPath(path = '') {
  return String(path).replace(/\\/g, '/').replace(/^\.?\//, '').trim();
}

function getRelativeImageCandidates(file) {
  const relativePath = normalizeUploadPath(file.webkitRelativePath || file.name || '');
  const filename = normalizeUploadPath(file.name || relativePath);
  return Array.from(new Set([
    relativePath,
    filename,
    `images/${filename}`,
    `./images/${filename}`,
    `assets/${filename}`,
    `./assets/${filename}`
  ].filter(Boolean)));
}

function replaceMarkdownRelativeImages(content, imageUrlMap) {
  return content.replace(/!\[([^\]]*)\]\((?!https?:\/\/|\/|data:)([^)]+)\)/gi, (match, alt, rawPath) => {
    const cleanPath = normalizeUploadPath(rawPath.replace(/^['"]|['"]$/g, ''));
    const nextUrl = imageUrlMap.get(cleanPath) || imageUrlMap.get(decodeURIComponent(cleanPath));
    return nextUrl ? `![${alt}](${nextUrl})` : match;
  });
}

function extractNoteTitle(filename, content) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || '未命名技术笔记';
}

function extractNoteSummary(content) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('```'));
  return (lines[0] || '从 Markdown 导入的技术笔记。').slice(0, 120);
}

function formatTrackTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function formatApiErrorDetail(detail, fallback) {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .filter(Boolean)
      .join('；') || fallback;
  }
  return detail?.message || fallback;
}

function aiTaskLabel(task) {
  return {
    polish: '润色',
    continue: '续写',
    outline: '大纲'
  }[task] || '写作辅助';
}


function App() {
  const [activeView, setActiveView] = useState(readInitialActiveView);
  const [articleSection, setArticleSection] = useState(readInitialArticleSection);
  const [planSection, setPlanSection] = useState(readInitialPlanSection);
  const [theme, setTheme] = useState(readStoredTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readStoredSidebarCollapsed);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(ALL_FILTER);
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);
  const [selectedArchive, setSelectedArchive] = useState(ALL_ARCHIVE);
  const [profile, setProfile] = useState(fallbackProfile);
  const [sitePreferences, setSitePreferences] = useState(DEFAULT_SITE_PREFERENCES);
  const [hasLoadedSitePreferences, setHasLoadedSitePreferences] = useState(false);
  const [isSavingSitePreferences, setIsSavingSitePreferences] = useState(false);
  const [profileForm, setProfileForm] = useState(() => ({
    siteTitle: fallbackProfile.siteTitle || "FelixFu's Craft",
    name: fallbackProfile.name || '副将凡',
    englishName: fallbackProfile.englishName || 'Felix Fu',
    school: fallbackProfile.school || '',
    role: fallbackProfile.role || '',
    summary: fallbackProfile.summary || '',
    interests: (fallbackProfile.interests || []).join('、')
  }));
  const [isSavingSiteProfile, setIsSavingSiteProfile] = useState(false);
  const [articles, setArticles] = useState(fallbackArticles);
  const [aiNews, setAiNews] = useState(fallbackNews);
  const [reactions, setReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentReplyTargets, setCommentReplyTargets] = useState({});
  const [comments, setComments] = useState({});
  const [commentPages, setCommentPages] = useState({});
  const [selectedArticleId, setSelectedArticleId] = useState(readInitialArticleId);
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
  const [isImportingNoteFiles, setIsImportingNoteFiles] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isLoadingUploadedImages, setIsLoadingUploadedImages] = useState(false);
  const [musicTracks, setMusicTracks] = useState([]);
  const [isLoadingMusicTracks, setIsLoadingMusicTracks] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicPlaylists, setMusicPlaylists] = useState(readStoredMusicPlaylists);
  const [recentMusicFilenames, setRecentMusicFilenames] = useState(readStoredRecentMusic);
  const [selectedMusicPlaylistId, setSelectedMusicPlaylistId] = useState('all');
  const [musicCurrentFilename, setMusicCurrentFilename] = useState('');
  const [musicIsPlaying, setMusicIsPlaying] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicRepeatMode, setMusicRepeatMode] = useState('list');
  const [musicVolume, setMusicVolume] = useState(() => {
    if (typeof localStorage === 'undefined') return 0.82;
    const saved = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.82;
  });
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
  const [aiConfigForm, setAiConfigForm] = useState({
    providerName: 'OpenAI Compatible',
    apiStyle: 'openai',
    baseUrl: '',
    model: '',
    apiKey: '',
    timeout: 25,
    enabled: true
  });
  const [aiTestMessage, setAiTestMessage] = useState('');
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isSavingAiSettings, setIsSavingAiSettings] = useState(false);
  const [authToken, setAuthToken] = useState(readStoredAuthToken);
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: ''
  });
  const [authMessage, setAuthMessage] = useState('');
  const [interactionMessage, setInteractionMessage] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [profileAvatarMessage, setProfileAvatarMessage] = useState('');
  const [isSavingProfileAvatar, setIsSavingProfileAvatar] = useState(false);
  const ThemeIcon = theme === 'dark' ? Moon : Sun;
  const nextThemeLabel = theme === 'dark' ? '日间模式' : '夜间模式';
  const SidebarToggleIcon = isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose;
  const globalAudioRef = useRef(null);
  const sidebarAvatarUrl = profile.avatarUrl || '/avatar.jpg';
  const canViewSummerPlan = sitePreferences.summerPlanVisible || currentUser?.role === 'admin';
  const canKeepPlanRoute = canViewSummerPlan || !hasLoadedSitePreferences;

  const visibleNavItems = useMemo(() => {
    const filterPlanEntry = (items) => items.filter((item) => item.id !== 'plan' || canViewSummerPlan);
    if (!currentUser) {
      return filterPlanEntry(visitorNavItems);
    }

    if (currentUser.role === 'admin') {
      return [...filterPlanEntry(readerNavItems), accountNavItem, adminNavItem];
    }

    return [...filterPlanEntry(readerNavItems), accountNavItem];
  }, [canViewSummerPlan, currentUser?.role]);

  const selectedMusicPlaylist = useMemo(
    () => musicPlaylists.find((playlist) => playlist.id === selectedMusicPlaylistId) || null,
    [musicPlaylists, selectedMusicPlaylistId]
  );
  const musicQueue = useMemo(() => {
    if (!selectedMusicPlaylist) return musicTracks;
    const trackMap = new Map(musicTracks.map((track) => [track.filename, track]));
    return selectedMusicPlaylist.trackFilenames
      .map((filename) => trackMap.get(filename))
      .filter(Boolean);
  }, [musicTracks, selectedMusicPlaylist]);
  const currentMusicTrack = useMemo(() => {
    if (!musicQueue.length) return null;
    return musicQueue.find((track) => track.filename === musicCurrentFilename) || musicQueue[0];
  }, [musicCurrentFilename, musicQueue]);
  const recentMusicTracks = useMemo(() => {
    const trackMap = new Map(musicTracks.map((track) => [track.filename, track]));
    return recentMusicFilenames.map((filename) => trackMap.get(filename)).filter(Boolean);
  }, [musicTracks, recentMusicFilenames]);

  function persistMusicPlaylists(nextPlaylists) {
    setMusicPlaylists(nextPlaylists);
    writeStoredJson(MUSIC_PLAYLISTS_KEY, nextPlaylists);
  }

  function rememberMusicTrack(track) {
    if (!track?.filename) return;
    setRecentMusicFilenames((current) => {
      const nextFilenames = [track.filename, ...current.filter((filename) => filename !== track.filename)].slice(0, 8);
      writeStoredJson(MUSIC_RECENT_KEY, nextFilenames);
      return nextFilenames;
    });
  }

  function playMusicTrack(track, playlistId = selectedMusicPlaylistId) {
    if (!track) return;
    rememberMusicTrack(track);
    setSelectedMusicPlaylistId(playlistId);
    setMusicCurrentFilename(track.filename);
    setMusicIsPlaying(true);
    window.setTimeout(() => {
      globalAudioRef.current?.play().catch(() => setMusicIsPlaying(false));
    }, 0);
  }

  function toggleMusicPlayback() {
    if (!currentMusicTrack) return;
    if (musicIsPlaying) {
      globalAudioRef.current?.pause();
      setMusicIsPlaying(false);
      return;
    }
    globalAudioRef.current?.play()
      .then(() => setMusicIsPlaying(true))
      .catch(() => setMusicIsPlaying(false));
  }

  function stepMusicTrack(direction) {
    if (!musicQueue.length) return;
    const currentIndex = Math.max(0, musicQueue.findIndex((track) => track.filename === currentMusicTrack?.filename));
    const nextIndex = (currentIndex + direction + musicQueue.length) % musicQueue.length;
    playMusicTrack(musicQueue[nextIndex]);
  }

  function seekMusicTrack(nextTime) {
    if (globalAudioRef.current) {
      globalAudioRef.current.currentTime = nextTime;
    }
    setMusicProgress(nextTime);
  }

  function handleMusicEnded() {
    if (musicRepeatMode === 'one' && globalAudioRef.current) {
      globalAudioRef.current.currentTime = 0;
      globalAudioRef.current.play().catch(() => setMusicIsPlaying(false));
      return;
    }
    const currentIndex = musicQueue.findIndex((track) => track.filename === currentMusicTrack?.filename);
    if (currentIndex < musicQueue.length - 1 || musicRepeatMode === 'list') {
      stepMusicTrack(1);
      return;
    }
    setMusicIsPlaying(false);
  }

  function writeBrowserRoute(path, { replace = false } = {}) {
    if (typeof window === 'undefined') return;
    const normalizedPath = normalizeRoutePath(path);
    const nextUrl = `${normalizedPath}${window.location.search}${window.location.hash}`;
    const currentUrl = `${normalizeRoutePath(window.location.pathname)}${window.location.search}${window.location.hash}`;
    if (nextUrl === currentUrl) return;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', nextUrl);
  }

  function navigateToView(view, { replace = false, section = articleSection } = {}) {
    const nextView = ROUTED_VIEW_IDS.has(view) ? view : 'overview';
    const nextSection = nextView === 'articles' ? section : 'essays';
    writeBrowserRoute(getViewPath(nextView, nextSection), { replace });
    setActiveView(nextView);
    setArticleSection(nextSection);
    setSelectedArticleId(null);
  }

  function navigateToArticleSection(section, { replace = false } = {}) {
    const nextSection = section === 'notes' ? 'notes' : 'essays';
    writeBrowserRoute(getViewPath('articles', nextSection), { replace });
    setActiveView('articles');
    setArticleSection(nextSection);
    setSelectedArticleId(null);
  }

  function navigateToArticle(articleId, { replace = false } = {}) {
    const resolvedArticleId = resolveArticleRouteKey(articles, articleId);
    const article = articles.find((item) => String(item.id) === String(resolvedArticleId));
    const nextSection = article ? getArticleSection(article) : articleSection;
    writeBrowserRoute(getArticlePath(article || resolvedArticleId, nextSection), { replace });
    setActiveView('articles');
    setArticleSection(nextSection);
    setSelectedArticleId(resolvedArticleId);
  }

  function createMusicPlaylist(name) {
    const playlistName = name.trim();
    if (!playlistName) return;
    const nextPlaylist = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: playlistName,
      trackFilenames: []
    };
    persistMusicPlaylists([nextPlaylist, ...musicPlaylists]);
    setSelectedMusicPlaylistId(nextPlaylist.id);
  }

  function deleteMusicPlaylist(playlistId) {
    const playlist = musicPlaylists.find((item) => item.id === playlistId);
    if (!playlist) return;
    if (!window.confirm(`确定删除歌单「${playlist.name}」吗？音乐文件不会被删除。`)) return;
    persistMusicPlaylists(musicPlaylists.filter((item) => item.id !== playlistId));
    setSelectedMusicPlaylistId('all');
  }

  function updateMusicPlaylistTracks(playlistId, updater) {
    persistMusicPlaylists(musicPlaylists.map((playlist) => (
      playlist.id === playlistId
        ? { ...playlist, trackFilenames: updater(playlist.trackFilenames || []) }
        : playlist
    )));
  }

  function toggleTrackInPlaylist(playlistId, filename) {
    updateMusicPlaylistTracks(playlistId, (filenames) => (
      filenames.includes(filename)
        ? filenames.filter((item) => item !== filename)
        : [...filenames, filename]
    ));
  }

  function moveTrackInPlaylist(playlistId, filename, direction) {
    updateMusicPlaylistTracks(playlistId, (filenames) => {
      const index = filenames.indexOf(filename);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= filenames.length) return filenames;
      const next = [...filenames];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function reorderTrackInPlaylist(playlistId, sourceFilename, targetFilename) {
    if (!playlistId || playlistId === 'all' || sourceFilename === targetFilename) return;
    updateMusicPlaylistTracks(playlistId, (filenames) => {
      const sourceIndex = filenames.indexOf(sourceFilename);
      const targetIndex = filenames.indexOf(targetFilename);
      if (sourceIndex < 0 || targetIndex < 0) return filenames;
      const next = [...filenames];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  useEffect(() => {
    localStorage.setItem(ACTIVE_VIEW_KEY, activeView);
  }, [activeView]);

  useEffect(() => {
    function handleRouteChange() {
      const route = readCurrentRoute();
      if (!route) {
        navigateToView('overview', { replace: true });
        return;
      }
      setActiveView(route.view);
      setArticleSection(route.articleSection || 'essays');
      setPlanSection(route.planSection || 'schedule');
      setSelectedArticleId(route.articleId || null);
    }

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    const routePath = activeView === 'articles' && selectedArticleId
      ? getArticlePath(
        articles.find((article) => String(article.id) === String(selectedArticleId)) || selectedArticleId,
        articleSection
      )
      : activeView === 'plan'
        ? getPlanPath(planSection)
      : getViewPath(activeView, articleSection);
    writeBrowserRoute(routePath, { replace: true });
  }, [activeView, articleSection, planSection, selectedArticleId, articles]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setMusicProgress(0);
    setMusicDuration(0);
    if (musicIsPlaying) {
      globalAudioRef.current?.play().catch(() => setMusicIsPlaying(false));
    }
  }, [currentMusicTrack?.url]);

  useEffect(() => {
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = musicVolume;
    }
    localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
  }, [musicVolume]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [profileRes, preferencesRes, newsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/site-preferences'),
          fetch('/api/ai/news')
        ]);

        if (profileRes.ok) {
          const profilePayload = await profileRes.json();
          setProfile(profilePayload);
          setProfileForm({
            siteTitle: profilePayload.siteTitle || "FelixFu's Craft",
            name: profilePayload.name || '副将凡',
            englishName: profilePayload.englishName || 'Felix Fu',
            school: profilePayload.school || '',
            role: profilePayload.role || '',
            summary: profilePayload.summary || '',
            interests: (profilePayload.interests || []).join('、')
          });
        }
        if (preferencesRes.ok) {
          setSitePreferences({
            ...DEFAULT_SITE_PREFERENCES,
            ...(await preferencesRes.json())
          });
        }
        if (newsRes.ok) {
          setAiNews(await newsRes.json());
        }
        await refreshArticles();
        await refreshMusicTracks();
      } catch {
        // The MVP can run as a standalone frontend before the API is started.
      } finally {
        setHasLoadedSitePreferences(true);
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
      persistAuthSession(token);
      setCurrentUser(null);
      setAuthToken(token);
      setAuthMessage('GitHub 登录成功');
      navigateToView('admin', { replace: true });
      return;
    }

    setAuthMessage(error ? `GitHub 登录失败：${error}` : 'GitHub 登录失败');
    navigateToView('login', { replace: true });
  }, []);

  useEffect(() => {
    if (!authToken) {
      clearStoredAuthSession();
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
        persistAuthSession(authToken, result.user);
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
      refreshMusicTracks();
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
    if (activeView !== 'articles' || !selectedArticleId) return;
    const resolvedArticleId = resolveArticleRouteKey(articles, selectedArticleId);
    if (resolvedArticleId && resolvedArticleId !== selectedArticleId) {
      setSelectedArticleId(resolvedArticleId);
      return;
    }
    loadArticleDetail(resolvedArticleId);
  }, [activeView, selectedArticleId, authToken, articles]);

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
      const publicViews = canKeepPlanRoute
        ? ['overview', 'articles', 'plan', 'music', 'toolbox', 'game', 'login']
        : ['overview', 'articles', 'music', 'toolbox', 'game', 'login'];
      if (!publicViews.includes(activeView)) {
        navigateToView('overview', { replace: true });
      }
      return;
    }

    if (activeView === 'plan' && !canKeepPlanRoute) {
      navigateToView('overview', { replace: true });
      return;
    }

    if (activeView === 'admin' && currentUser.role !== 'admin') {
      navigateToView('overview', { replace: true });
      return;
    }

    if (activeView === 'ai') {
      navigateToView('overview', { replace: true });
    }
  }, [activeView, authToken, canKeepPlanRoute, currentUser?.role]);

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

  async function refreshMusicTracks() {
    setIsLoadingMusicTracks(true);
    try {
      const response = await fetch('/api/music/tracks');
      if (!response.ok) return [];
      const tracks = await response.json();
      setMusicTracks(tracks);
      return tracks;
    } catch {
      return [];
    } finally {
      setIsLoadingMusicTracks(false);
    }
  }

  function downloadJsonFile(filename, payload) {
    if (typeof document === 'undefined') return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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

  async function saveSitePreferences(nextPreferences) {
    if (currentUser?.role !== 'admin') return;
    const nextPayload = {
      ...DEFAULT_SITE_PREFERENCES,
      ...sitePreferences,
      ...nextPreferences
    };
    setIsSavingSitePreferences(true);
    try {
      const response = await fetch('/api/admin/site-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(nextPayload)
      });
      if (!response.ok) throw new Error('save preferences failed');
      setSitePreferences({
        ...DEFAULT_SITE_PREFERENCES,
        ...(await response.json())
      });
      setAdminMessage('站点开关已保存');
    } catch {
      setAdminMessage('站点开关保存失败，请确认后端连接');
    } finally {
      setIsSavingSitePreferences(false);
    }
  }

  function updateProfileForm(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function normalizeProfilePayload(extra = {}) {
    return {
      siteTitle: profileForm.siteTitle.trim() || "FelixFu's Craft",
      name: profileForm.name.trim() || '副将凡',
      englishName: profileForm.englishName.trim() || 'Felix Fu',
      school: profileForm.school.trim(),
      role: profileForm.role.trim(),
      summary: profileForm.summary.trim(),
      interests: profileForm.interests
        .split(/[、,，\n]+/)
        .map((item) => item.trim())
        .filter(Boolean),
      avatarUrl: profile.avatarUrl || '/avatar.jpg',
      ...extra
    };
  }

  async function saveSiteProfile(extra = {}) {
    if (currentUser?.role !== 'admin') return null;
    setIsSavingSiteProfile(true);
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(normalizeProfilePayload(extra))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || `HTTP ${response.status}`);
      setProfile(result);
      setProfileForm({
        siteTitle: result.siteTitle || "FelixFu's Craft",
        name: result.name || '副将凡',
        englishName: result.englishName || 'Felix Fu',
        school: result.school || '',
        role: result.role || '',
        summary: result.summary || '',
        interests: (result.interests || []).join('、')
      });
      setAdminMessage('公开资料已保存');
      refreshAdminAuditLogs();
      return result;
    } catch {
      setAdminMessage('公开资料保存失败，请确认后端连接');
      return null;
    } finally {
      setIsSavingSiteProfile(false);
    }
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
        setAiConfigForm((current) => ({
          ...current,
          providerName: payload.provider || current.providerName || 'OpenAI Compatible',
          apiStyle: payload.apiStyle || current.apiStyle || 'openai',
          baseUrl: payload.baseUrl || current.baseUrl || '',
          model: payload.model || current.model || '',
          apiKey: '',
          timeout: payload.timeout || current.timeout || 25,
          enabled: payload.enabled ?? current.enabled
        }));
        setAiTestForm((current) => ({
          ...current,
          providerName: current.providerName || payload.provider || '',
          apiStyle: current.apiStyle || payload.apiStyle || 'openai',
          baseUrl: current.baseUrl || payload.baseUrl || '',
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

  async function testAiConfigSettings(event) {
    event?.preventDefault();
    if (currentUser?.role !== 'admin') return;
    setIsTestingAi(true);
    setAiTestMessage('正在用当前表单测试 AI...');
    try {
      const response = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(aiConfigForm)
      });
      const payload = await response.json().catch(() => ({}));
      setAiTestMessage(payload.message || (response.ok ? '测试完成' : '测试失败'));
    } catch {
      setAiTestMessage('后端服务不可用，无法测试 AI 配置');
    } finally {
      setIsTestingAi(false);
    }
  }

  async function saveAiSettings(event) {
    event?.preventDefault();
    if (currentUser?.role !== 'admin') return;
    setIsSavingAiSettings(true);
    setAiTestMessage('正在保存 AI 配置...');
    try {
      const response = await fetch('/api/admin/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(aiConfigForm)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAiTestMessage(payload.detail || 'AI 配置保存失败');
        return;
      }
      setAiSettings(payload);
      setAiConfigForm((current) => ({ ...current, apiKey: '' }));
      setAiTestMessage('AI 配置已保存，写作助手会优先使用真实模型');
      await refreshAdminAuditLogs();
    } catch {
      setAiTestMessage('后端服务不可用，无法保存 AI 配置');
    } finally {
      setIsSavingAiSettings(false);
    }
  }

  async function disableAiSettings() {
    if (currentUser?.role !== 'admin') return;
    setIsSavingAiSettings(true);
    try {
      const response = await fetch('/api/admin/ai/settings/disable', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setAiSettings(payload);
        setAiConfigForm((current) => ({ ...current, enabled: false, apiKey: '' }));
        setAiTestMessage('AI 已停用，写作助手会回到本地模板');
        await refreshAdminAuditLogs();
      } else {
        setAiTestMessage(payload.detail || 'AI 停用失败');
      }
    } catch {
      setAiTestMessage('后端服务不可用，无法停用 AI');
    } finally {
      setIsSavingAiSettings(false);
    }
  }

  async function deleteAiSettings() {
    if (currentUser?.role !== 'admin') return;
    if (!window.confirm('确定删除后台保存的 AI 配置吗？删除后需要重新填写 API Key。')) return;
    setIsSavingAiSettings(true);
    try {
      const response = await fetch('/api/admin/ai/settings', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setAiSettings(payload);
        setAiConfigForm({
          providerName: 'OpenAI Compatible',
          apiStyle: 'openai',
          baseUrl: '',
          model: '',
          apiKey: '',
          timeout: 25,
          enabled: true
        });
        setAiTestMessage('AI 配置已删除');
        await refreshAdminAuditLogs();
      } else {
        setAiTestMessage(payload.detail || 'AI 配置删除失败');
      }
    } catch {
      setAiTestMessage('后端服务不可用，无法删除 AI 配置');
    } finally {
      setIsSavingAiSettings(false);
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

  async function loadArticleDetail(articleId) {
    if (!articleId) return;
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

  async function openArticle(articleId) {
    navigateToArticle(articleId);
  }

  function updateAuthForm(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAuthForm(event) {
    event.preventDefault();
    const failState = readAuthFailState();
    if (Number(failState.lockedUntil || 0) > Date.now()) {
      const seconds = Math.ceil((Number(failState.lockedUntil) - Date.now()) / 1000);
      setAuthMessage(`登录尝试过多，请 ${seconds} 秒后再试`);
      return;
    }

    setIsAuthLoading(true);
    setAuthMessage('');

    const payload = {
      email: authForm.email,
      password: authForm.password
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const nextCount = Number(failState.count || 0) + 1;
        writeAuthFailState({
          count: nextCount,
          lockedUntil: nextCount >= 5 ? Date.now() + LOGIN_LOCK_MS : 0
        });
        setAuthMessage(result.detail || '登录失败');
        return;
      }

      localStorage.removeItem(AUTH_FAIL_STATE_KEY);
      persistAuthSession(result.token, result.user);
      setAuthToken(result.token);
      setCurrentUser(result.user);
      setInteractionMessage('');
      await refreshArticles(result.token);
      setAuthMessage('已登录');
      navigateToView(result.user?.role === 'admin' ? 'admin' : 'articles');
    } catch {
      setAuthMessage('后端服务不可用，登录失败');
    } finally {
      setIsAuthLoading(false);
    }
  }

  function logout(redirect = true) {
    clearStoredAuthSession();
    setAuthToken('');
    setCurrentUser(null);
    setAuthMessage('');
    setInteractionMessage('');
    if (redirect) {
      navigateToView('overview');
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

  const searchMeta = useMemo(() => parseSearchQuery(query), [query]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const tagMatched = selectedTag === ALL_FILTER || article.tags.includes(selectedTag);
      const categoryMatched = selectedCategory === ALL_FILTER || (article.category || '学习笔记') === selectedCategory;
      const archiveMatched = selectedArchive === ALL_ARCHIVE || getArticleMonth(article.date) === selectedArchive;
      const advancedTagMatched = searchMeta.filters.tags.every((tag) =>
        article.tags.some((articleTag) => articleTag.toLowerCase().includes(tag.toLowerCase()))
      );
      const advancedCategoryMatched = searchMeta.filters.categories.every((category) =>
        (article.category || '学习笔记').toLowerCase().includes(category.toLowerCase())
      );
      const advancedMonthMatched = searchMeta.filters.months.every((month) => getArticleMonth(article.date).includes(month));
      const text = `${article.title} ${article.summary} ${article.content} ${article.category || ''} ${article.tags.join(' ')}`.toLowerCase();
      const termMatched = searchMeta.terms.every((term) => text.includes(term));
      return categoryMatched && tagMatched && archiveMatched && advancedTagMatched && advancedCategoryMatched && advancedMonthMatched && termMatched;
    });
  }, [articles, searchMeta, selectedCategory, selectedTag, selectedArchive]);

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
    setArticleForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'content') {
        next.readTime = estimateReadingTime(value);
      }
      return next;
    });
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
        createdAt: '',
        updatedAt: '',
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

  async function updateSidebarAvatar(file) {
    if (!file) return;
    if (currentUser?.role !== 'admin') {
      setProfileAvatarMessage('只有管理员可以修改侧边栏头像');
      return;
    }

    setProfileAvatarMessage('正在上传新头像...');
    const image = await uploadAdminImage(file);
    if (!image?.url) {
      setProfileAvatarMessage('头像上传失败，请换一张 JPG、PNG、WebP、GIF 或 SVG 图片试试');
      return;
    }

    setIsSavingProfileAvatar(true);
    setProfileAvatarMessage('头像已上传，正在保存到网站...');
    try {
      const result = await saveSiteProfile({ avatarUrl: image.url });
      if (!result) {
        setProfileAvatarMessage('头像保存失败，请稍后再试');
        return;
      }
      setProfileAvatarMessage('侧边栏头像已更新');
    } catch {
      setProfileAvatarMessage('后端服务不可用，头像暂时没保存成功');
    } finally {
      setIsSavingProfileAvatar(false);
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

  async function importNoteFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return false;
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return false;
    }

    const markdownFile = files.find((file) => /\.md$/i.test(file.name));
    if (!markdownFile) {
      setAdminMessage('没有找到 .md 笔记文件');
      return false;
    }

    setIsImportingNoteFiles(true);
    setAdminMessage('正在导入 Markdown 笔记...');
    try {
      const imageUrlMap = new Map();
      const imageFiles = files.filter((file) => ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type));
      for (const imageFile of imageFiles) {
        const uploaded = await uploadAdminImage(imageFile);
        if (!uploaded?.url) continue;
        getRelativeImageCandidates(imageFile).forEach((candidate) => imageUrlMap.set(normalizeUploadPath(candidate), uploaded.url));
      }

      const rawContent = await readFileAsText(markdownFile);
      const content = replaceMarkdownRelativeImages(rawContent, imageUrlMap);
      const title = extractNoteTitle(markdownFile.name, content);
      const summary = extractNoteSummary(content);
      const readTime = estimateReadingTime(content);

      setEditingArticleId(null);
      setArticleForm({
        ...createEmptyArticleForm(),
        title,
        summary,
        content,
        tags: '技术笔记, Markdown',
        category: '技术笔记',
        readTime,
        noteCollection: 'X-lab 软件团队学习笔记',
        notePath: '未分组',
        status: 'draft'
      });
      setAdminMessage(`已导入笔记：${title}。图片路径已尽量自动替换，可预览后发布。`);
      return true;
    } catch {
      setAdminMessage('笔记导入失败，请确认 Markdown 文件编码为 UTF-8');
      return false;
    } finally {
      setIsImportingNoteFiles(false);
    }
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
      readTime: estimateReadingTime(article.content),
      createdAt: article.createdAt || '',
      updatedAt: article.updatedAt || '',
      status: article.status || 'published',
      category: article.category || '学习笔记',
      noteCollection: article.noteCollection || '',
      notePath: article.notePath || '',
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
      readTime: estimateReadingTime(articleForm.content),
      status: nextStatus,
      category: articleForm.category,
      noteCollection: articleForm.noteCollection,
      notePath: articleForm.notePath,
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

  function buildArticlePayload(article, overrides = {}) {
    return {
      title: article.title,
      summary: article.summary,
      content: article.content,
      coverUrl: article.coverUrl || '',
      tags: Array.isArray(article.tags) ? article.tags : [],
      date: article.date,
      readTime: article.readTime,
      status: article.status || 'published',
      category: article.category || '学习笔记',
      noteCollection: article.noteCollection || '',
      notePath: article.notePath || '',
      pinned: Boolean(article.pinned),
      sortOrder: Number(article.sortOrder || 0),
      ...overrides
    };
  }

  async function reorderArticles(sourceArticleId, targetArticleId) {
    if (!authToken || !sourceArticleId || !targetArticleId || sourceArticleId === targetArticleId) return;
    const currentArticles = [...articles];
    const sourceIndex = currentArticles.findIndex((article) => article.id === sourceArticleId);
    const targetIndex = currentArticles.findIndex((article) => article.id === targetArticleId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [movedArticle] = currentArticles.splice(sourceIndex, 1);
    currentArticles.splice(targetIndex, 0, movedArticle);
    const optimisticArticles = currentArticles.map((article, index) => ({ ...article, sortOrder: index }));
    setArticles(optimisticArticles);
    setAdminMessage('正在保存文章顺序...');

    try {
      const response = await fetch('/api/admin/article-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ articleIds: optimisticArticles.map((article) => article.id) })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAdminMessage(result.detail || '文章顺序保存失败');
        await refreshArticles();
        return;
      }
      await refreshArticles();
      await refreshAdminAuditLogs();
      setAdminMessage('文章顺序已保存');
    } catch {
      await refreshArticles();
      setAdminMessage('后端服务不可用，文章顺序保存失败');
    }
  }

  async function manageArticlesBulk(selectedArticles, action) {
    const targets = Array.isArray(selectedArticles) ? selectedArticles.filter(Boolean) : [];
    if (!targets.length) {
      setAdminMessage('请先选择要批量处理的文章');
      return;
    }
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }

    const actionLabel = action === 'delete' ? '删除' : action === 'draft' ? '改为草稿' : '发布';
    if (action === 'delete' && !window.confirm(`确定批量删除 ${targets.length} 篇文章吗？这个操作不可撤销。`)) {
      setAdminMessage('已取消批量删除');
      return;
    }

    setIsSavingArticle(true);
    setAdminMessage(`正在批量${actionLabel} ${targets.length} 篇文章...`);
    let successCount = 0;
    try {
      for (const article of targets) {
        const response = action === 'delete'
          ? await fetch(`/api/admin/articles/${article.id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            })
          : await fetch(`/api/admin/articles/${article.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify(buildArticlePayload(article, { status: action === 'draft' ? 'draft' : 'published' }))
            });
        if (response.ok) {
          successCount += 1;
        }
      }

      if (action === 'delete' && targets.some((article) => article.id === editingArticleId)) {
        resetArticleForm();
      }
      await refreshArticles();
      await refreshAdminAuditLogs();
      setAdminMessage(`批量${actionLabel}完成：${successCount} / ${targets.length} 篇`);
    } catch {
      setAdminMessage(`批量${actionLabel}中断，请稍后再试`);
    } finally {
      setIsSavingArticle(false);
    }
  }

  async function collectArticlesBulk(selectedArticles, placement) {
    const targets = Array.isArray(selectedArticles) ? selectedArticles.filter(Boolean) : [];
    if (!targets.length) {
      setAdminMessage('请先选择要收纳的文章或笔记');
      return;
    }
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }
    const noteCollection = (placement?.noteCollection || '').trim();
    const notePath = (placement?.notePath || '').trim();
    if (!noteCollection && !notePath) {
      setAdminMessage('至少填写一个合集名或目录路径');
      return;
    }

    setIsSavingArticle(true);
    setAdminMessage(`正在收纳 ${targets.length} 篇内容...`);
    let successCount = 0;
    try {
      for (const article of targets) {
        const response = await fetch(`/api/admin/articles/${article.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(buildArticlePayload(article, {
            category: article.category || '学习笔记',
            noteCollection,
            notePath
          }))
        });
        if (response.ok) successCount += 1;
      }
      await refreshArticles();
      await refreshAdminAuditLogs();
      setAdminMessage(`已收纳：${successCount} / ${targets.length} 篇`);
    } catch {
      setAdminMessage('收纳保存失败，请稍后再试');
    } finally {
      setIsSavingArticle(false);
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

  async function uploadMusicTrack(file) {
    if (!file) return;
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }
    const suffix = file.name?.split('.').pop()?.toLowerCase();
    const allowedSuffixes = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']);
    if (!ALLOWED_AUDIO_UPLOAD_TYPES.has(file.type) && !allowedSuffixes.has(suffix)) {
      setAdminMessage('音乐上传失败：只支持 MP3、WAV、OGG、FLAC、M4A 或 AAC');
      return;
    }
    if (file.size > AUDIO_UPLOAD_MAX_BYTES) {
      setAdminMessage('音乐上传失败：单个文件不能超过 50 MB');
      return;
    }

    if (file.size > AUDIO_UPLOAD_CHUNK_BYTES) {
      await uploadMusicTrackInChunks(file);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploadingMusic(true);
    setAdminMessage('正在上传音乐...');
    try {
      const response = await fetch('/api/admin/uploads/music', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fallbackMessage = response.status === 413
          ? '音乐上传失败：服务器上传上限太小，需要调整 Nginx client_max_body_size'
          : `音乐上传失败：HTTP ${response.status}`;
        setAdminMessage(formatApiErrorDetail(result.detail, fallbackMessage));
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }
      await refreshMusicTracks();
      await refreshAdminAuditLogs();
      setAdminMessage(`音乐已加入歌单：${result.title || file.name}`);
    } catch {
      setAdminMessage('后端服务不可用，音乐上传失败');
    } finally {
      setIsUploadingMusic(false);
    }
  }

  async function uploadMusicTrackInChunks(file) {
    const uploadId = `${Date.now()}-${Math.random().toString(16).slice(2)}`.replace(/[^0-9A-Za-z._-]/g, '').slice(0, 80);
    const totalChunks = Math.ceil(file.size / AUDIO_UPLOAD_CHUNK_BYTES);
    let finalResult = null;
    setIsUploadingMusic(true);
    try {
      for (let index = 0; index < totalChunks; index += 1) {
        const start = index * AUDIO_UPLOAD_CHUNK_BYTES;
        const chunk = file.slice(start, Math.min(file.size, start + AUDIO_UPLOAD_CHUNK_BYTES));
        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('filename', file.name || 'track.mp3');
        formData.append('chunkIndex', String(index));
        formData.append('totalChunks', String(totalChunks));
        formData.append('file', chunk, file.name || 'track.mp3');
        setAdminMessage(`正在上传音乐... ${index + 1}/${totalChunks}`);

        const response = await fetch('/api/admin/uploads/music/chunk', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const fallbackMessage = response.status === 413
            ? '音乐上传失败：服务器上传上限太小，需要调整 Nginx client_max_body_size'
            : `音乐上传失败：HTTP ${response.status}`;
          setAdminMessage(formatApiErrorDetail(result.detail, fallbackMessage));
          if (response.status === 401 || response.status === 403) {
            setActiveView('login');
          }
          return;
        }
        finalResult = result;
      }

      await refreshMusicTracks();
      await refreshAdminAuditLogs();
      setAdminMessage(`音乐已加入歌单：${finalResult?.title || file.name}`);
    } catch {
      setAdminMessage('后端服务不可用，音乐上传失败');
    } finally {
      setIsUploadingMusic(false);
    }
  }

  async function uploadMusicSidecar(track, file, kind) {
    if (!track?.filename || !file) return;
    if (!authToken) {
      setAdminMessage('请先登录管理员账号');
      setActiveView('login');
      return;
    }
    const isCover = kind === 'cover';
    const suffix = file.name?.split('.').pop()?.toLowerCase();
    const valid = isCover
      ? (file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(suffix))
      : ['lrc', 'txt'].includes(suffix) || file.type?.startsWith('text/');
    if (!valid) {
      setAdminMessage(isCover ? '封面只支持 jpg、png、webp 或 gif' : '歌词只支持 .lrc 或 .txt');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setAdminMessage(isCover ? '正在上传封面...' : '正在上传歌词...');
    try {
      const response = await fetch(`/api/admin/uploads/music/${encodeURIComponent(track.filename)}/${kind}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAdminMessage(result.detail || (isCover ? '封面上传失败' : '歌词上传失败'));
        if (response.status === 401 || response.status === 403) setActiveView('login');
        return;
      }
      await refreshMusicTracks();
      await refreshAdminAuditLogs();
      setAdminMessage(isCover ? `封面已更新：${result.title || track.title}` : `歌词已更新：${result.title || track.title}`);
    } catch {
      setAdminMessage('后端服务不可用，音乐附加文件上传失败');
    }
  }

  function uploadMusicCover(track, file) {
    return uploadMusicSidecar(track, file, 'cover');
  }

  function uploadMusicLyrics(track, file) {
    return uploadMusicSidecar(track, file, 'lyrics');
  }

  async function deleteMusicTrack(track) {
    if (!window.confirm(`确定删除音乐 ${track.title || track.filename} 吗？`)) return;
    try {
      const response = await fetch(`/api/admin/uploads/music/${encodeURIComponent(track.filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        setAdminMessage('音乐删除失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }
      setMusicTracks((current) => current.filter((item) => item.filename !== track.filename));
      await refreshAdminAuditLogs();
      setAdminMessage('音乐已删除');
    } catch {
      setAdminMessage('后端服务不可用，音乐删除失败');
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

  async function approveAdminCommentsBulk(commentList) {
    const ids = commentList
      .filter((comment) => comment.status === 'pending')
      .map((comment) => comment.id)
      .filter(Boolean);
    if (!ids.length) {
      setAdminMessage('当前筛选结果没有待审评论');
      return;
    }
    if (!window.confirm(`确定通过当前筛选结果中的 ${ids.length} 条待审评论吗？`)) return;

    try {
      const response = await fetch('/api/admin/comments/approve-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ids })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAdminMessage(result.detail || '批量通过失败');
        if (response.status === 401 || response.status === 403) {
          setActiveView('login');
        }
        return;
      }
      setAdminMessage(`已通过 ${result.approved || 0} 条评论`);
      await refreshAdminComments({ resetPage: false });
      await refreshArticles();
      await refreshAdminStats();
      await refreshAdminAuditLogs();
    } catch {
      setAdminMessage('后端服务不可用，批量通过失败');
    }
  }

  const isRestoringSession = Boolean(authToken && !currentUser);
  const showGlobalSearch = activeView === 'articles';
  const shellClassName = [
    'app-shell',
    isSidebarCollapsed ? 'sidebar-collapsed' : '',
    activeView === 'admin' ? 'admin-shell' : 'frontstage-shell'
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClassName}>
      <aside className="sidebar" aria-label="博客导航" aria-expanded={!isSidebarCollapsed}>
        <div className="brand">
          <img className="brand-mark" src={sidebarAvatarUrl} alt="站点头像" />
          <div className="brand-text">
            <strong>{profile.siteTitle || "FelixFu's Craft"}</strong>
            <span>{profile.name || '副将凡'}</span>
          </div>
          <button
            className="sidebar-toggle-button"
            type="button"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            aria-label={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            <SidebarToggleIcon size={18} />
          </button>
        </div>

        <nav className="nav-list">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? 'nav-button active' : 'nav-button'}
                type="button"
                onClick={() => navigateToView(item.id)}
                title={item.label}
                aria-label={item.label}
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
            </>
          ) : (
            <>
              <span>后台账号</span>
              <button className="icon-text-button" type="button" onClick={() => navigateToView('login')} title="登录" aria-label="登录">
                <LogIn size={17} />
                <span>登录</span>
              </button>
            </>
          )}
        </div>

        {activeView !== 'music' && (
          <SidebarMusicPlayer
            track={currentMusicTrack}
            isPlaying={musicIsPlaying}
            progress={musicProgress}
            duration={musicDuration}
            togglePlayback={toggleMusicPlayback}
            stepTrack={stepMusicTrack}
            seekTrack={seekMusicTrack}
            openMusic={() => navigateToView('music')}
          />
        )}
      </aside>

      <main className="main-content">
        {activeView !== 'admin' && <DecorativeStickerLayer activeView={activeView} />}

        <audio
          ref={globalAudioRef}
          src={currentMusicTrack?.url || undefined}
          preload="metadata"
          onLoadedMetadata={(event) => setMusicDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setMusicProgress(event.currentTarget.currentTime || 0)}
          onPlay={() => setMusicIsPlaying(true)}
          onPause={() => setMusicIsPlaying(false)}
          onEnded={handleMusicEnded}
        >
          当前浏览器不支持音频播放。
        </audio>

        <header className={showGlobalSearch ? 'topbar' : 'topbar topbar-compact'}>
          {showGlobalSearch && (
            <div className="search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、正文或标签"
                aria-label="搜索标题、正文或标签"
              />
            </div>
          )}
          <div className="topbar-actions">
            <button
              className="theme-toggle-button"
              type="button"
              onClick={toggleTheme}
              title={`切换到${nextThemeLabel}`}
              aria-label={`切换到${nextThemeLabel}`}
            >
              <ThemeIcon size={16} />
              <span>{theme === 'dark' ? '夜间' : '日间'}</span>
            </button>
            <div className="status-pill">
              <Zap size={16} />
              <span>在线工作台</span>
            </div>
          </div>
        </header>

        {isRestoringSession && activeView !== 'login' && (
          <section className="admin-panel auth-restore-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>正在恢复登录</h2>
                <span>已找到上次保存的登录信息，正在和后端确认账号状态。</span>
              </div>
            </div>
          </section>
        )}

        {activeView === 'overview' && <Overview profile={profile} articles={articles} setActiveView={navigateToView} currentUser={currentUser} canViewSummerPlan={canViewSummerPlan} />}

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
            query={query}
            searchMeta={searchMeta}
            articleSection={articleSection}
            setArticleSection={navigateToArticleSection}
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

        {activeView === 'music' && (
          <MusicWorkspace
            tracks={musicTracks}
            queue={musicQueue}
            currentTrack={currentMusicTrack}
            recentTracks={recentMusicTracks}
            isPlaying={musicIsPlaying}
            progress={musicProgress}
            duration={musicDuration}
            repeatMode={musicRepeatMode}
            setRepeatMode={setMusicRepeatMode}
            volume={musicVolume}
            setVolume={setMusicVolume}
            isLoading={isLoadingMusicTracks}
            refreshMusicTracks={refreshMusicTracks}
            selectedPlaylistId={selectedMusicPlaylistId}
            setSelectedPlaylistId={setSelectedMusicPlaylistId}
            playlists={musicPlaylists}
            selectedPlaylist={selectedMusicPlaylist}
            createPlaylist={createMusicPlaylist}
            deletePlaylist={deleteMusicPlaylist}
            toggleTrackInPlaylist={toggleTrackInPlaylist}
            moveTrackInPlaylist={moveTrackInPlaylist}
            reorderTrackInPlaylist={reorderTrackInPlaylist}
            playTrack={playMusicTrack}
            togglePlayback={toggleMusicPlayback}
            stepTrack={stepMusicTrack}
            seekTrack={seekMusicTrack}
          />
        )}

        {activeView === 'plan' && (
          <SummerPlanWorkspace
            authToken={authToken}
            currentUser={currentUser}
            planSection={planSection}
            setPlanSection={setPlanSection}
          />
        )}

        {activeView === 'toolbox' && <ToolboxWorkspace currentUser={currentUser} authToken={authToken} />}

        {activeView === 'account' && currentUser && (
          <AccountWorkspace
            currentUser={currentUser}
            profile={profile}
            accountActivity={accountActivity}
            refreshAccountActivity={refreshAccountActivity}
            setActiveView={navigateToView}
            updateSidebarAvatar={updateSidebarAvatar}
            profileAvatarMessage={profileAvatarMessage}
            isSavingProfileAvatar={isSavingProfileAvatar || isUploadingImage}
            logout={logout}
            openArticle={(articleId) => {
              openArticle(articleId);
            }}
          />
        )}

        {activeView === 'login' && (
          <LoginWorkspace
            authForm={authForm}
            updateAuthForm={updateAuthForm}
            submitAuthForm={submitAuthForm}
            authMessage={authMessage}
            isAuthLoading={isAuthLoading}
            currentUser={currentUser}
            logout={logout}
            goToAdmin={() => navigateToView('admin')}
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
            isImportingNoteFiles={isImportingNoteFiles}
            uploadedImages={uploadedImages}
            isLoadingUploadedImages={isLoadingUploadedImages}
            musicTracks={musicTracks}
            isLoadingMusicTracks={isLoadingMusicTracks}
            isUploadingMusic={isUploadingMusic}
            articleDraftNotice={articleDraftNotice}
            adminMessage={adminMessage}
            setAdminMessage={setAdminMessage}
            adminStats={adminStats}
            adminAuditLogs={adminAuditLogs}
            isLoadingAuditLogs={isLoadingAuditLogs}
            refreshAdminStats={refreshAdminStats}
            refreshAdminAuditLogs={refreshAdminAuditLogs}
            aiSettings={aiSettings}
            aiTestForm={aiTestForm}
            setAiTestForm={setAiTestForm}
            aiConfigForm={aiConfigForm}
            setAiConfigForm={setAiConfigForm}
            aiTestMessage={aiTestMessage}
            isTestingAi={isTestingAi}
            isSavingAiSettings={isSavingAiSettings}
            testAiSettings={testAiSettings}
            testAiConfigSettings={testAiConfigSettings}
            saveAiSettings={saveAiSettings}
            disableAiSettings={disableAiSettings}
            deleteAiSettings={deleteAiSettings}
            refreshAiSettings={refreshAiSettings}
            aiGenerationHistory={aiGenerationHistory}
            submitArticleForm={submitArticleForm}
            importNoteFiles={importNoteFiles}
            uploadArticleCover={uploadArticleCover}
            uploadArticleContentImage={uploadArticleContentImage}
            refreshUploadedImages={refreshUploadedImages}
            copyUploadedImageUrl={copyUploadedImageUrl}
            deleteUploadedImage={deleteUploadedImage}
            refreshMusicTracks={refreshMusicTracks}
            uploadMusicTrack={uploadMusicTrack}
            uploadMusicCover={uploadMusicCover}
            uploadMusicLyrics={uploadMusicLyrics}
            deleteMusicTrack={deleteMusicTrack}
            runArticleAiTask={runArticleAiTask}
            undoLatestArticleAiResult={undoLatestArticleAiResult}
            restoreArticleDraft={restoreArticleDraft}
            clearArticleDraft={clearArticleDraft}
            resetArticleForm={resetArticleForm}
            startEditingArticle={startEditingArticle}
            deleteArticle={deleteArticle}
            reorderArticles={reorderArticles}
            manageArticlesBulk={manageArticlesBulk}
            collectArticlesBulk={collectArticlesBulk}
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
            approveAdminCommentsBulk={approveAdminCommentsBulk}
            deleteAdminComment={deleteAdminComment}
            currentUser={currentUser}
            authToken={authToken}
            profile={profile}
            profileForm={profileForm}
            updateProfileForm={updateProfileForm}
            saveSiteProfile={saveSiteProfile}
            isSavingSiteProfile={isSavingSiteProfile}
            sitePreferences={sitePreferences}
            isSavingSitePreferences={isSavingSitePreferences}
            saveSitePreferences={saveSitePreferences}
            logout={logout}
          />
        )}
      </main>
      {activeView !== 'admin' && activeView !== 'login' && <Live2DMascot activeView={activeView} />}
    </div>
  );
}

function Overview({ profile, articles, setActiveView, currentUser, canViewSummerPlan }) {
  const identityPhrases = useMemo(
    () => ['爱折腾的计算机学生', 'Web 全栈学习者', 'AI 工具搭建者', '安全与运维探索者', '长跑中的长期主义者'],
    []
  );
  const [typingIndex, setTypingIndex] = useState(0);
  const [typedIdentity, setTypedIdentity] = useState('');
  const [isDeletingIdentity, setIsDeletingIdentity] = useState(false);
  const [homeNow, setHomeNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setHomeNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentPhrase = identityPhrases[typingIndex];
    const isComplete = !isDeletingIdentity && typedIdentity === currentPhrase;
    const isCleared = isDeletingIdentity && typedIdentity === '';
    const delay = isComplete ? 1500 : isCleared ? 280 : isDeletingIdentity ? 42 : 78;

    const timer = window.setTimeout(() => {
      if (isComplete) {
        setIsDeletingIdentity(true);
        return;
      }

      if (isCleared) {
        setIsDeletingIdentity(false);
        setTypingIndex((current) => (current + 1) % identityPhrases.length);
        return;
      }

      const nextLength = typedIdentity.length + (isDeletingIdentity ? -1 : 1);
      setTypedIdentity(currentPhrase.slice(0, nextLength));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [identityPhrases, isDeletingIdentity, typedIdentity, typingIndex]);

  const publishedArticles = articles.filter((article) => article.status !== 'draft');
  const recentArticle = publishedArticles[0];
  const totalViews = publishedArticles.reduce((sum, article) => sum + Number(article.viewCount || 0), 0);
  const totalComments = publishedArticles.reduce((sum, article) => sum + (article.comments?.length || 0), 0);
  const currentMonthCount = publishedArticles.filter((article) => getArticleMonth(article.date) === getArticleMonth(new Date().toISOString())).length;
  const clockTime = homeNow.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const clockDate = homeNow.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const clockZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时间';
  const latestUpdates = releaseArchive.slice(0, 3);
  const liveStats = [
    { label: '上线时间', value: formatLaunchDuration(homeNow), detail: '精准到秒' },
    { label: '公开文章', value: `${publishedArticles.length} 篇`, detail: currentMonthCount ? `本月 ${currentMonthCount} 篇` : '等待新内容' },
    { label: '阅读记录', value: `${totalViews} 次`, detail: totalComments ? `${totalComments} 条评论` : '来自文章详情页' }
  ];
  const recentArticles = [...articles].slice(0, 3);
  const homeEntryCards = [
    { title: '随笔和文章', detail: '生活、游戏、番剧、读书和普通文章。', view: 'articles', icon: BookOpen, meta: `${publishedArticles.length} 篇` },
    { title: '技术笔记', detail: '课程笔记、项目文档和代码学习记录。', view: 'articles', section: 'notes', icon: Code2, meta: '/notes' },
    { title: '音乐', detail: '私人歌单、最近播放和站内迷你播放器。', view: 'music', icon: Music, meta: 'Felix Music' },
    { title: '工具箱', detail: '常用网站、友链和维护入口。', view: 'toolbox', icon: Wrench, meta: 'Links' }
  ];
  const terminalLines = [
    ['boot', 'personal site online'],
    ['stack', 'React + FastAPI + PostgreSQL + Docker'],
    ['latest', recentArticles[0]?.title || '等待第一篇新文章'],
    ['mode', currentUser?.role === 'admin' ? 'admin workspace unlocked' : 'reader mode']
  ];
  return (
    <section className="workspace homepage-workspace">
      <section className="geek-hero" aria-labelledby="home-title">
        <div className="geek-grid" aria-hidden="true" />
        <div className="geek-hero-inner">
          <div className="hero-badge geek-badge">
            <span aria-hidden="true" />
            <strong>目前专注</strong>
            <em>{profile.role}</em>
          </div>
          <p className="terminal-path">~/whoami</p>
          <h1 id="home-title" className="geek-title">
            <span className="gradient-text">{profile.siteTitle || "FelixFu's Craft"}</span>
          </h1>
          <p className="site-owner-line">by {profile.name || '副将凡'} · {profile.englishName || 'Felix Fu'}</p>
          <p className="typewriter-line" aria-label={`一名${typedIdentity}`}>
            <span>一名</span>
            <strong>{typedIdentity || identityPhrases[0].slice(0, 1)}</strong>
            <i aria-hidden="true" />
          </p>
          <p className="geek-summary">
            {profile.summary}
          </p>
          <div className="hero-terminal" aria-label="站点动态摘要">
            <div className="hero-terminal-bar">
              <span />
              <span />
              <span />
              <strong>felixfu@site:~</strong>
            </div>
            <div className="hero-terminal-lines">
              {terminalLines.map(([label, value]) => (
                <p key={label}>
                  <span>$ {label}</span>
                  <strong>{value}</strong>
                </p>
              ))}
            </div>
          </div>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => setActiveView('articles')}>
              <BookOpen size={17} />
              <span>看看我的文章</span>
            </button>
            {canViewSummerPlan ? (
              <button className="ghost-button" type="button" onClick={() => setActiveView('plan')}>
                <List size={17} />
                <span>看学习计划</span>
              </button>
            ) : (
              <button className="ghost-button" type="button" onClick={() => setActiveView('toolbox')}>
                <Wrench size={17} />
                <span>打开工具箱</span>
              </button>
            )}
          </div>
          <div className="interest-row geek-interest-row">
            {profile.interests.map((interest) => (
              <span key={interest}>{interest}</span>
            ))}
          </div>
          <div className="metric-grid hero-metrics">
            {profile.metrics.map((metric) => (
              <div className="metric" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-pulse-grid" aria-label="时钟和最近更新">
        <article className="content-band home-clock-card">
          <div className="home-widget-heading">
            <span>
              <Clock size={18} />
            </span>
            <div>
              <p className="eyebrow">时钟</p>
              <h2>此刻</h2>
            </div>
          </div>
          <strong className="home-clock-time">{clockTime}</strong>
          <div className="home-clock-meta">
            <span>{clockDate}</span>
            <em>{clockZone}</em>
          </div>
          <div className="live-status-grid compact">
            {liveStats.map((item) => (
              <article className="live-status-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="content-band home-updates-card">
          <div className="home-widget-heading">
            <span>
              <Code2 size={18} />
            </span>
            <div>
              <p className="eyebrow">最近更新</p>
              <h2>刚改了什么</h2>
            </div>
          </div>
          <div className="home-update-timeline">
            {latestUpdates.map((release) => (
              <div className="home-update-item" key={release.version}>
                <div>
                  <span>{release.version}</span>
                  <strong>{release.title}</strong>
                  <em>{release.date}</em>
                </div>
                <ul>
                  {release.points.slice(0, 3).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-band home-entry-band">
        <div className="section-heading">
          <p className="eyebrow">入口</p>
          <h2>想看什么，直接进去</h2>
        </div>
        <div className="home-entry-grid">
          {homeEntryCards.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                className="home-entry-card"
                type="button"
                key={entry.title}
                onClick={() => setActiveView(entry.view, entry.section ? { section: entry.section } : undefined)}
              >
                <span><Icon size={19} /></span>
                <strong>{entry.title}</strong>
                <p>{entry.detail}</p>
                <em>{entry.meta}</em>
              </button>
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
  setCommentPages,
  query = '',
  searchMeta = parseSearchQuery(''),
  articleSection = 'essays',
  setArticleSection = () => {}
}) {
  const selectedArticle = articles.find((article) => String(article.id) === String(selectedArticleId)) || null;
  const essayArticles = articles.filter((article) => getArticleSection(article) === 'essays');
  const noteArticles = articles.filter((article) => getArticleSection(article) === 'notes');
  const activeArticles = articleSection === 'notes' ? noteArticles : essayArticles;
  const hasSearch = query.trim().length > 0;
  const searchTips = [
    searchMeta.filters.tags.length ? `标签：${searchMeta.filters.tags.join('、')}` : '',
    searchMeta.filters.categories.length ? `分类：${searchMeta.filters.categories.join('、')}` : '',
    searchMeta.filters.months.length ? `月份：${searchMeta.filters.months.join('、')}` : '',
    searchMeta.terms.length ? `关键词：${searchMeta.terms.join('、')}` : ''
  ].filter(Boolean);
  const popularArticles = [...activeArticles]
    .filter((article) => Number(article.viewCount || 0) > 0)
    .sort((first, second) => Number(second.viewCount || 0) - Number(first.viewCount || 0))
    .slice(0, 5);

  useEffect(() => {
    if (articleSection === 'essays' && essayArticles.length === 0 && noteArticles.length > 0) {
      setArticleSection('notes');
    }
    if (articleSection === 'notes' && noteArticles.length === 0 && essayArticles.length > 0) {
      setArticleSection('essays');
    }
  }, [articleSection, essayArticles.length, noteArticles.length]);

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
        onBack={() => setArticleSection(articleSection)}
        siblingArticles={articles}
        openArticle={openArticle}
      />
    );
  }

  return (
    <section className="workspace">
      <div className="section-heading">
        <p className="eyebrow">文章中心</p>
        <h1>随笔娱乐和技术笔记分开看</h1>
        {hasSearch && (
          <p className="search-result-summary">
            找到 {activeArticles.length} 篇内容{searchTips.length ? ` · ${searchTips.join(' · ')}` : ''}
          </p>
        )}
      </div>

      <div className="article-section-switch" aria-label="文章入口">
        <button
          className={articleSection === 'essays' ? 'article-section-card active' : 'article-section-card'}
          type="button"
          onClick={async () => {
            setArticleSection('essays');
            setSelectedArticleId(null);
          }}
        >
          <span>随笔 / 娱乐文章</span>
          <strong>{essayArticles.length} 篇</strong>
          <em>生活、游戏、番剧、读书、小作文都放这里，保留现在的内置写作台气质。</em>
        </button>
        <button
          className={articleSection === 'notes' ? 'article-section-card active' : 'article-section-card'}
          type="button"
          onClick={async () => {
            setArticleSection('notes');
            setSelectedArticleId(null);
          }}
        >
          <span>技术笔记</span>
          <strong>{noteArticles.length} 篇</strong>
          <em>课程笔记、项目文档和代码学习记录，按知识库方式阅读。</em>
        </button>
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
            <strong>{category === ALL_FILTER ? activeArticles.length : activeArticles.filter((article) => (article.category || '学习笔记') === category).length}</strong>
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

      {activeArticles.length === 0 ? (
        <p className="empty-state">没有找到符合条件的文章</p>
      ) : (
        <div className="article-list">
          {activeArticles.map((article) => (
            <article className="article-card article-preview" key={article.id}>
              {article.coverUrl && <ArticleCover article={article} />}
              <div className="article-meta">
                {article.pinned && <span>置顶</span>}
                <span>{article.category || '学习笔记'}</span>
                <span>{article.date}</span>
                <span>{article.readTime}</span>
                <span>创建 {formatArticleTimestamp(article.createdAt, article.date || '未知')}</span>
                <span>修改 {formatArticleTimestamp(article.updatedAt, article.createdAt || article.date || '未知')}</span>
                <span><Eye size={15} /> {article.viewCount || 0}</span>
              </div>
              <h2>{highlightText(article.title, searchMeta.terms)}</h2>
              <p className="article-summary">{highlightText(article.summary, searchMeta.terms)}</p>
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
  onBack,
  siblingArticles = [],
  openArticle = () => {}
}) {
  const articleComments = comments[article.id] || [];
  const approvedCommentCount = articleComments.filter((comment) => comment.status !== 'pending').length;
  const pendingOwnCommentCount = currentUser
    ? articleComments.filter((comment) => comment.status === 'pending' && comment.userId === currentUser.id).length
    : 0;
  const latestComment = articleComments[articleComments.length - 1];
  const commentPageGroups = paginateComments(articleComments);
  const currentCommentPage = Math.min(
    commentPages[article.id] || 0,
    Math.max(commentPageGroups.length - 1, 0)
  );
  const visibleComments = commentPageGroups[currentCommentPage] || [];
  const draftLength = (commentDrafts[article.id] || '').length;
  const replyTarget = commentReplyTargets?.[article.id] || null;
  const articleRef = useRef(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const headings = useMemo(() => getMarkdownHeadings(article.content || ''), [article.content]);
  const isNoteArticle = isTechnicalArticle(article);
  const noteArticles = siblingArticles.filter((item) => isTechnicalArticle(item));
  const navigationArticles = (isNoteArticle ? noteArticles : siblingArticles)
    .filter((item) => item.status !== 'draft')
    .sort((first, second) => String(second.date || '').localeCompare(String(first.date || '')));
  const currentArticleIndex = navigationArticles.findIndex((item) => String(item.id) === String(article.id));
  const previousArticle = currentArticleIndex > 0 ? navigationArticles[currentArticleIndex - 1] : null;
  const nextArticle = currentArticleIndex >= 0 && currentArticleIndex < navigationArticles.length - 1
    ? navigationArticles[currentArticleIndex + 1]
    : null;

  useEffect(() => {
    function updateReadingProgress() {
      if (!articleRef.current) {
        setReadingProgress(0);
        return;
      }
      const rect = articleRef.current.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const end = start + articleRef.current.scrollHeight - window.innerHeight;
      const total = Math.max(1, end - start);
      const nextProgress = Math.min(1, Math.max(0, (window.scrollY - start) / total));
      setReadingProgress(nextProgress);
    }

    updateReadingProgress();
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('resize', updateReadingProgress);
    return () => {
      window.removeEventListener('scroll', updateReadingProgress);
      window.removeEventListener('resize', updateReadingProgress);
    };
  }, [article.id]);

  return (
    <section className={isNoteArticle ? 'workspace article-detail-workspace note-detail-workspace' : 'workspace article-detail-workspace'}>
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>返回文章列表</span>
      </button>

      {interactionMessage && <p className="interaction-message">{interactionMessage}</p>}

      <div className={isNoteArticle ? 'note-reading-grid' : 'article-reading-grid'}>
      {isNoteArticle && (
        <NoteTree articles={noteArticles} activeArticleId={article.id} openArticle={openArticle} />
      )}

      <article className="article-card article-detail-card" ref={articleRef}>
        {article.coverUrl && <ArticleCover article={article} size="large" />}
        <div className="article-meta">
          {article.pinned && <span>置顶</span>}
          <span>{article.category || '学习笔记'}</span>
          <span>{article.date}</span>
          <span>{article.readTime}</span>
          <span>创建 {formatArticleTimestamp(article.createdAt, article.date || '未知')}</span>
          <span>修改 {formatArticleTimestamp(article.updatedAt, article.createdAt || article.date || '未知')}</span>
          <span><Eye size={15} /> {article.viewCount || 0}</span>
        </div>
        <h1>{article.title}</h1>
        <p className="article-summary">{article.summary}</p>
        <div className="tag-row">
          {article.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {!isNoteArticle && (
        <div className="reading-toolbar" aria-label="阅读状态">
          <div>
            <span>阅读进度</span>
            <strong>{Math.round(readingProgress * 100)}%</strong>
          </div>
          <div className="reading-progress-track" aria-hidden="true">
            <span style={{ transform: `scaleX(${readingProgress})` }} />
          </div>
        </div>
        )}

        {!isNoteArticle && headings.length > 0 && <ArticleToc headings={headings} />}

        {article.content && (
          <MarkdownContent content={article.content} title={article.title} />
        )}

        {(previousArticle || nextArticle) && (
          <nav className="article-neighbor-nav" aria-label="上一篇和下一篇">
            {previousArticle ? (
              <button type="button" onClick={() => openArticle(previousArticle.id)}>
                <span>上一篇</span>
                <strong>{previousArticle.title}</strong>
              </button>
            ) : <span />}
            {nextArticle ? (
              <button type="button" onClick={() => openArticle(nextArticle.id)}>
                <span>下一篇</span>
                <strong>{nextArticle.title}</strong>
              </button>
            ) : <span />}
          </nav>
        )}

        <div className="reaction-row">
          <IconToggle
            active={reactions[article.id]?.like}
            label="点赞"
            count={reactionCounts[article.id]?.like || 0}
            icon={Heart}
            tone="like"
            onClick={() => toggleReaction(article.id, 'like')}
          />
          <IconToggle
            active={reactions[article.id]?.favorite}
            label="收藏"
            count={reactionCounts[article.id]?.favorite || 0}
            icon={Star}
            tone="favorite"
            onClick={() => toggleReaction(article.id, 'favorite')}
          />
          <IconToggle
            active={reactions[article.id]?.downvote}
            label="点踩"
            count={reactionCounts[article.id]?.downvote || 0}
            icon={ThumbsDown}
            tone="downvote"
            onClick={() => toggleReaction(article.id, 'downvote')}
          />
          <IconToggle
            active={reactions[article.id]?.question}
            label="?"
            count={reactionCounts[article.id]?.question || 0}
            icon={CircleHelp}
            tone="question"
            onClick={() => toggleReaction(article.id, 'question')}
          />
        </div>

        <div className="comment-box">
          <div className="comment-title">
            <div>
              <MessageCircle size={17} />
              <span>评论区</span>
            </div>
            <em>{articleComments.length} 条可见评论</em>
          </div>
          <div className="comment-insight-grid" aria-label="评论状态">
            <div>
              <span>公开评论</span>
              <strong>{approvedCommentCount}</strong>
            </div>
            <div>
              <span>最近互动</span>
              <strong>{latestComment ? formatCommentTime(latestComment.createdAt) : '等待第一条'}</strong>
            </div>
            <div>
              <span>我的状态</span>
              <strong>
                {currentUser ? (pendingOwnCommentCount ? `${pendingOwnCommentCount} 条待审` : '可参与讨论') : '登录后评论'}
              </strong>
            </div>
          </div>
          {pendingOwnCommentCount > 0 && (
            <p className="comment-pending-note">你的待审核评论只有你和站长能看到，审核通过后会公开显示。</p>
          )}
          {visibleComments.map((comment, index) => (
            <div
              className={`comment ${comment.authorRole === 'admin' ? 'owner-comment' : ''} ${
                currentUser?.id === comment.userId ? 'my-comment' : ''
              } ${comment.status === 'pending' ? 'pending-comment' : ''}`.trim()}
              key={comment.id || `${article.id}-${currentCommentPage}-${index}`}
            >
              <div className="comment-meta">
                <strong>{comment.authorName || '访客'}</strong>
                {comment.authorRole === 'admin' && <span className="comment-badge owner">站长</span>}
                {currentUser?.id === comment.userId && <span className="comment-badge mine">我</span>}
                {comment.status === 'pending' && <span className="comment-badge pending">待审核</span>}
                {comment.replyToAuthor && <em>回复 {comment.replyToAuthor}</em>}
              </div>
              <p>{comment.content}</p>
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
      {isNoteArticle && (
        <aside className="note-side-panel">
          <div className="reading-toolbar" aria-label="阅读状态">
            <div>
              <span>阅读进度</span>
              <strong>{Math.round(readingProgress * 100)}%</strong>
            </div>
            <div className="reading-progress-track" aria-hidden="true">
              <span style={{ transform: `scaleX(${readingProgress})` }} />
            </div>
          </div>
          {headings.length > 0 ? <ArticleToc headings={headings} /> : <p className="empty-state">这篇笔记还没有标题目录</p>}
        </aside>
      )}
      </div>
    </section>
  );
}

function NoteTree({ articles, activeArticleId, openArticle }) {
  const tree = buildNoteTree(articles);

  return (
    <aside className="note-tree" aria-label="技术笔记目录树" tabIndex={0}>
      <div className="note-tree-peek" aria-hidden="true">
        <BookOpen size={16} />
        <span>笔记索引</span>
      </div>
      <div className="note-tree-panel">
        <div className="note-tree-heading">
          <BookOpen size={17} />
          <span>技术笔记</span>
        </div>
        {tree.map((node) => (
          <NoteTreeNode
            activeArticleId={activeArticleId}
            key={node.name}
            level={0}
            node={node}
            openArticle={openArticle}
          />
        ))}
      </div>
    </aside>
  );
}

function NoteTreeNode({ node, activeArticleId, openArticle, level }) {
  const childNodes = Array.from(node.children.values()).sort((first, second) => (first.order || 0) - (second.order || 0));
  const articles = [...node.articles].sort((first, second) => getArticleSortValue(first) - getArticleSortValue(second));
  const isOpenByDefault = level < 1 || noteNodeHasActiveArticle(node, activeArticleId);
  const [isOpen, setIsOpen] = useState(isOpenByDefault);

  useEffect(() => {
    if (noteNodeHasActiveArticle(node, activeArticleId)) setIsOpen(true);
  }, [activeArticleId, node]);

  return (
    <details className="note-tree-folder" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary style={{ '--tree-level': level }}>
        <span className="note-folder-caret"><ChevronRight size={14} /></span>
        <span>{node.name}</span>
      </summary>
      <div className="note-tree-children">
        {childNodes.map((child) => (
          <NoteTreeNode
            activeArticleId={activeArticleId}
            key={`${node.name}-${child.name}`}
            level={level + 1}
            node={child}
            openArticle={openArticle}
          />
        ))}
        {articles.map((item) => (
          <button
            className={item.id === activeArticleId ? 'note-tree-article active' : 'note-tree-article'}
            key={item.id}
            style={{ '--tree-level': level + 1 }}
            type="button"
            onClick={() => openArticle(item.id)}
          >
            <span>{item.title}</span>
            <em>{item.readTime}</em>
          </button>
        ))}
      </div>
    </details>
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
  function jumpToHeading(event, headingId) {
    event.preventDefault();
    const target = document.getElementById(headingId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${headingId}`);
  }

  return (
    <nav className="article-toc" aria-label="文章目录">
      <div className="article-toc-heading">文章目录</div>
      <div className="article-toc-list">
        {headings.map((heading) => (
          <a
            className={`toc-level-${heading.level}`}
            href={`#${heading.id}`}
            key={heading.id}
            onClick={(event) => jumpToHeading(event, heading.id)}
          >
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

function MarkdownCodeBlock({ language, text }) {
  const [isCopied, setIsCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1400);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <pre className="markdown-code">
      <div className="markdown-code-toolbar">
        <span>{language || 'code'}</span>
        <button type="button" onClick={copyCode}>
          <Copy size={14} />
          <span>{isCopied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <code>{text}</code>
    </pre>
  );
}

function MarkdownMermaidBlock({ text }) {
  const diagram = useMemo(() => parseSimpleMermaidDiagram(text), [text]);
  const [showSource, setShowSource] = useState(!diagram);

  if (!diagram) {
    return (
      <div className="markdown-mermaid source-only">
        <div className="markdown-mermaid-toolbar">
          <span>Mermaid</span>
          <em>暂不支持的图表，显示源码</em>
        </div>
        <pre>{text}</pre>
      </div>
    );
  }

  return (
    <div className="markdown-mermaid">
      <div className="markdown-mermaid-toolbar">
        <span>Mermaid</span>
        <button type="button" onClick={() => setShowSource((current) => !current)}>
          {showSource ? '看图表' : '看源码'}
        </button>
      </div>
      {showSource ? (
        <pre>{text}</pre>
      ) : (
        <svg
          className="markdown-mermaid-svg"
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          role="img"
          aria-label="Mermaid 流程图"
        >
          <defs>
            <marker id="mermaid-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          {diagram.edges.map((edge) => (
            <path
              className="markdown-mermaid-edge"
              d={`M ${edge.from.x + edge.from.width} ${edge.from.y + edge.from.height / 2} C ${edge.from.x + edge.from.width + 40} ${edge.from.y + edge.from.height / 2}, ${edge.to.x - 40} ${edge.to.y + edge.to.height / 2}, ${edge.to.x} ${edge.to.y + edge.to.height / 2}`}
              key={`${edge.from.id}-${edge.to.id}`}
            />
          ))}
          {diagram.nodes.map((node) => (
            <g className="markdown-mermaid-node" key={node.id}>
              <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="10" />
              <text x={node.x + node.width / 2} y={node.y + node.height / 2 + 5}>{node.label}</text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

function parseSimpleMermaidDiagram(source = '') {
  const lines = source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('%%') && !/^graph\s+/i.test(line) && !/^flowchart\s+/i.test(line));
  const nodeMap = new Map();
  const edges = [];

  function readNode(raw) {
    const cleaned = raw.trim().replace(/;$/, '');
    const match = cleaned.match(/^([A-Za-z0-9_-]+)(?:\[(.+?)\]|\((.+?)\)|\{(.+?)\})?$/);
    if (!match) return null;
    const id = match[1];
    const label = (match[2] || match[3] || match[4] || id).replace(/^["']|["']$/g, '');
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label });
    } else if (label !== id) {
      nodeMap.set(id, { ...nodeMap.get(id), label });
    }
    return nodeMap.get(id);
  }

  lines.forEach((line) => {
    const arrow = line.includes('-->') ? '-->' : line.includes('---') ? '---' : null;
    if (!arrow) return;
    const [leftRaw, rightRaw] = line.split(arrow);
    const from = readNode(leftRaw);
    const to = readNode(rightRaw);
    if (from && to) edges.push({ fromId: from.id, toId: to.id });
  });

  const nodes = Array.from(nodeMap.values());
  if (!nodes.length || !edges.length || nodes.length > 18) return null;

  const columns = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(nodes.length))));
  const nodeWidth = 150;
  const nodeHeight = 52;
  const gapX = 72;
  const gapY = 44;
  const laidOutNodes = nodes.map((node, index) => ({
    ...node,
    width: nodeWidth,
    height: nodeHeight,
    x: 20 + (index % columns) * (nodeWidth + gapX),
    y: 22 + Math.floor(index / columns) * (nodeHeight + gapY)
  }));
  const laidOutMap = new Map(laidOutNodes.map((node) => [node.id, node]));
  return {
    width: 40 + columns * nodeWidth + (columns - 1) * gapX,
    height: 44 + Math.ceil(nodes.length / columns) * nodeHeight + (Math.ceil(nodes.length / columns) - 1) * gapY,
    nodes: laidOutNodes,
    edges: edges
      .map((edge) => ({ from: laidOutMap.get(edge.fromId), to: laidOutMap.get(edge.toId) }))
      .filter((edge) => edge.from && edge.to)
  };
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
  const cacheKey = String(content || '');
  if (markdownBlockCache.has(cacheKey)) {
    return markdownBlockCache.get(cacheKey);
  }
  const blocks = parseMarkdownBlocksUncached(cacheKey);
  markdownBlockCache.set(cacheKey, blocks);
  if (markdownBlockCache.size > MARKDOWN_CACHE_LIMIT) {
    markdownBlockCache.delete(markdownBlockCache.keys().next().value);
  }
  return blocks;
}

function parseMarkdownBlocksUncached(content) {
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

    const fencedCode = trimmed.match(/^(```|~~~)\s*(.*)$/);
    if (fencedCode) {
      const fence = fencedCode[1];
      const language = fencedCode[2].trim();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence)) {
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

    const nextTrimmed = index + 1 < lines.length ? lines[index + 1].trim() : '';
    if (
      nextTrimmed &&
      /^(=+|-+)$/.test(nextTrimmed) &&
      !isMarkdownControlLine(trimmed) &&
      !parseMarkdownImage(trimmed)
    ) {
      blocks.push({ type: 'heading', level: nextTrimmed.startsWith('=') ? 1 : 2, text: trimmed });
      index += 2;
      continue;
    }

    if (/^(([-*_])\s*){3,}$/.test(trimmed)) {
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

    if (isUnorderedListLine(trimmed)) {
      const items = [];
      while (index < lines.length && isUnorderedListLine(lines[index].trim())) {
        const parsedItem = parseListItem(lines[index].trim());
        items.push(parsedItem);
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
      const callout = parseMarkdownCallout(quotes);
      if (callout) {
        blocks.push(callout);
        continue;
      }
      blocks.push({ type: 'quote', lines: quotes });
      continue;
    }

    const paragraph = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !lines[index].trim().startsWith('~~~') &&
      !lines[index].trim().startsWith('$$') &&
      !lines[index].trim().startsWith('\\[') &&
      !/^(([-*_])\s*){3,}$/.test(lines[index].trim()) &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !parseMarkdownImage(lines[index].trim()) &&
      !isUnorderedListLine(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim()) &&
      !isMarkdownTableStart(lines, index) &&
      !(index + 1 < lines.length && /^(=+|-+)$/.test(lines[index + 1].trim()) && !isMarkdownControlLine(lines[index].trim())) &&
      !lines[index].trim().startsWith('>')
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', lines: paragraph });
  }

  return blocks;
}

function isMarkdownControlLine(line) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^(([-*_])\s*){3,}$/.test(line) ||
    /^(```|~~~)/.test(line) ||
    line.startsWith('$$') ||
    line.startsWith('\\[') ||
    line.startsWith('>') ||
    isUnorderedListLine(line) ||
    /^\d+[.)]\s+/.test(line) ||
    isMarkdownTableRow(line)
  );
}

function isUnorderedListLine(line) {
  return /^[-*+](?:\s+|$)/.test(line) || /^[-*+]\[( |x|X)\]\s*/.test(line);
}

function parseListItem(line) {
  const task = line.match(/^[-*+]\s*\[( |x|X)\]\s*(.*)$/);
  if (task) {
    return {
      text: task[2],
      checked: task[1].toLowerCase() === 'x',
      task: true
    };
  }
  return {
    text: line.replace(/^[-*+]\s*/, ''),
    checked: false,
    task: false
  };
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

function parseMarkdownCallout(lines) {
  if (!lines.length) return null;
  const marker = lines[0].trim().match(/^\[!(NOTE|TIP|INFO|WARNING|IMPORTANT|ERROR|DANGER|QUOTE)\]\s*(.*)$/i);
  if (!marker) return null;
  const tone = marker[1].toLowerCase();
  const fallbackTitle = {
    note: 'Note',
    tip: 'Tip',
    info: 'Info',
    warning: 'Warning',
    important: 'Important',
    error: 'Error',
    danger: 'Danger',
    quote: 'Quote'
  };
  return {
    type: 'callout',
    tone,
    title: marker[2].trim() || fallbackTitle[tone] || 'Note',
    lines: lines.slice(1).filter((line) => line.trim())
  };
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
    if ((block.language || '').trim().toLowerCase() === 'mermaid') {
      return <MarkdownMermaidBlock text={block.text} key={index} />;
    }
    return <MarkdownCodeBlock language={block.language} text={block.text} key={index} />;
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
      <ul className={block.items.some((item) => item.task) ? 'markdown-task-list' : undefined} key={index}>
        {block.items.map((item, itemIndex) => (
          <li className={item.task ? 'markdown-task-item' : undefined} key={itemIndex}>
            {item.task && <input type="checkbox" checked={item.checked} readOnly />}
            <span>{renderInlineMarkdown(item.text)}</span>
          </li>
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
    return <blockquote key={index}>{renderInlineLines(block.lines)}</blockquote>;
  }
  if (block.type === 'callout') {
    return (
      <aside className={`markdown-callout ${block.tone}`} key={index}>
        <strong>{block.title}</strong>
        {block.lines.length > 0 && <div>{renderInlineLines(block.lines)}</div>}
      </aside>
    );
  }
  return <p key={index}>{renderInlineLines(block.lines || [block.text])}</p>;
}

function renderInlineLines(lines = []) {
  return lines.flatMap((line, index) => (
    index === 0
      ? [<React.Fragment key={`line-${index}`}>{renderInlineMarkdown(line)}</React.Fragment>]
      : [<br key={`break-${index}`} />, <React.Fragment key={`line-${index}`}>{renderInlineMarkdown(line)}</React.Fragment>]
  ));
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

function renderInlineMarkdown(text = '') {
  const parts = [];
  const pattern = /(!\[[^\]]*\]\([^)]+\)|\[\[[^\]\n]+\]\]|(?:^|[\s([{，。；：])#[\u3400-\u9fffA-Za-z0-9_-]+|\\\([^\n]+?\\\)|\$[^$\n]+\$|`[^`]+`|==[^=\n]+==|~~[^~\n]+~~|\*\*[^*]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
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
    } else if (value.startsWith('[[')) {
      const inner = value.slice(2, -2);
      const [target, alias] = inner.split('|').map((part) => part.trim());
      parts.push(<span className="markdown-wikilink" title={target} key={parts.length}>{alias || target}</span>);
    } else if (value.includes('#') && /#[\u3400-\u9fffA-Za-z0-9_-]+$/.test(value)) {
      const tagIndex = value.lastIndexOf('#');
      const prefix = value.slice(0, tagIndex);
      const tag = value.slice(tagIndex);
      if (prefix) parts.push(prefix);
      parts.push(<span className="markdown-hashtag" key={parts.length}>{tag}</span>);
    } else if (value.startsWith('==')) {
      parts.push(<mark key={parts.length}>{value.slice(2, -2)}</mark>);
    } else if (value.startsWith('~~')) {
      parts.push(<del key={parts.length}>{value.slice(2, -2)}</del>);
    } else if (value.startsWith('**')) {
      parts.push(<strong key={parts.length}>{value.slice(2, -2)}</strong>);
    } else if (value.startsWith('__')) {
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

function formatCommentTime(value) {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
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

function normalizeDailyPlans(plan) {
  const source = Array.isArray(plan?.dailyPlans) && plan.dailyPlans.length
    ? plan.dailyPlans
    : personalizedDailyPlans;

  return source.map((day, dayIndex) => {
    const fallback = personalizedDailyPlans[dayIndex] || personalizedDailyPlans[0];
    const date = day?.date || fallback.date || day?.id || `day-${dayIndex + 1}`;
    const rawSlots = Array.isArray(day?.slots) && day.slots.length ? day.slots : fallback.slots;
    const slots = normalizeDailyRows(rawSlots).map((slot, slotIndex) => ({
      ...(fallback.slots?.[slotIndex] || {}),
      ...slot,
      id: slot.id || fallback.slots?.[slotIndex]?.id || `${date}-slot-${slotIndex + 1}`
    }));

    return {
      ...fallback,
      ...(day || {}),
      id: day?.id || date,
      date,
      label: day?.label || fallback.label || date,
      theme: day?.theme || fallback.theme || '',
      slots
    };
  });
}

function normalizeAppRows(rows, fallbackRows = personalizedSummerPlan.apps, dayDate = '') {
  const source = Array.isArray(rows) && rows.length ? rows : fallbackRows;
  return source.map((row, index) => {
    const fallback = fallbackRows[index] || personalizedSummerPlan.apps[index] || personalizedSummerPlan.apps[0];
    const stableName = row?.name || fallback.name || `应用 ${index + 1}`;
    return {
      id: row?.id || (dayDate ? `${dayDate}-app-${index + 1}` : `app-${index + 1}`),
      name: stableName,
      limit: row?.limit ?? fallback.limit ?? '',
      actual: row?.actual ?? ''
    };
  });
}

function normalizeAppUsageDays(plan) {
  if (Array.isArray(plan?.appUsageDays) && plan.appUsageDays.length) {
    return plan.appUsageDays.map((day, index) => {
      const fallback = personalizedAppUsageDays[index] || personalizedAppUsageDays[0];
      const date = day?.date || fallback.date || day?.id || `app-day-${index + 1}`;
      return {
        ...fallback,
        ...(day || {}),
        id: day?.id || date,
        date,
        label: day?.label || fallback.label || date,
        theme: day?.theme || fallback.theme || '',
        apps: normalizeAppRows(day?.apps, fallback.apps, date)
      };
    });
  }

  return personalizedAppUsageDays.map((day, index) => ({
    ...day,
    apps: normalizeAppRows(index === 0 ? plan?.apps : null, day.apps, day.date)
  }));
}

function normalizeCompletionTasks(tasks, fallbackTasks = personalizedCompletionDays[0].tasks, dayDate = '') {
  const source = Array.isArray(tasks) && tasks.length ? tasks : fallbackTasks;
  return source.map((task, index) => {
    const fallback = fallbackTasks[index] || personalizedCompletionDays[0].tasks[index] || {};
    const status = completionStatusOptions.includes(task?.status) ? task.status : '未开始';
    return {
      id: task?.id || (dayDate ? `${dayDate}-done-${index + 1}` : `done-${index + 1}`),
      time: task?.time ?? fallback.time ?? '',
      planned: task?.planned ?? task?.activity ?? fallback.planned ?? '',
      actual: task?.actual ?? '',
      status,
      note: task?.note ?? ''
    };
  });
}

function normalizeCompletionDays(plan) {
  if (Array.isArray(plan?.completionDays) && plan.completionDays.length) {
    return plan.completionDays.map((day, index) => {
      const fallback = personalizedCompletionDays[index] || personalizedCompletionDays[0];
      const date = day?.date || fallback.date || day?.id || `completion-day-${index + 1}`;
      return {
        ...fallback,
        ...(day || {}),
        id: day?.id || date,
        date,
        label: day?.label || fallback.label || date,
        theme: day?.theme || fallback.theme || '',
        tasks: normalizeCompletionTasks(day?.tasks, fallback.tasks, date)
      };
    });
  }

  return personalizedCompletionDays.map((day) => ({
    ...day,
    tasks: normalizeCompletionTasks(null, day.tasks, day.date)
  }));
}

function completionStatusScore(status) {
  if (status === '完成') return 1;
  if (status === '部分完成') return 0.5;
  return 0;
}

function calculateCompletionRate(tasks = []) {
  const countedTasks = tasks.filter((task) => task.status !== '不计入');
  if (!countedTasks.length) return 0;
  const score = countedTasks.reduce((sum, task) => sum + completionStatusScore(task.status), 0);
  return Math.round((score / countedTasks.length) * 100);
}

function getCompletionRowsForDay(completionDay, dailyPlans) {
  const dayPlan = dailyPlans.find((day) => day.date === completionDay.date) || dailyPlans[0];
  const storedTasks = Array.isArray(completionDay.tasks) ? completionDay.tasks : [];
  return (dayPlan.slots || []).map((slot, index) => {
    const id = `${completionDay.date}-done-${slot.id}`;
    const stored = storedTasks.find((task) => task.id === id || task.planSlotId === slot.id)
      || storedTasks.find((task) => task.time === slot.time)
      || storedTasks[index]
      || {};
    const status = completionStatusOptions.includes(stored.status) ? stored.status : '未开始';
    return {
      id,
      planSlotId: slot.id,
      time: slot.time,
      planned: slot.activity,
      actual: stored.actual || '',
      status,
      note: stored.note || ''
    };
  });
}

function getSevenDayCompletion(completionDays, selectedDate, dailyPlans) {
  const selectedIndex = Math.max(0, completionDays.findIndex((day) => day.date === selectedDate));
  const endIndex = Math.min(completionDays.length, Math.max(7, selectedIndex + 1));
  const startIndex = Math.max(0, endIndex - 7);
  return completionDays.slice(startIndex, endIndex).map((day) => ({
    label: day.label,
    actual: calculateCompletionRate(getCompletionRowsForDay(day, dailyPlans)),
    limit: 100
  }));
}

function normalizeBodyRows(rows) {
  const source = Array.isArray(rows) && rows.length ? rows : personalizedSummerPlan.bodyMetrics;
  return source.map(({ waist, ...row }, index) => ({
    id: row.id || `body-${index + 1}`,
    date: row.date || '8月4日',
    weight: row.weight || '',
    exercise: row.exercise || '',
    mood: row.mood || ''
  }));
}

function normalizeSleepRows(rows) {
  const source = Array.isArray(rows) && rows.length ? rows : personalizedSummerPlan.sleep;
  return source.map((row, index) => ({
    ...row,
    id: row.id || `sleep-${index + 1}`,
    date: normalizeSleepDateRange(row.date || '8月4-5日')
  }));
}

function normalizeSleepDateRange(date) {
  const value = String(date || '').trim();
  if (!value) return '8月4-5日';
  if (value.includes('-')) return value;
  const match = value.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (!match) return value;
  const month = Number(match[1]);
  const day = Number(match[2]);
  return `${month}月${day}-${day + 1}日`;
}

function getSevenDayAppUsage(appUsageDays, selectedDate) {
  const selectedIndex = Math.max(0, appUsageDays.findIndex((day) => day.date === selectedDate));
  const endIndex = Math.min(appUsageDays.length, Math.max(7, selectedIndex + 1));
  const startIndex = Math.max(0, endIndex - 7);
  return appUsageDays.slice(startIndex, endIndex).map((day) => {
    const actual = day.apps.reduce((sum, app) => sum + parseMinutes(app.actual), 0);
    const limit = day.apps.reduce((sum, app) => sum + parseMinutes(app.limit), 0);
    return { label: day.label, actual, limit };
  });
}

function parseMetricNumber(value) {
  const match = String(value || '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatPlanChartLabel(label) {
  return String(label || '')
    .replace('8月', '8/')
    .replace('日', '')
    .replace('月', '/')
    .replace('日', '');
}

function getRecentRows(rows, limit = 7) {
  const source = Array.isArray(rows) ? rows : [];
  return source.slice(Math.max(0, source.length - limit));
}

function getBodyMetricChartData(rows) {
  return getRecentRows(rows).map((row) => {
    const filledCount = ['weight', 'exercise', 'mood'].filter((field) => String(row[field] || '').trim()).length;
    return {
      label: row.date || '未填日期',
      actual: parseMetricNumber(row.weight),
      barValue: filledCount,
      limit: 3
    };
  });
}

function getSleepMetricChartData(rows) {
  return getRecentRows(rows).map((row) => ({
    label: row.date || '未填日期',
    actual: parseMetricNumber(row.hours),
    barValue: parseMetricNumber(row.hours),
    limit: 8
  }));
}

function normalizeSummerPlan(plan) {
  const dailyPlans = normalizeDailyPlans(plan);
  const appUsageDays = normalizeAppUsageDays(plan);
  const completionDays = normalizeCompletionDays(plan);

  return {
    ...personalizedSummerPlan,
    ...(plan || {}),
    profile: { ...personalizedSummerPlan.profile, ...(plan?.profile || {}) },
    goals: { ...personalizedSummerPlan.goals, ...(plan?.goals || {}) },
    daily: dailyPlans[0]?.slots || normalizeDailyRows(plan?.daily),
    dailyPlans,
    appUsageDays,
    completionDays,
    courses: Array.isArray(plan?.courses) && plan.courses.length ? plan.courses : personalizedSummerPlan.courses,
    apps: appUsageDays[0]?.apps || normalizeAppRows(plan?.apps),
    expenses: Array.isArray(plan?.expenses) && plan.expenses.length ? plan.expenses : personalizedSummerPlan.expenses,
    meals: Array.isArray(plan?.meals) && plan.meals.length ? plan.meals : personalizedSummerPlan.meals,
    bodyMetrics: normalizeBodyRows(plan?.bodyMetrics),
    sleep: normalizeSleepRows(plan?.sleep)
  };
}

const summerPlanSections = [
  { id: 'schedule', label: '时间安排', detail: '每天做什么' },
  { id: 'completion', label: '完成度', detail: '做了什么' },
  { id: 'courses', label: '课程', detail: '预习进度' },
  { id: 'apps', label: '应用', detail: '手机时间' },
  { id: 'finance', label: '记账', detail: '支出记录' },
  { id: 'meals', label: '饮食', detail: '吃了什么' },
  { id: 'body', label: '身体', detail: '体重状态' },
  { id: 'sleep', label: '睡眠', detail: '作息记录' }
];

function SummerPlanWorkspace({ currentUser, authToken, planSection, setPlanSection }) {
  const canEdit = currentUser?.role === 'admin';
  const [plan, setPlan] = useState(() => normalizeSummerPlan(personalizedSummerPlan));
  const [selectedPlanDate, setSelectedPlanDate] = useState(personalizedDailyPlans[0].date);
  const [selectedAppDate, setSelectedAppDate] = useState(personalizedAppUsageDays[0].date);
  const [selectedCompletionDate, setSelectedCompletionDate] = useState(personalizedCompletionDays[0].date);
  const [saveMessage, setSaveMessage] = useState('正在读取数据库');
  const [hasLoadedPlan, setHasLoadedPlan] = useState(false);
  const dayPlans = Array.isArray(plan.dailyPlans) && plan.dailyPlans.length ? plan.dailyPlans : personalizedDailyPlans;
  const selectedDayPlan = dayPlans.find((day) => day.date === selectedPlanDate) || dayPlans[0];
  const appUsageDays = Array.isArray(plan.appUsageDays) && plan.appUsageDays.length ? plan.appUsageDays : personalizedAppUsageDays;
  const selectedAppUsageDay = appUsageDays.find((day) => day.date === selectedAppDate) || appUsageDays[0];
  const appChartData = getSevenDayAppUsage(appUsageDays, selectedAppUsageDay.date);
  const completionDays = Array.isArray(plan.completionDays) && plan.completionDays.length ? plan.completionDays : personalizedCompletionDays;
  const selectedCompletionDay = completionDays.find((day) => day.date === selectedCompletionDate) || completionDays[0];
  const selectedCompletionRows = getCompletionRowsForDay(selectedCompletionDay, dayPlans);
  const completionRate = calculateCompletionRate(selectedCompletionRows);
  const completionChartData = getSevenDayCompletion(completionDays, selectedCompletionDay.date, dayPlans);
  const bodyMetricChartData = getBodyMetricChartData(plan.bodyMetrics);
  const sleepMetricChartData = getSleepMetricChartData(plan.sleep);

  useEffect(() => {
    let cancelled = false;
    async function loadPlan() {
      try {
        const response = await fetch('/api/summer-plan', {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
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
  }, [authToken, canEdit]);

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

  useEffect(() => {
    if (!dayPlans.some((day) => day.date === selectedPlanDate)) {
      setSelectedPlanDate(dayPlans[0]?.date || personalizedDailyPlans[0].date);
    }
  }, [dayPlans, selectedPlanDate]);

  useEffect(() => {
    if (!appUsageDays.some((day) => day.date === selectedAppDate)) {
      setSelectedAppDate(appUsageDays[0]?.date || personalizedAppUsageDays[0].date);
    }
  }, [appUsageDays, selectedAppDate]);

  useEffect(() => {
    if (!completionDays.some((day) => day.date === selectedCompletionDate)) {
      setSelectedCompletionDate(completionDays[0]?.date || personalizedCompletionDays[0].date);
    }
  }, [completionDays, selectedCompletionDate]);

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

  function updateDailySlot(dayDate, rowId, field, value) {
    if (!canEdit) return;
    setPlan((current) => {
      const dailyPlans = (current.dailyPlans || personalizedDailyPlans).map((day) => (
        day.date === dayDate
          ? { ...day, slots: day.slots.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)) }
          : day
      ));
      return { ...current, dailyPlans, daily: dailyPlans[0]?.slots || current.daily };
    });
  }

  function addDailySlot(dayDate, row) {
    if (!canEdit) return;
    setPlan((current) => {
      const dailyPlans = (current.dailyPlans || personalizedDailyPlans).map((day) => (
        day.date === dayDate
          ? { ...day, slots: [...(day.slots || []), { ...row, id: `${dayDate}-slot-${Date.now()}` }] }
          : day
      ));
      return { ...current, dailyPlans, daily: dailyPlans[0]?.slots || current.daily };
    });
  }

  function deleteDailySlot(dayDate, rowId) {
    if (!canEdit) return;
    setPlan((current) => {
      const dailyPlans = (current.dailyPlans || personalizedDailyPlans).map((day) => (
        day.date === dayDate
          ? { ...day, slots: (day.slots || []).filter((row) => row.id !== rowId) }
          : day
      ));
      return { ...current, dailyPlans, daily: dailyPlans[0]?.slots || current.daily };
    });
  }

  function updateAppUsage(dayDate, rowId, field, value) {
    if (!canEdit) return;
    setPlan((current) => {
      const appUsageDays = (current.appUsageDays || personalizedAppUsageDays).map((day) => (
        day.date === dayDate
          ? { ...day, apps: day.apps.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)) }
          : day
      ));
      return { ...current, appUsageDays, apps: appUsageDays[0]?.apps || current.apps };
    });
  }

  function addAppUsage(dayDate, row) {
    if (!canEdit) return;
    setPlan((current) => {
      const appUsageDays = (current.appUsageDays || personalizedAppUsageDays).map((day) => (
        day.date === dayDate
          ? { ...day, apps: [...(day.apps || []), { ...row, id: `${dayDate}-app-${Date.now()}` }] }
          : day
      ));
      return { ...current, appUsageDays, apps: appUsageDays[0]?.apps || current.apps };
    });
  }

  function deleteAppUsage(dayDate, rowId) {
    if (!canEdit) return;
    setPlan((current) => {
      const appUsageDays = (current.appUsageDays || personalizedAppUsageDays).map((day) => (
        day.date === dayDate
          ? { ...day, apps: (day.apps || []).filter((row) => row.id !== rowId) }
          : day
      ));
      return { ...current, appUsageDays, apps: appUsageDays[0]?.apps || current.apps };
    });
  }

  function updateCompletionTask(dayDate, rowId, field, value) {
    if (!canEdit) return;
    if (field === 'time' || field === 'planned') return;
    setPlan((current) => ({
      ...current,
      completionDays: (current.completionDays || personalizedCompletionDays).map((day) => (
        day.date === dayDate
          ? {
              ...day,
              tasks: (day.tasks || []).some((row) => row.id === rowId)
                ? (day.tasks || []).map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
                : [...(day.tasks || []), { id: rowId, actual: '', status: '未开始', note: '', [field]: value }]
            }
          : day
      ))
    }));
  }

  function resetPlan() {
    if (!canEdit) return;
    setPlan(normalizeSummerPlan(personalizedSummerPlan));
    setSelectedPlanDate(personalizedDailyPlans[0].date);
    setSelectedAppDate(personalizedAppUsageDays[0].date);
    setSelectedCompletionDate(personalizedCompletionDays[0].date);
    setSaveMessage('已恢复副将凡版模板');
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
      ...dayPlans.flatMap((day) => [
        `### ${day.label} · ${day.theme}`,
        '| 时间段 | 要做什么 | 重点/说明 | 类型 |',
        '|---|---|---|---|',
        ...(day.slots || []).map((row) => `| ${row.time || ' '} | ${row.activity || ' '} | ${row.focus || ' '} | ${row.type || ' '} |`),
        ''
      ])
    ].join('\n');

    try {
      await navigator.clipboard.writeText(markdown);
      setSaveMessage('已复制 Markdown');
    } catch {
      setSaveMessage('复制失败，可以手动选中内容');
    }
  }

  const totalAppLimit = (selectedAppUsageDay.apps || []).reduce((sum, item) => sum + parseMinutes(item.limit), 0);
  const totalAppActual = (selectedAppUsageDay.apps || []).reduce((sum, item) => sum + parseMinutes(item.actual), 0);
  const totalExpense = plan.expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const activePlanSection = PLAN_SECTION_PATHS[planSection] ? planSection : 'schedule';

  function navigatePlanSection(section) {
    const nextSection = PLAN_SECTION_PATHS[section] ? section : 'schedule';
    setPlanSection(nextSection);
    writeBrowserRoute(getPlanPath(nextSection));
  }

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

      <nav className="plan-section-tabs" aria-label="计划模块">
        {summerPlanSections.map((section) => (
          <button
            className={activePlanSection === section.id ? 'active' : ''}
            key={section.id}
            type="button"
            onClick={() => navigatePlanSection(section.id)}
          >
            <strong>{section.label}</strong>
            <span>{section.detail}</span>
          </button>
        ))}
      </nav>

      {activePlanSection === 'schedule' && (
      <section className="content-band summer-plan-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>每日时间段安排</h2>
            <p>先选择日期，再按时间段看当天该做什么；每一天都可以单独修改。</p>
          </div>
          <button className="primary-action" type="button" onClick={() => addDailySlot(selectedDayPlan.date, { time: '新增时间段', activity: '临时活动', focus: '', type: '弹性' })} disabled={!canEdit}>
            <PlusCircle size={17} />
            <span>新增时间段</span>
          </button>
        </div>
        <PlanCalendarSelector days={dayPlans} value={selectedDayPlan.date} onChange={setSelectedPlanDate} label="选择日期" />
        <EditableTable
          columns={[
            ['time', '时间段', 'input'],
            ['activity', '要做什么', 'input'],
            ['focus', '重点 / 说明', 'textarea'],
            ['type', '类型', 'input']
          ]}
          disabled={!canEdit}
          rows={selectedDayPlan.slots || []}
          section={selectedDayPlan.date}
          updateRow={updateDailySlot}
          deleteRow={deleteDailySlot}
        />
      </section>
      )}

      {activePlanSection === 'completion' && (
        <PlanModule title="完成记录与完成度" count={`今日完成度 ${completionRate}%`} wide>
          <div className="module-toolbar">
            <PlanCalendarSelector days={completionDays} value={selectedCompletionDay.date} onChange={setSelectedCompletionDate} label="完成日期" />
          </div>
          <div className="completion-summary-grid">
            <div>
              <span>今日完成度</span>
              <strong>{completionRate}%</strong>
            </div>
            <div>
              <span>完成 / 部分 / 未完成</span>
              <strong>{summarizeCompletion(selectedCompletionRows)}</strong>
            </div>
          </div>
          <div className="usage-chart-grid">
            <CompletionLineChart data={completionChartData} />
            <CompletionBarChart data={completionChartData} />
          </div>
          <CompletionTable
            disabled={!canEdit}
            rows={selectedCompletionRows}
            section={selectedCompletionDay.date}
            updateRow={updateCompletionTask}
          />
        </PlanModule>
      )}

      {activePlanSection === 'courses' && (
      <>
        <div className="summer-goal-grid">
          <PlanTextarea title="学习主线" value={plan.goals.study} disabled={!canEdit} onChange={(value) => updateNested('goals', 'study', value)} />
          <PlanTextarea title="运动与身体" value={plan.goals.body} disabled={!canEdit} onChange={(value) => updateNested('goals', 'body', value)} />
          <PlanTextarea title="娱乐边界" value={plan.goals.life} disabled={!canEdit} onChange={(value) => updateNested('goals', 'life', value)} />
        </div>
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
      </>
      )}

      {activePlanSection === 'apps' && (
        <PlanModule title="手机应用使用时间" count={`今日 ${totalAppActual || 0} / 目标 ${totalAppLimit || 0} 分钟`} wide>
          <div className="module-toolbar">
            <PlanCalendarSelector days={appUsageDays} value={selectedAppUsageDay.date} onChange={setSelectedAppDate} label="记录日期" />
            <button className="ghost-button module-add-button" type="button" onClick={() => addAppUsage(selectedAppUsageDay.date, { name: '新增应用', limit: '', actual: '' })} disabled={!canEdit}>
              <PlusCircle size={16} />
              <span>新增应用</span>
            </button>
          </div>
          <div className="usage-chart-grid">
            <UsageLineChart data={appChartData} />
            <UsageBarChart data={appChartData} />
          </div>
          <EditableTable
            columns={[
              ['name', '应用', 'input'],
              ['limit', '每日上限', 'input'],
              ['actual', '实际使用', 'input']
            ]}
            disabled={!canEdit}
            rows={selectedAppUsageDay.apps || []}
            section={selectedAppUsageDay.date}
            updateRow={updateAppUsage}
            deleteRow={deleteAppUsage}
          />
        </PlanModule>
      )}

      {activePlanSection === 'finance' && (
        <PlanModule title="记账" count={`合计 ${totalExpense.toFixed(1)} 元`} wide>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('expenses', { date: '8月4日', item: '', amount: '', note: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增支出</span>
          </button>
          <EditableTable
            columns={[
              ['date', '日期', 'input'],
              ['item', '项目', 'input'],
              ['amount', '金额', 'input'],
              ['note', '备注', 'textarea']
            ]}
            disabled={!canEdit}
            rows={plan.expenses}
            section="expenses"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>
      )}

      {activePlanSection === 'meals' && (
        <PlanModule title="饮食记录" count={`${plan.meals.length} 天`} wide>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('meals', { date: '8月4日', breakfast: '', lunch: '', dinner: '', snack: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增饮食</span>
          </button>
          <EditableTable
            columns={[
              ['date', '日期', 'input'],
              ['breakfast', '早饭', 'textarea'],
              ['lunch', '午饭', 'textarea'],
              ['dinner', '晚饭', 'textarea'],
              ['snack', '加餐', 'textarea']
            ]}
            disabled={!canEdit}
            rows={plan.meals}
            section="meals"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>
      )}

      {activePlanSection === 'body' && (
        <PlanModule title="体重与状态" count={`${plan.bodyMetrics.length} 条`} wide>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('bodyMetrics', { date: '8月4日', weight: '', exercise: '', mood: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增记录</span>
          </button>
          <div className="usage-chart-grid">
            <MetricLineChart data={bodyMetricChartData} title="体重折线图" subtitle="最近 7 条记录" unit="kg" fallbackMax={100} />
            <MetricBarChart data={bodyMetricChartData} title="记录完整度柱状图" subtitle="体重 / 运动 / 状态" unit="项" valueKey="barValue" fallbackMax={3} />
          </div>
          <EditableTable
            columns={[
              ['date', '日期', 'input'],
              ['weight', '体重', 'input'],
              ['exercise', '运动完成', 'textarea'],
              ['mood', '状态', 'textarea']
            ]}
            disabled={!canEdit}
            rows={plan.bodyMetrics}
            section="bodyMetrics"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>
      )}

      {activePlanSection === 'sleep' && (
        <PlanModule title="睡眠记录" count={`${plan.sleep.length} 条`} wide>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('sleep', { date: '8月4-5日', bed: '', wake: '', hours: '', quality: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增睡眠</span>
          </button>
          <div className="usage-chart-grid">
            <MetricLineChart data={sleepMetricChartData} title="睡眠时长折线图" subtitle="最近 7 条记录" unit="h" fallbackMax={10} />
            <MetricBarChart data={sleepMetricChartData} title="睡眠时长柱状图" subtitle="目标参考 8h" unit="h" valueKey="barValue" fallbackMax={10} />
          </div>
          <EditableTable
            columns={[
              ['date', '日期范围', 'input'],
              ['bed', '入睡', 'input'],
              ['wake', '起床', 'input'],
              ['hours', '时长', 'input'],
              ['quality', '质量', 'textarea']
            ]}
            disabled={!canEdit}
            rows={plan.sleep}
            section="sleep"
            updateRow={updateRow}
            deleteRow={deleteRow}
          />
        </PlanModule>
      )}
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

function PlanModule({ title, count, children, wide = false }) {
  return (
    <section className={`content-band summer-plan-panel${wide ? ' wide' : ''}`}>
      <div className="admin-panel-heading">
        <h2>{title}</h2>
        <span>{count}</span>
      </div>
      {children}
    </section>
  );
}

const planCalendarWeekdays = ['一', '二', '三', '四', '五', '六', '日'];

function parsePlanDate(dateValue) {
  const [year, month, day] = String(dateValue || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatPlanDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPlanMonth(dateValue) {
  const date = parsePlanDate(dateValue);
  if (!date) return new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function PlanCalendarSelector({ days, value, onChange, label = '选择日期' }) {
  const pickerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getPlanMonth(value || days[0]?.date));
  const selectedDay = days.find((day) => day.date === value) || days[0];
  const availableDates = days.map((day) => day.date).filter(Boolean).sort();
  const minDate = availableDates[0] || '';
  const maxDate = availableDates[availableDates.length - 1] || '';
  const dayByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const minMonth = getPlanMonth(minDate);
  const maxMonth = getPlanMonth(maxDate);
  const canMovePrev = visibleMonth > minMonth;
  const canMoveNext = visibleMonth < maxMonth;

  useEffect(() => {
    setVisibleMonth(getPlanMonth(selectedDay?.date));
  }, [selectedDay?.date]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: leadingBlanks }, (_, index) => ({ id: `blank-${index}`, blank: true }));
    const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const dateValue = formatPlanDate(date);
      const planDay = dayByDate.get(dateValue);
      return {
        id: dateValue,
        date: dateValue,
        dayNumber: index + 1,
        planDay,
        selected: dateValue === selectedDay?.date
      };
    });
    return [...blanks, ...monthDays];
  }, [dayByDate, selectedDay?.date, visibleMonth]);

  function moveMonth(offset) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(day) {
    if (!day.planDay) return;
    onChange(day.date);
    setIsOpen(false);
  }

  function getDateRangeText() {
    const minPlanDate = parsePlanDate(minDate);
    const maxPlanDate = parsePlanDate(maxDate);
    if (!minPlanDate || !maxPlanDate) return '';
    const minLabel = `${minPlanDate.getMonth() + 1}月${minPlanDate.getDate()}日`;
    const maxLabel = `${maxPlanDate.getMonth() + 1}月${maxPlanDate.getDate()}日`;
    return `${minLabel} - ${maxLabel}`;
  }

  function getMonthTitle() {
    return `${visibleMonth.getFullYear()}年${String(visibleMonth.getMonth() + 1).padStart(2, '0')}月`;
  }

  return (
    <div className="compact-plan-date-picker" ref={pickerRef}>
      <button
        className={`plan-date-field${isOpen ? ' active' : ''}`}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="plan-date-icon">
          <CalendarDays size={17} />
        </span>
        <span>
          <small>{label}</small>
          <strong>{selectedDay?.label || '未选择日期'}</strong>
        </span>
      </button>
      <span className="plan-date-current-theme">{selectedDay?.theme}</span>

      {isOpen && (
        <div className="plan-calendar-popover" role="dialog" aria-label={label}>
          <div className="plan-calendar-head">
            <button type="button" onClick={() => moveMonth(-1)} disabled={!canMovePrev} aria-label="上个月">
              <ChevronLeft size={17} />
            </button>
            <strong>{getMonthTitle()}</strong>
            <button type="button" onClick={() => moveMonth(1)} disabled={!canMoveNext} aria-label="下个月">
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="plan-calendar-weekdays">
            {planCalendarWeekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="plan-calendar-days">
            {calendarCells.map((day) => (
              day.blank ? (
                <span className="plan-calendar-day blank" key={day.id} aria-hidden="true" />
              ) : (
                <button
                  className={`plan-calendar-day${day.selected ? ' selected' : ''}${day.planDay ? '' : ' disabled'}`}
                  key={day.id}
                  type="button"
                  onClick={() => selectDate(day)}
                  disabled={!day.planDay}
                  aria-label={day.planDay ? `选择${day.planDay.label}` : `${day.dayNumber}日不在计划范围内`}
                >
                  <span>{day.dayNumber}</span>
                  {day.planDay && <small>{day.planDay.theme}</small>}
                </button>
              )
            ))}
          </div>
          <div className="plan-calendar-foot">
            <span>可选范围 {getDateRangeText()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function summarizeCompletion(tasks = []) {
  const done = tasks.filter((task) => task.status === '完成').length;
  const partial = tasks.filter((task) => task.status === '部分完成').length;
  const missed = tasks.filter((task) => task.status === '未完成').length;
  return `${done} / ${partial} / ${missed}`;
}

function UsageLineChart({ data }) {
  const width = 560;
  const height = 220;
  const padding = 34;
  const maxValue = Math.max(120, ...data.flatMap((item) => [item.actual, item.limit]));
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - (item.actual / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="usage-chart-card">
      <div className="usage-chart-heading">
        <h3>7 日折线图</h3>
        <span>实际使用总时长</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="七日手机应用使用折线图">
        <line className="chart-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        <line className="chart-axis" x1={padding} y1={padding} x2={padding} y2={height - padding} />
        <path className="chart-line" d={path} />
        {points.map((point) => (
          <g key={point.label}>
            <circle className="chart-point" cx={point.x} cy={point.y} r="4" />
            <text className="chart-label" x={point.x} y={height - 10} textAnchor="middle">{point.label.replace('8月', '8/').replace('日', '')}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function UsageBarChart({ data }) {
  const width = 560;
  const height = 220;
  const padding = 34;
  const maxValue = Math.max(120, ...data.flatMap((item) => [item.actual, item.limit]));
  const barWidth = (width - padding * 2) / Math.max(1, data.length) * 0.52;

  return (
    <div className="usage-chart-card">
      <div className="usage-chart-heading">
        <h3>7 日柱状图</h3>
        <span>实际 / 目标</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="七日手机应用使用柱状图">
        <line className="chart-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        {data.map((item, index) => {
          const groupWidth = (width - padding * 2) / Math.max(1, data.length);
          const x = padding + index * groupWidth + (groupWidth - barWidth) / 2;
          const actualHeight = (item.actual / maxValue) * (height - padding * 2);
          const limitHeight = (item.limit / maxValue) * (height - padding * 2);
          return (
            <g key={item.label}>
              <rect className="chart-bar-limit" x={x} y={height - padding - limitHeight} width={barWidth} height={limitHeight} rx="5" />
              <rect className="chart-bar-actual" x={x} y={height - padding - actualHeight} width={barWidth} height={actualHeight} rx="5" />
              <text className="chart-label" x={x + barWidth / 2} y={height - 10} textAnchor="middle">{item.label.replace('8月', '8/').replace('日', '')}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CompletionLineChart({ data }) {
  const width = 560;
  const height = 220;
  const padding = 34;
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - (item.actual / 100) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="usage-chart-card">
      <div className="usage-chart-heading">
        <h3>完成度折线图</h3>
        <span>最近 7 日</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="七日任务完成度折线图">
        <line className="chart-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        <line className="chart-axis" x1={padding} y1={padding} x2={padding} y2={height - padding} />
        <path className="chart-line completion-line" d={path} />
        {points.map((point) => (
          <g key={point.label}>
            <circle className="chart-point completion-point" cx={point.x} cy={point.y} r="4" />
            <text className="chart-label" x={point.x} y={height - 10} textAnchor="middle">{point.label.replace('8月', '8/').replace('日', '')}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CompletionBarChart({ data }) {
  const width = 560;
  const height = 220;
  const padding = 34;
  const barWidth = (width - padding * 2) / Math.max(1, data.length) * 0.52;

  return (
    <div className="usage-chart-card">
      <div className="usage-chart-heading">
        <h3>完成度柱状图</h3>
        <span>百分比</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="七日任务完成度柱状图">
        <line className="chart-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        {data.map((item, index) => {
          const groupWidth = (width - padding * 2) / Math.max(1, data.length);
          const x = padding + index * groupWidth + (groupWidth - barWidth) / 2;
          const barHeight = (item.actual / 100) * (height - padding * 2);
          return (
            <g key={item.label}>
              <rect className="chart-bar-limit" x={x} y={padding} width={barWidth} height={height - padding * 2} rx="5" />
              <rect className="chart-bar-actual completion-bar" x={x} y={height - padding - barHeight} width={barWidth} height={barHeight} rx="5" />
              <text className="chart-label" x={x + barWidth / 2} y={height - 10} textAnchor="middle">{item.label.replace('8月', '8/').replace('日', '')}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MetricLineChart({ data, title, subtitle, unit = '', fallbackMax = 10 }) {
  const width = 560;
  const height = 220;
  const padding = 34;
  const maxValue = Math.max(fallbackMax, ...data.map((item) => item.actual || 0));
  const minPositive = data.some((item) => item.actual > 0) ? Math.min(...data.filter((item) => item.actual > 0).map((item) => item.actual)) : 0;
  const minValue = minPositive > 20 ? Math.floor(minPositive - 2) : 0;
  const range = Math.max(1, maxValue - minValue);
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - ((Math.max(item.actual || 0, minValue) - minValue) / range) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="usage-chart-card">
      <div className="usage-chart-heading">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <line className="chart-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        <line className="chart-axis" x1={padding} y1={padding} x2={padding} y2={height - padding} />
        <path className="chart-line metric-line" d={path} />
        {points.map((point) => (
          <g key={point.label}>
            <circle className="chart-point metric-point" cx={point.x} cy={point.y} r="4" />
            <text className="chart-value-label" x={point.x} y={Math.max(18, point.y - 10)} textAnchor="middle">{point.actual ? `${point.actual}${unit}` : '0'}</text>
            <text className="chart-label" x={point.x} y={height - 10} textAnchor="middle">{formatPlanChartLabel(point.label)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MetricBarChart({ data, title, subtitle, unit = '', valueKey = 'actual', fallbackMax = 10 }) {
  const width = 560;
  const height = 220;
  const padding = 34;
  const maxValue = Math.max(fallbackMax, ...data.map((item) => item[valueKey] || 0), ...data.map((item) => item.limit || 0));
  const barWidth = (width - padding * 2) / Math.max(1, data.length) * 0.52;

  return (
    <div className="usage-chart-card">
      <div className="usage-chart-heading">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <line className="chart-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        {data.map((item, index) => {
          const groupWidth = (width - padding * 2) / Math.max(1, data.length);
          const x = padding + index * groupWidth + (groupWidth - barWidth) / 2;
          const value = item[valueKey] || 0;
          const barHeight = (value / maxValue) * (height - padding * 2);
          const limitHeight = ((item.limit || 0) / maxValue) * (height - padding * 2);
          return (
            <g key={item.label}>
              {item.limit ? <rect className="chart-bar-limit" x={x} y={height - padding - limitHeight} width={barWidth} height={limitHeight} rx="5" /> : null}
              <rect className="chart-bar-actual metric-bar" x={x} y={height - padding - barHeight} width={barWidth} height={barHeight} rx="5" />
              <text className="chart-value-label" x={x + barWidth / 2} y={Math.max(18, height - padding - barHeight - 8)} textAnchor="middle">{value ? `${value}${unit}` : '0'}</text>
              <text className="chart-label" x={x + barWidth / 2} y={height - 10} textAnchor="middle">{formatPlanChartLabel(item.label)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CompletionTable({ rows, section, disabled, updateRow }) {
  return (
    <div className="summer-table-wrap">
      <table className="summer-plan-table completion-table">
        <thead>
          <tr>
            <th>时间段</th>
            <th>计划做什么</th>
            <th>我实际做了什么</th>
            <th>状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label="时间段"><input className="readonly-plan-cell" value={row.time || ''} readOnly /></td>
              <td data-label="计划做什么"><textarea className="readonly-plan-cell" value={row.planned || ''} readOnly /></td>
              <td data-label="我实际做了什么"><textarea value={row.actual || ''} disabled={disabled} onChange={(event) => updateRow(section, row.id, 'actual', event.target.value)} /></td>
              <td data-label="状态">
                <select value={row.status || '未开始'} disabled={disabled} onChange={(event) => updateRow(section, row.id, 'status', event.target.value)}>
                  {completionStatusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td data-label="备注"><textarea value={row.note || ''} disabled={disabled} onChange={(event) => updateRow(section, row.id, 'note', event.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
              {columns.map(([field, label, type]) => (
                <td data-label={label} key={field}>
                  {type === 'textarea' ? (
                    <textarea value={row[field] || ''} disabled={disabled} onChange={(event) => updateRow(section, row.id, field, event.target.value)} />
                  ) : (
                    <input value={row[field] || ''} disabled={disabled} onChange={(event) => updateRow(section, row.id, field, event.target.value)} />
                  )}
                </td>
              ))}
              <td data-label="操作">
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

function createEmptyToolboxForm() {
  return {
    title: '',
    category: '自定义',
    url: '',
    imageUrl: '',
    description: '',
    tags: '',
    pinned: false
  };
}

function normalizeToolboxLink(link, index = 0) {
  return {
    ...link,
    id: link.id ?? (typeof index === 'string' ? index : `default-${index}`),
    tags: Array.isArray(link.tags) ? link.tags : [],
    imageUrl: link.imageUrl || '',
    custom: Boolean(link.custom)
  };
}

function readToolboxDefaultOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(TOOLBOX_DEFAULT_OVERRIDES_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    localStorage.removeItem(TOOLBOX_DEFAULT_OVERRIDES_KEY);
    return {};
  }
}

const defaultFriendLinks = [
  {
    title: "BruceJin's Notebook",
    description: '课程笔记与个人站点，适合参考内容组织方式。',
    url: 'https://brucejqs.github.io/MyNotebook/',
    avatar: 'BJ',
    tone: 'blue'
  },
  {
    title: "Wcowin's Web",
    description: 'MkDocs 主题与教程，文档结构和站点审美都值得看。',
    url: 'https://wcowin.work/',
    avatar: 'W',
    tone: 'cyan'
  },
  {
    title: 'Chenji Learning Hub',
    description: '同学的全栈学习工作台，和这台服务器一起成长中。',
    url: 'https://chenji.felixfu.xyz/',
    avatar: 'CJ',
    tone: 'green'
  },
  {
    title: 'ZJU CS-All Sum In One',
    description: '浙大 CS 课程资料集合，查课设和复习资料很方便。',
    url: 'https://qsctech.github.io/zju-icicles/',
    avatar: 'CS',
    tone: 'purple'
  },
  {
    title: 'MkDocs Material',
    description: '技术笔记站的经典参考，后面整理课程笔记可以借鉴。',
    url: 'https://squidfunk.github.io/mkdocs-material/',
    avatar: 'MD',
    tone: 'teal'
  },
  {
    title: 'GitHub',
    description: '项目、笔记和小工具的公开仓库入口。',
    url: 'https://github.com/firefelixfu026',
    avatar: 'GH',
    tone: 'gray'
  }
];

function ToolboxWorkspace({ currentUser, authToken, manageOnly = false }) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [toolboxQuery, setToolboxQuery] = useState('');
  const [customLinks, setCustomLinks] = useState([]);
  const [toolboxForm, setToolboxForm] = useState(createEmptyToolboxForm);
  const [editingToolboxLinkId, setEditingToolboxLinkId] = useState(null);
  const [editingToolboxSource, setEditingToolboxSource] = useState(null);
  const [toolboxDefaultOverrides, setToolboxDefaultOverrides] = useState(readToolboxDefaultOverrides);
  const [toolboxMessage, setToolboxMessage] = useState('');
  const [toolboxAdminQuery, setToolboxAdminQuery] = useState('');
  const [isLoadingToolboxLinks, setIsLoadingToolboxLinks] = useState(false);
  const [isSavingToolboxLink, setIsSavingToolboxLink] = useState(false);
  const canManageToolbox = currentUser?.role === 'admin';
  async function persistToolboxDefaultOverrides(nextOverrides) {
    setToolboxDefaultOverrides(nextOverrides);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOOLBOX_DEFAULT_OVERRIDES_KEY, JSON.stringify(nextOverrides));
    }
    if (canManageToolbox && authToken) {
      const response = await fetch('/api/admin/toolbox-overrides', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ payload: nextOverrides })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || '预置链接保存失败');
      }
    }
  }

  function applyToolboxOverride(link) {
    const override = toolboxDefaultOverrides[link.id];
    if (override?.hidden) return null;
    return normalizeToolboxLink({
      ...link,
      ...override,
      tags: Array.isArray(override?.tags) ? override.tags : link.tags
    }, link.id);
  }

  const friendToolboxLinks = defaultFriendLinks.map((link, index) => normalizeToolboxLink({
    title: link.title,
    category: '友链',
    url: link.url,
    imageUrl: link.imageUrl || '',
    description: link.description,
    tags: ['友链', '博客', index === 2 ? '同学' : '参考']
  }, `friend-${index}`)).map((link) => ({ ...link, sourceType: 'friend' }));
  const defaultManagedToolboxLinks = defaultToolboxLinks.map((link, index) => normalizeToolboxLink(link, `default-${index}`))
    .map((link) => ({ ...link, sourceType: 'default' }));
  const allToolboxLinks = [
    ...customLinks.map((link) => ({ ...normalizeToolboxLink(link), custom: true, sourceType: 'custom' })),
    ...friendToolboxLinks.map(applyToolboxOverride).filter(Boolean),
    ...defaultManagedToolboxLinks.map(applyToolboxOverride).filter(Boolean)
  ];
  const dynamicCategories = ['全部', ...Array.from(new Set([
    ...toolboxCategories.filter((category) => category !== '全部'),
    ...allToolboxLinks.map((link) => link.category || '自定义')
  ])).sort((first, second) => first.localeCompare(second, 'zh-CN'))];
  const normalizedQuery = toolboxQuery.trim().toLowerCase();
  const filteredLinks = allToolboxLinks.filter((link) => {
    const matchesCategory = selectedCategory === '全部' || link.category === selectedCategory;
    const haystack = [link.title, link.category, link.description, ...link.tags].join(' ').toLowerCase();
    return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const toolboxSections = (selectedCategory === '全部'
    ? dynamicCategories.filter((category) => category !== '全部')
    : [selectedCategory]
  )
    .map((category) => ({
      category,
      links: filteredLinks.filter((link) => link.category === category)
    }))
    .filter((section) => section.links.length > 0);
  const featuredLinks = allToolboxLinks
    .filter((link) => link.pinned || ['OI Wiki', 'MDN Web Docs', 'ChatGPT', 'Excalidraw'].includes(link.title))
    .slice(0, 6);
  const toolboxAdminLinks = allToolboxLinks.filter((link) => {
    const query = toolboxAdminQuery.trim().toLowerCase();
    const source = link.custom ? '自定义' : link.category === '友链' ? '友链' : '内置';
    const haystack = [link.title, link.category, link.url, link.description, source, ...(link.tags || [])].join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });

  useEffect(() => {
    refreshToolboxLinks();
    refreshToolboxOverrides();
  }, []);

  async function refreshToolboxLinks() {
    setIsLoadingToolboxLinks(true);
    try {
      const response = await fetch('/api/toolbox-links');
      if (!response.ok) return;
      setCustomLinks(await response.json());
    } catch {
      setToolboxMessage('自定义链接暂时加载失败，先显示预置工具。');
    } finally {
      setIsLoadingToolboxLinks(false);
    }
  }

  async function refreshToolboxOverrides() {
    try {
      const response = await fetch('/api/toolbox-overrides');
      if (!response.ok) return;
      const nextOverrides = await response.json();
      if (nextOverrides && typeof nextOverrides === 'object') {
        setToolboxDefaultOverrides(nextOverrides);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(TOOLBOX_DEFAULT_OVERRIDES_KEY, JSON.stringify(nextOverrides));
        }
      }
    } catch {
      // Keep local fallback if the setting endpoint is temporarily unavailable.
    }
  }

  function updateToolboxForm(field, value) {
    setToolboxForm((current) => ({ ...current, [field]: value }));
  }

  function resetToolboxForm(message = '') {
    setToolboxForm(createEmptyToolboxForm());
    setEditingToolboxLinkId(null);
    setEditingToolboxSource(null);
    setToolboxMessage(message);
  }

  function startEditingToolboxLink(link) {
    setEditingToolboxLinkId(link.id);
    setEditingToolboxSource(link.sourceType || (link.custom ? 'custom' : 'default'));
    setToolboxForm({
      title: link.title || '',
      category: link.category || '自定义',
      url: link.url || '',
      imageUrl: link.imageUrl || '',
      description: link.description || '',
      tags: (link.tags || []).join(', '),
      pinned: Boolean(link.pinned)
    });
    setToolboxMessage(`正在编辑：${link.title}`);
  }

  async function submitToolboxLink(event) {
    event.preventDefault();
    if (!canManageToolbox || !authToken) {
      setToolboxMessage('请先登录管理员账号');
      return;
    }
    const payload = {
      title: toolboxForm.title.trim(),
      category: toolboxForm.category.trim() || '自定义',
      url: toolboxForm.url.trim(),
      imageUrl: toolboxForm.imageUrl.trim(),
      description: toolboxForm.description.trim(),
      tags: toolboxForm.tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      pinned: toolboxForm.pinned
    };
    if (!payload.title || !payload.url) {
      setToolboxMessage('标题和网址都要填');
      return;
    }

    setIsSavingToolboxLink(true);
    try {
      if (editingToolboxLinkId && editingToolboxSource !== 'custom') {
        const nextOverrides = {
          ...toolboxDefaultOverrides,
          [editingToolboxLinkId]: {
            ...(toolboxDefaultOverrides[editingToolboxLinkId] || {}),
            ...payload,
            hidden: false
          }
        };
        await persistToolboxDefaultOverrides(nextOverrides);
        resetToolboxForm('预置链接已更新');
        return;
      }
      const endpoint = editingToolboxLinkId
        ? `/api/admin/toolbox-links/${editingToolboxLinkId}`
        : '/api/admin/toolbox-links';
      const response = await fetch(endpoint, {
        method: editingToolboxLinkId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setToolboxMessage(result.detail || '保存失败');
        return;
      }
      await refreshToolboxLinks();
      resetToolboxForm(editingToolboxLinkId ? '链接已更新' : '链接已添加');
    } catch {
      setToolboxMessage('后端服务不可用，保存失败');
    } finally {
      setIsSavingToolboxLink(false);
    }
  }

  async function deleteToolboxLink(link) {
    if (!canManageToolbox || !authToken) return;
    if (!window.confirm(`确定删除工具箱链接：${link.title}？`)) return;
    if (!link.custom) {
      const nextOverrides = {
        ...toolboxDefaultOverrides,
        [link.id]: {
          ...(toolboxDefaultOverrides[link.id] || {}),
          hidden: true
        }
      };
      await persistToolboxDefaultOverrides(nextOverrides);
      if (editingToolboxLinkId === link.id) resetToolboxForm('');
      setToolboxMessage('预置链接已删除');
      return;
    }
    try {
      const response = await fetch(`/api/admin/toolbox-links/${link.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setToolboxMessage(result.detail || '删除失败');
        return;
      }
      await refreshToolboxLinks();
      resetToolboxForm('链接已删除');
    } catch {
      setToolboxMessage('后端服务不可用，删除失败');
    }
  }

  const toolboxEditor = canManageToolbox ? (
    <form className="toolbox-editor" onSubmit={submitToolboxLink}>
      <div className="admin-panel-heading compact-heading">
        <div>
          <h3>{editingToolboxLinkId ? '编辑网址' : '添加网址'}</h3>
          <span>{isLoadingToolboxLinks ? '正在同步链接' : `${allToolboxLinks.length} 个可管理链接`}</span>
        </div>
        {editingToolboxLinkId && (
          <button className="ghost-button" type="button" onClick={() => resetToolboxForm('已取消编辑')}>
            <X size={16} />
            <span>取消</span>
          </button>
        )}
      </div>
      <div className="toolbox-editor-grid">
        <label>
          <span>标题</span>
          <input value={toolboxForm.title} onChange={(event) => updateToolboxForm('title', event.target.value)} placeholder="网站名称" />
        </label>
        <label>
          <span>分类</span>
          <input value={toolboxForm.category} onChange={(event) => updateToolboxForm('category', event.target.value)} placeholder="学习 / 开发 / 友链" />
        </label>
        <label className="wide">
          <span>网址</span>
          <input value={toolboxForm.url} onChange={(event) => updateToolboxForm('url', event.target.value)} placeholder="https://example.com" />
        </label>
        <label className="wide">
          <span>图片链接</span>
          <input value={toolboxForm.imageUrl} onChange={(event) => updateToolboxForm('imageUrl', event.target.value)} placeholder="头像或封面图片 URL，可留空" />
        </label>
        <label className="wide">
          <span>说明</span>
          <textarea value={toolboxForm.description} onChange={(event) => updateToolboxForm('description', event.target.value)} rows={2} placeholder="这个网站适合用来做什么" />
        </label>
        <label className="wide">
          <span>标签</span>
          <input value={toolboxForm.tags} onChange={(event) => updateToolboxForm('tags', event.target.value)} placeholder="用逗号分隔，比如 文档, 课程, 工具" />
        </label>
        <label className="checkbox-control">
          <input type="checkbox" checked={toolboxForm.pinned} onChange={(event) => updateToolboxForm('pinned', event.target.checked)} />
          <span>置顶到高频入口</span>
        </label>
      </div>
      <div className="admin-actions">
        <button className="primary-action" type="submit" disabled={isSavingToolboxLink}>
          <Save size={17} />
          <span>{isSavingToolboxLink ? '保存中' : editingToolboxLinkId ? '保存修改' : '添加网址'}</span>
        </button>
        <button className="ghost-button" type="button" onClick={() => resetToolboxForm('')}>
          <X size={17} />
          <span>清空</span>
        </button>
        <button className="ghost-button" type="button" onClick={refreshToolboxLinks}>
          <RefreshCw size={17} />
          <span>刷新</span>
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={async () => {
            if (!window.confirm('确定恢复内置和友链预设吗？之前对预置链接的编辑和删除会被清空。')) return;
            try {
              await persistToolboxDefaultOverrides({});
              resetToolboxForm('已恢复内置和友链预设');
            } catch (error) {
              setToolboxMessage(error.message || '恢复预置失败');
            }
          }}
        >
          <RefreshCw size={17} />
          <span>恢复预置</span>
        </button>
      </div>
      {toolboxMessage && <p className="admin-message">{toolboxMessage}</p>}
    </form>
  ) : (
    <p className="empty-state">需要管理员登录后才能管理自定义网址。</p>
  );

  if (manageOnly) {
    return (
      <section className="admin-panel toolbox-admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>工具箱网址管理</h2>
            <span>内置、自定义和友链都在这里统一查看。</span>
          </div>
          <button className="ghost-button" type="button" onClick={refreshToolboxLinks}>
            <RefreshCw size={17} />
            <span>刷新</span>
          </button>
        </div>
        {toolboxEditor}
        <div className="admin-filter-bar">
          <input
            value={toolboxAdminQuery}
            onChange={(event) => setToolboxAdminQuery(event.target.value)}
            placeholder="搜索网站、分类、标签或来源"
            aria-label="搜索工具箱管理列表"
          />
        </div>
        <div className="toolbox-admin-list">
          {toolboxAdminLinks.length === 0 ? (
            <p className="empty-state">没有找到对应网址。</p>
          ) : toolboxAdminLinks.map((link) => {
            const source = link.custom ? '自定义' : link.category === '友链' ? '友链' : '内置';
            return (
            <article className="toolbox-admin-row" key={`${source}-${link.id || link.url}`}>
              <div>
                <strong>{link.title}</strong>
                <span>{source} · {link.category || '自定义'} · {link.url}</span>
                {link.imageUrl && <span>图片：{link.imageUrl}</span>}
                {link.description && <p>{link.description}</p>}
              </div>
              <div className="manager-actions">
                <a className="ghost-button" href={link.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  <span>打开</span>
                </a>
                <>
                <button type="button" onClick={() => startEditingToolboxLink(link)}>
                  <PencilLine size={16} />
                  <span>编辑</span>
                </button>
                <button className="danger-button" type="button" onClick={() => deleteToolboxLink(link)}>
                  <Trash2 size={16} />
                  <span>删除</span>
                </button>
                </>
              </div>
            </article>
          );})}
        </div>
      </section>
    );
  }

  return (
    <section className="workspace toolbox-workspace">
      <div className="section-heading">
        <p className="eyebrow">工具箱</p>
        <h1>工具箱</h1>
      </div>

      <div className="content-band toolbox-hero">
        <div>
          <span>Felix Links</span>
          <h2>常用资源入口</h2>
        </div>
        <div className="toolbox-featured-grid" aria-label="高频工具">
          {featuredLinks.map((link) => (
            <a href={link.url} target="_blank" rel="noreferrer" key={link.title}>
              <strong>{link.title}</strong>
              <span>{link.category}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="toolbox-controls">
        <label className="toolbox-search">
          <Search size={18} />
          <input
            value={toolboxQuery}
            onChange={(event) => setToolboxQuery(event.target.value)}
            placeholder="搜索网站、用途或标签"
            aria-label="搜索工具箱网站"
          />
        </label>
        <div className="tag-filter" aria-label="工具箱分类">
          {dynamicCategories.map((category) => (
            <button
              className={selectedCategory === category ? 'tag-button active' : 'tag-button'}
              type="button"
              key={category}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbox-sections">
        {toolboxSections.map((section) => (
          <section className="toolbox-section" key={section.category}>
            <div className="toolbox-section-heading">
              <h2>{section.category}</h2>
              <span>{section.links.length} 个入口</span>
            </div>
            <div className="toolbox-grid">
              {section.links.map((link) => (
                <article className={`toolbox-card${link.category === '友链' ? ' friend-card' : ''}`} key={`${link.custom ? 'custom' : 'default'}-${link.id || link.url}`}>
                  <div className="toolbox-card-topline">
                    <span className="toolbox-card-category">{link.category}</span>
                    <a href={link.url} target="_blank" rel="noreferrer" aria-label={`打开 ${link.title}`}>
                      <ExternalLink size={17} />
                    </a>
                  </div>
                  {link.category === '友链' && (
                    <div className="friend-link-avatar" aria-hidden="true">
                      {link.imageUrl ? <img src={link.imageUrl} alt="" loading="lazy" decoding="async" /> : <span>{(link.title || 'F').slice(0, 2)}</span>}
                    </div>
                  )}
                  <div>
                    <h2>{link.title}</h2>
                  </div>
                  <p>{link.description}</p>
                  <span className="toolbox-url">{new URL(link.url).hostname.replace(/^www\./, '')}</span>
                  <div className="toolbox-tags">
                    {link.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!filteredLinks.length && (
        <div className="empty-state">
          <strong>没有找到对应网站</strong>
          <span>换个关键词，或者先切回全部分类看看。</span>
        </div>
      )}
    </section>
  );
}

const stickerSets = {
  overview: [
    { variant: 'terminal', label: 'SANITY +1', icon: '◇' },
    { variant: 'guitar', label: 'BAND TIME', icon: '♪' },
    { variant: 'memo', label: 'ZJU NOTE', icon: '✦' }
  ],
  articles: [
    { variant: 'memo', label: 'TECH NOTE', icon: '⌁' },
    { variant: 'terminal', label: 'DOCS 02', icon: '◇' },
    { variant: 'guitar', label: 'REST', icon: '♪' }
  ],
  plan: [
    { variant: 'terminal', label: 'MISSION', icon: '◇' },
    { variant: 'memo', label: 'PLAN 8/15', icon: '✦' },
    { variant: 'guitar', label: 'AFTER CLASS', icon: '♪' }
  ],
  music: [
    { variant: 'guitar', label: 'PLAYLIST', icon: '♪' },
    { variant: 'terminal', label: 'AUDIO LOG', icon: '◇' },
    { variant: 'memo', label: 'LOOP ON', icon: '✦' }
  ],
  toolbox: [
    { variant: 'terminal', label: 'PORTAL', icon: '◇' },
    { variant: 'memo', label: 'LINKS', icon: '✦' },
    { variant: 'guitar', label: 'TOOLS', icon: '♪' }
  ],
  game: [
    { variant: 'terminal', label: 'STAGE READY', icon: '◇' },
    { variant: 'guitar', label: 'BREAK', icon: '♪' },
    { variant: 'memo', label: 'SAVE', icon: '✦' }
  ],
  default: [
    { variant: 'terminal', label: 'FELIX LOG', icon: '◇' },
    { variant: 'guitar', label: 'BGM', icon: '♪' },
    { variant: 'memo', label: 'NOTE', icon: '✦' }
  ]
};

function DecorativeStickerLayer({ activeView }) {
  const stickers = stickerSets[activeView] || stickerSets.default;

  return (
    <div className={`sticker-layer sticker-layer-${activeView}`} aria-hidden="true">
      {stickers.map((sticker, index) => (
        <span className={`sticker-decal sticker-${sticker.variant}`} key={`${sticker.label}-${index}`}>
          <span className="sticker-icon">{sticker.icon}</span>
          <span>{sticker.label}</span>
        </span>
      ))}
    </div>
  );
}

function Live2DMascot({ activeView = 'overview' }) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const mascotRef = useRef(null);
  const dragRef = useRef(null);
  const speechTimerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [lineIndex, setLineIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [speechVisible, setSpeechVisible] = useState(false);
  const [closedNotice, setClosedNotice] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const [mode, setMode] = useState(() => {
    if (typeof localStorage === 'undefined') return 'pet';
    return localStorage.getItem(LIVE2D_MODE_KEY) === 'window' ? 'window' : 'pet';
  });
  const [isQuiet, setIsQuiet] = useState(() => (
    typeof localStorage !== 'undefined' && localStorage.getItem(LIVE2D_QUIET_KEY) === 'true'
  ));
  const [position, setPosition] = useState(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { x: 0, y: 0 };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(LIVE2D_POSITION_KEY) || 'null');
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return saved;
    } catch {
      localStorage.removeItem(LIVE2D_POSITION_KEY);
    }
    return {
      x: Math.max(24, window.innerWidth - 292),
      y: Math.max(96, window.innerHeight - 286)
    };
  });
  const [isHidden, setIsHidden] = useState(() => (
    typeof localStorage !== 'undefined' && localStorage.getItem(LIVE2D_HIDDEN_KEY) === 'true'
  ));
  const activeMascotLines = useMemo(() => {
    const pageLines = mascotPageLines[activeView] || [];
    return [...pageLines, ...mascotLines];
  }, [activeView]);

  function getDefaultPosition(nextMode = mode) {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const width = nextMode === 'window' ? 244 : 214;
    const height = nextMode === 'window' ? 282 : 224;
    return {
      x: Math.max(20, window.innerWidth - width - 28),
      y: Math.max(96, window.innerHeight - height - 36)
    };
  }

  function savePosition(nextPosition) {
    setPosition(nextPosition);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LIVE2D_POSITION_KEY, JSON.stringify(nextPosition));
    }
  }

  function clampPosition(rawPosition) {
    if (typeof window === 'undefined') return rawPosition;
    const width = mascotRef.current?.offsetWidth || (mode === 'window' ? 236 : 208);
    const height = mascotRef.current?.offsetHeight || (mode === 'window' ? 264 : 230);
    return {
      x: Math.min(Math.max(12, rawPosition.x), Math.max(12, window.innerWidth - width - 12)),
      y: Math.min(Math.max(70, rawPosition.y), Math.max(70, window.innerHeight - height - 12))
    };
  }

  function speak(nextIndex = null) {
    setLineIndex((current) => (nextIndex === null ? (current + 1) % activeMascotLines.length : nextIndex));
    setSpeechVisible(true);
    if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
    speechTimerRef.current = window.setTimeout(() => setSpeechVisible(false), 5200);
  }

  useEffect(() => {
    if (isHidden || !canvasRef.current) return undefined;
    let cancelled = false;
    let idleHandle = null;
    let timeoutHandle = null;

    async function mountMascot() {
      setStatus('loading');
      try {
        const { PIXI, Live2DModel } = await ensureLive2DRuntime();
        if (cancelled || !canvasRef.current) return;

        const app = new PIXI.Application({
          view: canvasRef.current,
          width: 260,
          height: 340,
          autoStart: true,
          transparent: true,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2)
        });
        appRef.current = app;

        const model = await Live2DModel.from(LIVE2D_MODEL_URL, { autoInteract: true });
        if (cancelled) {
          app.destroy(false, { children: true, texture: true, baseTexture: true });
          return;
        }

        const scale = Math.min(230 / Math.max(1, model.width), 320 / Math.max(1, model.height));
        model.scale.set(scale);
        model.x = Math.max(0, (260 - model.width) / 2);
        model.y = Math.max(0, 332 - model.height);
        model.on?.('hit', () => {
          setLineIndex((current) => (current + 1) % activeMascotLines.length);
        });
        app.stage.addChild(model);
        setStatus('ready');
      } catch (error) {
        console.warn('[Live2D mascot] failed to load', error);
        setStatus('error');
      }
    }

    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(mountMascot, { timeout: 1200 });
    } else {
      timeoutHandle = window.setTimeout(mountMascot, 360);
    }
    return () => {
      cancelled = true;
      if (idleHandle !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        window.clearTimeout(timeoutHandle);
      }
      if (speechTimerRef.current) {
        window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(false, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, [activeMascotLines.length, isHidden, reloadKey]);

  useEffect(() => {
    if (isHidden || isQuiet) return undefined;
    setLineIndex(0);
    setSpeechVisible(true);
    if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
    speechTimerRef.current = window.setTimeout(() => setSpeechVisible(false), 4200);
    return undefined;
  }, [activeView, isHidden, isQuiet]);

  useEffect(() => {
    function showMascotFromAccount() {
      setIsHidden(false);
      setClosedNotice(false);
      setSpeechVisible(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LIVE2D_HIDDEN_KEY, 'false');
      }
    }
    window.addEventListener(LIVE2D_SHOW_EVENT, showMascotFromAccount);
    return () => window.removeEventListener(LIVE2D_SHOW_EVENT, showMascotFromAccount);
  }, []);

  useEffect(() => {
    function closeMenu() {
      setMenuPosition(null);
    }
    window.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, []);

  useEffect(() => {
    savePosition(clampPosition(position.x || position.y ? position : getDefaultPosition()));
  }, []);

  useEffect(() => {
    function handleResize() {
      savePosition(clampPosition(position));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, mode]);

  function hideMascot() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LIVE2D_HIDDEN_KEY, 'true');
    }
    setIsHidden(true);
    setMenuPosition(null);
    setClosedNotice(true);
    window.setTimeout(() => setClosedNotice(false), 3600);
  }

  function toggleMode() {
    const nextMode = mode === 'window' ? 'pet' : 'window';
    setMode(nextMode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LIVE2D_MODE_KEY, nextMode);
    }
    savePosition(clampPosition(getDefaultPosition(nextMode)));
    setMenuPosition(null);
  }

  function toggleQuietMode() {
    setIsQuiet((current) => {
      const next = !current;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LIVE2D_QUIET_KEY, String(next));
      }
      return next;
    });
    setMenuPosition(null);
  }

  function openMascotMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    setMenuPosition({ open: true });
  }

  function startMascotDrag(event) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false
    };
  }

  function moveMascotDrag(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
    savePosition(clampPosition({ x: drag.originX + dx, y: drag.originY + dy }));
  }

  function endMascotDrag(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!drag.moved) speak();
  }

  if (isHidden) {
    return (
      closedNotice && (
        <div className="live2d-closed-toast">
          已关闭黍泡泡，可以在账号页重新显示。
        </div>
      )
    );
  }

  return (
    <aside
      ref={mascotRef}
      className={`live2d-mascot ${mode === 'window' ? 'windowed' : 'pet'}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      aria-label="本站吉祥物黍泡泡"
    >
      {speechVisible && (
        <div className="live2d-speech">
          <strong>黍泡泡</strong>
          <p>{status === 'error' ? 'Live2D 加载失败，右键可以重试。' : activeMascotLines[lineIndex % activeMascotLines.length]}</p>
          <span>模型来源：切丁鱼片</span>
        </div>
      )}
      <div
        className="live2d-stage"
        title="拖动我，点击我说话，右键打开菜单"
        onContextMenu={openMascotMenu}
        onPointerDown={startMascotDrag}
        onPointerMove={moveMascotDrag}
        onPointerUp={endMascotDrag}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <canvas ref={canvasRef} width="260" height="340" />
        {status === 'loading' && <span className="live2d-loading">加载中</span>}
        {status === 'error' && (
          <span className="live2d-fallback">
            <img src={LIVE2D_TEXTURE_FALLBACK_URL} alt="" loading="lazy" decoding="async" />
          </span>
        )}
      </div>
      {menuPosition && (
        <div
          className="live2d-context-menu"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => speak()}>说句话</button>
          <button type="button" onClick={toggleMode}>{mode === 'window' ? '切回贴边模式' : '变成悬浮窗'}</button>
          <button type="button" onClick={toggleQuietMode}>{isQuiet ? '关闭低打扰' : '低打扰模式'}</button>
          <button className="danger" type="button" onClick={hideMascot}>关闭</button>
        </div>
      )}
    </aside>
  );
}

function SidebarMusicPlayer({ track, isPlaying, progress, duration, togglePlayback, stepTrack, seekTrack, openMusic }) {
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const safeProgress = safeDuration ? Math.min(safeDuration, Math.max(0, progress)) : 0;
  return (
    <div className={isPlaying ? 'sidebar-music-player playing' : 'sidebar-music-player'}>
      <button className="sidebar-music-main" type="button" onClick={openMusic} title="打开音乐">
        <span className="sidebar-music-disc">
          {track?.coverUrl ? (
            <img src={track.coverUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <Music size={18} />
          )}
        </span>
        <span className="sidebar-music-info">
          <strong className="sidebar-music-title" title={track?.title || 'Felix Music'}>
            <span>{track?.title || 'Felix Music'}</span>
            <span aria-hidden="true">{track?.title || 'Felix Music'}</span>
          </strong>
          <em>{track ? `${formatTrackTime(progress)} / ${formatTrackTime(duration)}` : '去音乐页选一首歌'}</em>
        </span>
      </button>
      <input
        className="sidebar-music-range"
        type="range"
        min="0"
        max={safeDuration || 0}
        step="1"
        value={safeProgress}
        disabled={!track || !safeDuration}
        onChange={(event) => seekTrack(Number(event.target.value))}
        aria-label="迷你播放器播放进度"
      />
      <div className="sidebar-music-actions">
        <button type="button" onClick={() => stepTrack(-1)} disabled={!track} aria-label="上一首">
          <SkipBack size={14} />
        </button>
        <button type="button" onClick={togglePlayback} disabled={!track} aria-label={isPlaying ? '暂停' : '播放'}>
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button type="button" onClick={() => stepTrack(1)} disabled={!track} aria-label="下一首">
          <SkipForward size={14} />
        </button>
      </div>
    </div>
  );
}

function parseLyrics(source = '') {
  const parsed = String(source)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .flatMap((rawLine) => {
      const line = rawLine.trim();
      if (!line) return [];
      const timeMatches = Array.from(line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?]/g));
      const text = line.replace(/\[[^\]]+]/g, '').trim();
      if (!timeMatches.length) return [{ time: null, text: text || line }];
      return timeMatches.map((match) => {
        const minutes = Number(match[1]);
        const seconds = Number(match[2]);
        const fraction = match[3] ? Number(`0.${match[3].padEnd(3, '0').slice(0, 3)}`) : 0;
        return { time: minutes * 60 + seconds + fraction, text: text || '♪' };
      });
    })
    .filter((line) => line.text)
    .sort((first, second) => {
      if (!Number.isFinite(first.time)) return 1;
      if (!Number.isFinite(second.time)) return -1;
      return first.time - second.time;
    });
  return parsed.slice(0, 120);
}

function MusicWorkspace({
  tracks,
  queue,
  currentTrack,
  recentTracks,
  isPlaying,
  progress,
  duration,
  repeatMode,
  setRepeatMode,
  volume,
  setVolume,
  isLoading,
  refreshMusicTracks,
  selectedPlaylistId,
  setSelectedPlaylistId,
  playlists,
  selectedPlaylist,
  createPlaylist,
  deletePlaylist,
  toggleTrackInPlaylist,
  moveTrackInPlaylist,
  reorderTrackInPlaylist,
  playTrack,
  togglePlayback,
  stepTrack,
  seekTrack
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [draggingTrackFilename, setDraggingTrackFilename] = useState(null);
  const [dragOverTrackFilename, setDragOverTrackFilename] = useState(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const lyricListRef = useRef(null);
  const selectedTrackNames = new Set(selectedPlaylist?.trackFilenames || []);
  const displayTracks = selectedPlaylist ? queue : tracks;
  const currentLyrics = useMemo(() => parseLyrics(currentTrack?.lyrics || ''), [currentTrack?.lyrics]);
  const activeLyricIndex = useMemo(() => {
    if (!currentLyrics.length) return -1;
    const timedLyrics = currentLyrics.filter((line) => Number.isFinite(line.time));
    if (!timedLyrics.length) return -1;
    let nextIndex = 0;
    currentLyrics.forEach((line, index) => {
      if (Number.isFinite(line.time) && line.time <= progress + 0.25) nextIndex = index;
    });
    return nextIndex;
  }, [currentLyrics, progress]);

  useEffect(() => {
    if (activeLyricIndex < 0 || !lyricListRef.current) return;
    const target = lyricListRef.current.querySelector(`[data-lyric-index="${activeLyricIndex}"]`);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeLyricIndex]);

  return (
    <section className="workspace music-workspace">
      <div className="section-heading">
        <p className="eyebrow">Felix Music</p>
        <h1>个人音乐台</h1>
      </div>

      <section
        className="music-player-panel"
        style={currentTrack?.coverUrl ? { '--music-cover-bg': `url(${currentTrack.coverUrl})` } : undefined}
      >
        <div className="music-now">
          <div className="music-cover" aria-hidden="true">
            {currentTrack?.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" decoding="async" />
            ) : (
              <Music size={42} />
            )}
          </div>
          <div>
            <span>正在播放</span>
            <h2>{currentTrack?.title || '等待加入第一首歌'}</h2>
            <p>{currentTrack?.artist || '后台上传音乐后，这里会变成你的私人歌单。'}</p>
          </div>
        </div>

        <div className="music-extra-grid">
          <article className="music-lyric-panel">
            <div className="admin-panel-heading compact-heading">
              <h3>歌词</h3>
              <span>{currentTrack?.lyricsUrl ? '已上传歌词' : '后台可上传 .lrc / .txt'}</span>
            </div>
            {currentLyrics.length ? (
              <div className="music-lyric-lines" ref={lyricListRef}>
                {currentLyrics.map((line, index) => (
                  <p
                    className={index === activeLyricIndex ? 'active' : ''}
                    data-lyric-index={index}
                    key={`${line.text}-${index}`}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            ) : (
              <p className="empty-state compact">还没有歌词。去后台音乐管理给这首歌上传 .lrc 或 .txt。</p>
            )}
          </article>
          <article className="music-sidecar-tip">
            <strong>封面 / 歌词</strong>
            <p>封面和歌词都在后台上传，前台只负责安静播放。</p>
          </article>
        </div>

        <div className="music-progress">
          <span>{formatTrackTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={Math.min(progress, duration || 0)}
            disabled={!currentTrack}
            onChange={(event) => {
              const nextTime = Number(event.target.value);
              seekTrack(nextTime);
            }}
            aria-label="播放进度"
          />
          <span>{formatTrackTime(duration)}</span>
        </div>

        <div className="music-controls">
          <button className="ghost-button" type="button" onClick={() => stepTrack(-1)} disabled={!queue.length}>
            <SkipBack size={17} />
            <span>上一首</span>
          </button>
          <button className="primary-action" type="button" onClick={togglePlayback} disabled={!currentTrack}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? '暂停' : '播放'}</span>
          </button>
          <button className="ghost-button" type="button" onClick={() => stepTrack(1)} disabled={!queue.length}>
            <SkipForward size={17} />
            <span>下一首</span>
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setRepeatMode((current) => (current === 'list' ? 'one' : current === 'one' ? 'none' : 'list'))}
          >
            <RefreshCw size={16} />
            <span>{repeatMode === 'list' ? '列表循环' : repeatMode === 'one' ? '单曲循环' : '播完停止'}</span>
          </button>
          <label className="music-volume-control">
            <span>音量</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="音量"
            />
            <em>{Math.round(volume * 100)}%</em>
          </label>
          <button className="ghost-button" type="button" onClick={() => setIsQueueOpen((current) => !current)}>
            <List size={16} />
            <span>{isQueueOpen ? '收起队列' : '播放队列'}</span>
          </button>
        </div>

        {isQueueOpen && (
          <div className="music-queue-panel">
            <div className="admin-panel-heading compact-heading">
              <h3>播放队列</h3>
              <span>{queue.length} 首</span>
            </div>
            <div className="music-queue-list">
              {queue.map((track, index) => (
                <button
                  className={track.filename === currentTrack?.filename ? 'active' : ''}
                  type="button"
                  key={track.filename}
                  onClick={() => playTrack(track, selectedPlaylistId)}
                >
                  <span className="music-queue-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="music-queue-thumb">{track.coverUrl ? <img src={track.coverUrl} alt="" loading="lazy" decoding="async" /> : <Music size={15} />}</span>
                  <strong>{track.title}</strong>
                  <em>{track.artist || formatFileSize(track.size)}</em>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {recentTracks.length > 0 && (
        <section className="music-recent-panel">
          <div className="admin-panel-heading compact-heading">
            <div>
              <h2>最近播放</h2>
              <span>从上次听过的歌继续</span>
            </div>
          </div>
          <div className="music-recent-list">
            {recentTracks.slice(0, 6).map((track) => (
              <button
                className={track.filename === currentTrack?.filename ? 'music-recent-card active' : 'music-recent-card'}
                type="button"
                key={track.filename}
                onClick={() => playTrack(track, 'all')}
              >
                <span>{track.coverUrl ? <img src={track.coverUrl} alt="" loading="lazy" decoding="async" /> : <Music size={16} />}</span>
                <strong>{track.title}</strong>
                <em>{formatFileSize(track.size)}</em>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="music-library-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>歌单</h2>
            <span>{selectedPlaylist ? `${selectedPlaylist.name} · ${queue.length} 首` : `全部音乐 · ${tracks.length} 首`}</span>
          </div>
          <button className="ghost-button" type="button" onClick={refreshMusicTracks}>
            <RefreshCw size={16} />
            <span>刷新</span>
          </button>
        </div>

        <div className="playlist-toolbar">
          <button
            className={selectedPlaylistId === 'all' ? 'playlist-chip active' : 'playlist-chip'}
            type="button"
            onClick={() => setSelectedPlaylistId('all')}
          >
            全部音乐
          </button>
          {playlists.map((playlist) => (
            <button
              className={selectedPlaylistId === playlist.id ? 'playlist-chip active' : 'playlist-chip'}
              type="button"
              key={playlist.id}
              onClick={() => setSelectedPlaylistId(playlist.id)}
            >
              {playlist.name}
              <small>{playlist.trackFilenames.length}</small>
            </button>
          ))}
        </div>

        <form
          className="playlist-create-row"
          onSubmit={(event) => {
            event.preventDefault();
            createPlaylist(newPlaylistName);
            setNewPlaylistName('');
          }}
        >
          <input
            value={newPlaylistName}
            onChange={(event) => setNewPlaylistName(event.target.value)}
            placeholder="新建歌单，比如 明日方舟 / 学习用 / 睡前"
          />
          <button className="primary-action" type="submit">
            <PlusCircle size={17} />
            <span>新建歌单</span>
          </button>
        </form>

        {selectedPlaylist && (
          <section className="playlist-editor">
            <div className="admin-panel-heading compact-heading">
              <h3>编辑「{selectedPlaylist.name}」</h3>
              <button className="danger-button" type="button" onClick={() => deletePlaylist(selectedPlaylist.id)}>
                <Trash2 size={16} />
                <span>删除歌单</span>
              </button>
            </div>
            <div className="playlist-pick-list">
              {tracks.map((track) => (
                <label key={track.filename}>
                  <input
                    type="checkbox"
                    checked={selectedTrackNames.has(track.filename)}
                    onChange={() => toggleTrackInPlaylist(selectedPlaylist.id, track.filename)}
                  />
                  <span>{track.title}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {tracks.length === 0 ? (
          <p className="empty-state">还没有音乐。登录后台后，在“音乐”里上传 MP3、WAV、OGG、FLAC、M4A 或 AAC。</p>
        ) : displayTracks.length === 0 ? (
          <p className="empty-state">这个歌单还没有歌。上方勾选想加入的歌曲。</p>
        ) : (
          <div className="music-track-list">
            {displayTracks.map((track, index) => (
              <div
                className={[
                  'music-track',
                  track.filename === currentTrack?.filename ? 'active' : '',
                  dragOverTrackFilename === track.filename && draggingTrackFilename !== track.filename ? 'drag-over' : ''
                ].filter(Boolean).join(' ')}
                key={track.filename}
                onDragOver={(event) => {
                  if (!selectedPlaylist) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragOverTrackFilename(track.filename);
                }}
                onDragLeave={() => setDragOverTrackFilename((current) => (current === track.filename ? null : current))}
                onDrop={(event) => {
                  if (!selectedPlaylist) return;
                  event.preventDefault();
                  const source = event.dataTransfer.getData('text/plain') || draggingTrackFilename;
                  reorderTrackInPlaylist(selectedPlaylist.id, source, track.filename);
                  setDraggingTrackFilename(null);
                  setDragOverTrackFilename(null);
                }}
              >
                <button type="button" onClick={() => playTrack(track, selectedPlaylistId)}>
                  {selectedPlaylist && (
                    <span
                      className="music-track-drag-handle"
                      draggable
                      onDragStart={(event) => {
                        setDraggingTrackFilename(track.filename);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', track.filename);
                      }}
                      onDragEnd={() => {
                        setDraggingTrackFilename(null);
                        setDragOverTrackFilename(null);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      title="拖动调整歌曲顺序"
                    >
                      <GripVertical size={15} />
                    </span>
                  )}
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{track.title}</strong>
                  <em>{formatFileSize(track.size)}</em>
                </button>
                {selectedPlaylist && (
                  <div className="music-track-order-actions">
                    <button type="button" onClick={() => moveTrackInPlaylist(selectedPlaylist.id, track.filename, -1)} disabled={index === 0} aria-label="上移">
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" onClick={() => moveTrackInPlaylist(selectedPlaylist.id, track.filename, 1)} disabled={index === displayTracks.length - 1} aria-label="下移">
                      <ArrowDown size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function GameWorkspace() {
  const [frameKey, setFrameKey] = useState(0);
  const [selectedGameId, setSelectedGameId] = useState('card-war');
  const gameCatalog = [
    {
      id: 'card-war',
      title: '决斗小游戏',
      subtitle: 'Card War',
      status: gameModule.status || '已嵌入',
      plan: gameModule.plan,
      repository: gameModule.repository,
      playUrl: gameModule.playUrl
    },
    {
      id: 'isaac-notes',
      title: '以撒道具速查',
      subtitle: '计划中',
      status: '构思中',
      plan: '以后可以做成休息时用的小工具，记录道具、角色和流派组合。',
      repository: '',
      playUrl: ''
    },
    {
      id: 'daily-clicker',
      title: '暑假打卡小游戏',
      subtitle: '计划中',
      status: '空位',
      plan: '把计划完成度做成轻量小游戏，完成任务就点亮当天进度。',
      repository: '',
      playUrl: ''
    }
  ];
  const selectedGame = gameCatalog.find((game) => game.id === selectedGameId) || gameCatalog[0];

  return (
    <section className="workspace game-workspace">
      <div className="section-heading">
        <p className="eyebrow">小游戏</p>
        <h1>游戏库</h1>
      </div>

      <div className="game-selector-grid" aria-label="选择游戏">
        {gameCatalog.map((game) => (
          <button
            className={selectedGame.id === game.id ? 'game-selector-card active' : 'game-selector-card'}
            type="button"
            key={game.id}
            onClick={() => {
              setSelectedGameId(game.id);
              setFrameKey((current) => current + 1);
            }}
          >
            <span>{game.status}</span>
            <strong>{game.title}</strong>
            <em>{game.subtitle}</em>
          </button>
        ))}
      </div>

      <div className="game-layout">
        <div className="game-details">
          <span className="status-pill inline">{selectedGame.status}</span>
          <div className="game-copy">
            <h2>{selectedGame.title}</h2>
            <p>{selectedGame.plan}</p>
          </div>
          <div className="game-actions">
            <button type="button" onClick={() => setFrameKey((current) => current + 1)} disabled={!selectedGame.playUrl}>
              <RefreshCw size={17} />
              <span>刷新游戏</span>
            </button>
            {selectedGame.playUrl && <a href={selectedGame.playUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} />
              <span>新窗口打开</span>
            </a>}
            {selectedGame.repository && <a className="secondary-link" href={selectedGame.repository} target="_blank" rel="noreferrer">
              <Github size={17} />
              <span>查看仓库</span>
            </a>}
          </div>
        </div>
        <div className="game-stage">
          {selectedGame.playUrl ? (
            <iframe
              key={frameKey}
              title={selectedGame.title}
              src={selectedGame.playUrl}
              loading="lazy"
              allow="fullscreen; gamepad; autoplay"
            />
          ) : (
            <div className="game-placeholder">
              <Gamepad2 size={42} />
              <strong>这个游戏还在排队</strong>
              <span>以后有新项目时可以直接接到这里。</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AccountWorkspace({
  currentUser,
  profile,
  accountActivity,
  refreshAccountActivity,
  setActiveView,
  openArticle,
  updateSidebarAvatar,
  profileAvatarMessage,
  isSavingProfileAvatar,
  logout
}) {
  const summary = accountActivity?.summary || {};
  const comments = accountActivity?.comments || [];
  const reactions = accountActivity?.reactions || [];
  const favoriteArticles = accountActivity?.favoriteArticles || [];
  const sidebarAvatarUrl = profile?.avatarUrl || '/avatar.jpg';

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
          <div className="account-profile-actions">
            <button className="ghost-button" type="button" onClick={refreshAccountActivity}>
              <RefreshCw size={16} />
              <span>刷新</span>
            </button>
            <button className="ghost-button danger" type="button" onClick={() => logout()}>
              <LogOut size={16} />
              <span>退出登录</span>
            </button>
          </div>
        </div>

        {currentUser.role === 'admin' && (
          <div className="account-site-avatar-editor">
            <img src={sidebarAvatarUrl} alt="当前侧边栏头像" />
            <div>
              <strong>侧边栏头像</strong>
              <span>这里会同步到左侧导航栏，不影响 GitHub 登录头像。</span>
              {profileAvatarMessage && <em>{profileAvatarMessage}</em>}
            </div>
            <label className="ghost-button file-upload-control account-avatar-upload">
              <ImageIcon size={16} />
              <span>{isSavingProfileAvatar ? '处理中' : '上传头像'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                disabled={isSavingProfileAvatar}
                onChange={(event) => {
                  updateSidebarAvatar(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
        )}

        <div className="account-site-avatar-editor mascot-setting-row">
          <span className="mascot-setting-icon">
            <Bot size={20} />
          </span>
          <div>
            <strong>首页小组件</strong>
            <span>如果右键关闭了黍泡泡，可以在这里重新叫出来。</span>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(LIVE2D_HIDDEN_KEY, 'false');
              }
              window.dispatchEvent(new Event(LIVE2D_SHOW_EVENT));
            }}
          >
            <Bot size={16} />
            <span>显示黍泡泡</span>
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

        <details className="owner-login-details">
          <summary>站长邮箱登录</summary>

          <div className="owner-login-form">
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
                <span>{isAuthLoading ? '处理中' : '登录'}</span>
              </button>
            </div>
          </div>
        </details>

        {authMessage && <p className="admin-message">{authMessage}</p>}
      </form>
    </section>
  );
}

class AdminPanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '页面加载失败' };
  }

  componentDidCatch(error) {
    console.error('Admin panel render failed', error);
    try {
      localStorage.setItem(ADMIN_PAGE_KEY, 'overview');
    } catch {
      // Ignore storage recovery failures; the visible reset button still works.
    }
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="admin-panel panel-error-card">
          <div className="admin-panel-heading">
            <div>
              <h2>{this.props.title || '这个页面暂时打不开'}</h2>
              <span>已自动保护其它后台页面，可以先回到总览继续操作。</span>
            </div>
          </div>
          <p className="panel-error-detail">{this.state.message}</p>
          <div className="panel-error-actions">
            <button className="primary-action" type="button" onClick={this.props.onReset}>
              回到总览
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

function ReleaseWorkspace() {
  const [releaseQuery, setReleaseQuery] = useState('');
  const [releaseMajor, setReleaseMajor] = useState('all');
  const [releaseStatus, setReleaseStatus] = useState('all');
  const latestRelease = releaseArchive[0];
  const shippedCount = releaseArchive.filter((release) => release.status === '已上线').length;
  const archivedCount = releaseArchive.filter((release) => release.status === '已归档').length;
  const totalPoints = releaseArchive.reduce((total, release) => total + release.points.length, 0);
  const releaseMajorOptions = Array.from(new Set(releaseArchive.map((release) => release.version.split('.')[0])))
    .sort((first, second) => Number(second.replace('v', '')) - Number(first.replace('v', '')));
  const releaseStageMeta = {
    v5: {
      title: '当前个人站',
      detail: '把博客整理成个人主页、技术笔记、计划、音乐、工具箱和后台管理的综合体。'
    },
    v4: {
      title: '视觉去 AI 味',
      detail: '从工具台感转向更有个人气质的前台视觉，加入二次元、字体和阅读细节。'
    },
    v3: {
      title: '个人音乐',
      detail: '本地音乐、常驻播放器、自建歌单和侧栏播放体验逐步成型。'
    },
    v2: {
      title: '完整闭环',
      detail: '登录、账号、互动、计划、运维和后台能力串成一个可持续维护的小型站点。'
    },
    v1: {
      title: '内容系统',
      detail: '文章详情、Markdown、评论、图片、草稿、AI 辅助和写作后台逐步稳定。'
    },
    v0: {
      title: 'MVP 基建',
      detail: '从静态博客 MVP 到数据库、Docker、OAuth、CI 和云服务器部署的底座阶段。'
    }
  };
  const filteredReleases = releaseArchive.filter((release) => {
    const query = releaseQuery.trim().toLowerCase();
    const searchable = [release.version, release.title, release.status, ...release.points].join(' ').toLowerCase();
    const major = release.version.split('.')[0];
    return (
      (!query || searchable.includes(query)) &&
      (releaseMajor === 'all' || major === releaseMajor) &&
      (releaseStatus === 'all' || release.status === releaseStatus)
    );
  });
  const releaseGroups = releaseMajorOptions
    .map((major) => ({
      major,
      meta: releaseStageMeta[major] || { title: `${major}.x 阶段`, detail: '阶段记录已归入版本时间线。' },
      releases: filteredReleases.filter((release) => release.version.split('.')[0] === major)
    }))
    .filter((group) => group.releases.length > 0);

  function updateReleaseQuery(value) {
    setReleaseQuery(value);
  }

  function updateReleaseMajor(value) {
    setReleaseMajor(value);
  }

  function updateReleaseStatus(value) {
    setReleaseStatus(value);
  }

  return (
    <section className="admin-panel release-page">
      <div className="admin-panel-heading">
        <div>
          <h2>版本清单</h2>
          <span>从 v0.1.0 到 {latestRelease.version} 的更新档案</span>
        </div>
        <span className="release-badge">{latestRelease.version}</span>
      </div>

      <section className="release-story-hero">
        <div>
          <p className="eyebrow">Website Maintenance Log</p>
          <h3>从可运行，到像副将凡自己的站</h3>
          <span>版本清单按大版本收纳，既能查改动，也能看出这个网站是怎么一点点长出来的。</span>
        </div>
        <div className="release-next-order" aria-label="后续优化顺序">
          {['6', '3', '4', '1', '7'].map((item, index) => (
            <React.Fragment key={item}>
              <strong>{item}</strong>
              {index < 4 && <span>→</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      <div className="release-metric-grid">
        <div className="release-metric">
          <span>当前版本</span>
          <strong>{latestRelease.version}</strong>
        </div>
        <div className="release-metric">
          <span>已上线版本</span>
          <strong>{shippedCount} 个</strong>
        </div>
        <div className="release-metric">
          <span>历史归档</span>
          <strong>{archivedCount} 个</strong>
        </div>
        <div className="release-metric">
          <span>改动点</span>
          <strong>{totalPoints} 项</strong>
        </div>
        <div className="release-metric">
          <span>最近更新</span>
          <strong>{latestRelease.date}</strong>
        </div>
      </div>

      <div className="release-toolbar">
        <div className="admin-filter-bar release-filter-bar">
          <input
            value={releaseQuery}
            onChange={(event) => updateReleaseQuery(event.target.value)}
            placeholder="搜索版本、标题或改动点"
          />
          <select value={releaseMajor} onChange={(event) => updateReleaseMajor(event.target.value)}>
            <option value="all">全部大版本</option>
            {releaseMajorOptions.map((major) => (
              <option key={major} value={major}>{major}.x</option>
            ))}
          </select>
          <select value={releaseStatus} onChange={(event) => updateReleaseStatus(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="已上线">已上线</option>
            <option value="已归档">已归档</option>
          </select>
        </div>
      </div>

      <div className="release-major-timeline">
        {releaseGroups.length === 0 ? (
          <p className="empty-state">没有匹配的版本记录。</p>
        ) : releaseGroups.map((group) => (
          <section className="release-major-block" key={group.major}>
            <div className="release-major-head">
              <span className="release-major-mark">{group.major}</span>
              <div>
                <h3>{group.meta.title}</h3>
                <p>{group.meta.detail}</p>
              </div>
              <strong>{group.releases.length} 个版本</strong>
            </div>
            <div className="release-timeline">
              {group.releases.map((release) => (
                <article className="release-version-card" key={release.version}>
                  <div>
                    <span className="release-version">{release.version}</span>
                    <h3>{release.title}</h3>
                    <small>{release.date}</small>
                  </div>
                  <span className={`ops-status ${release.status === '已上线' ? 'ready' : 'warning'}`}>
                    {release.status}
                  </span>
                  <ul>
                    {release.points.map((point) => (
                      <li key={point}>
                        <CheckCircle2 size={15} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function buildArticleExplorerGroups(articles) {
  const groups = new Map();
  articles.forEach((article, index) => {
    const section = isTechnicalArticle(article) ? '技术笔记' : '随笔 / 娱乐文章';
    const folderParts = isTechnicalArticle(article)
      ? [article.noteCollection || article.category || '未收纳笔记', article.notePath || '未分组']
      : [article.category || '未分类'];
    const folder = folderParts.filter(Boolean).join(' / ');
    const key = `${section}::${folder}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        section,
        folder,
        articles: []
      });
    }
    groups.get(key).articles.push({ ...article, displayOrder: index + 1 });
  });
  return Array.from(groups.values());
}

function AdminWorkspace({
  articles,
  articleForm,
  updateArticleForm,
  editingArticleId,
  isSavingArticle,
  isRunningArticleAi,
  isUploadingImage,
  isImportingNoteFiles,
  uploadedImages,
  isLoadingUploadedImages,
  musicTracks,
  isLoadingMusicTracks,
  isUploadingMusic,
  articleDraftNotice,
  adminMessage,
  setAdminMessage,
  adminStats,
  adminAuditLogs,
  isLoadingAuditLogs,
  refreshAdminStats,
  refreshAdminAuditLogs,
  aiSettings,
  aiTestForm,
  setAiTestForm,
  aiConfigForm,
  setAiConfigForm,
  aiTestMessage,
  isTestingAi,
  isSavingAiSettings,
  testAiSettings,
  testAiConfigSettings,
  saveAiSettings,
  disableAiSettings,
  deleteAiSettings,
  refreshAiSettings,
  aiGenerationHistory,
  submitArticleForm,
  importNoteFiles,
  uploadArticleCover,
  uploadArticleContentImage,
  refreshUploadedImages,
  copyUploadedImageUrl,
  deleteUploadedImage,
  refreshMusicTracks,
  uploadMusicTrack,
  uploadMusicCover,
  uploadMusicLyrics,
  deleteMusicTrack,
  runArticleAiTask,
  undoLatestArticleAiResult,
  restoreArticleDraft,
  clearArticleDraft,
  resetArticleForm,
  startEditingArticle,
  deleteArticle,
  reorderArticles,
  manageArticlesBulk,
  collectArticlesBulk,
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
  approveAdminCommentsBulk,
  deleteAdminComment,
  currentUser,
  authToken,
  profile,
  profileForm,
  updateProfileForm,
  saveSiteProfile,
  isSavingSiteProfile,
  sitePreferences,
  isSavingSitePreferences,
  saveSitePreferences,
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
  const filteredPendingCommentCount = filteredAdminComments.filter((comment) => comment.status === 'pending').length;
  const publishedCount = articles.filter((article) => article.status !== 'draft').length;
  const draftCount = articles.filter((article) => article.status === 'draft').length;
  const pendingCommentCount = adminComments.filter((comment) => comment.status === 'pending').length;
  const releaseMetrics = [
    { label: '已发布文章', value: `${publishedCount} 篇` },
    { label: '草稿', value: `${draftCount} 篇` },
    { label: '技术笔记', value: `${articles.filter((article) => isTechnicalArticle(article)).length} 篇` },
    { label: '评论', value: `${adminComments.length} 条` },
    { label: '音乐', value: `${musicTracks.length} 首` },
  ];
  const readinessItems = [
    { label: '文章系统', done: articles.length > 0 },
    { label: '笔记上传', done: true },
    { label: '评论删除', done: true },
    { label: '管理员登录', done: Boolean(currentUser?.role === 'admin') },
    { label: '音乐上传', done: true },
  ];
  const adminPulseItems = [
    {
      label: '待处理',
      value: pendingCommentCount ? `${pendingCommentCount} 条` : '清爽',
      detail: pendingCommentCount ? '有评论等待审核' : '评论队列暂无压力',
      tone: pendingCommentCount ? 'attention' : 'ready'
    },
    {
      label: '内容库存',
      value: `${publishedCount} / ${draftCount}`,
      detail: '已发布 / 草稿',
      tone: draftCount ? 'attention' : 'ready'
    },
    {
      label: '笔记库',
      value: `${articles.filter((article) => isTechnicalArticle(article)).length} 篇`,
      detail: '技术内容独立成知识库入口',
      tone: 'ready'
    },
    {
      label: '安全日志',
      value: `${adminAuditLogs.length} 条`,
      detail: isLoadingAuditLogs ? '正在刷新' : '最近操作留痕',
      tone: 'ready'
    }
  ];
  const adminPageItems = [
    { id: 'overview', label: '总览', detail: '状态、统计、待办', icon: Star, count: `${publishedCount} 篇` },
    { id: 'editor', label: '写文章', detail: editingArticleId ? '继续编辑当前文章' : '随笔和普通文章', icon: FilePenLine, count: draftCount ? `${draftCount} 草稿` : 'Markdown' },
    { id: 'notes', label: '笔记上传', detail: '导入 .md 和内含图片', icon: BookOpen, count: 'MkDocs 感' },
    { id: 'articles', label: '内容库', detail: '编辑、删除、置顶', icon: BookOpen, count: `${articles.length} 篇` },
    { id: 'comments', label: '评论', detail: '查看和删除评论', icon: MessageCircle, count: `${adminComments.length} 条` },
    { id: 'music', label: '音乐', detail: '上传歌单和管理播放', icon: Music, count: `${musicTracks.length} 首` },
    { id: 'toolbox', label: '工具箱', detail: '自定义网址和友链', icon: Wrench, count: 'Links' },
    { id: 'releases', label: '版本', detail: '更新记录和路线', icon: Code2, count: releaseRoadmap[0].version },
    { id: 'visual', label: '视觉巡检', detail: '白底、控件、夜间模式', icon: Eye, count: 'QA' },
    { id: 'ops', label: '运维', detail: '服务、部署、脚本', icon: ShieldCheck, count: '控制台' },
    { id: 'security', label: '安全', detail: '操作日志和删除保护', icon: ShieldCheck, count: `${adminAuditLogs.length} 条` }
  ];
  const contentTextareaRef = useRef(null);
  const previewScrollRef = useRef(null);
  const [aiInsertMode, setAiInsertMode] = useState('append');
  const [activeAdminPage, setActiveAdminPage] = useState(readStoredAdminPage);
  const [adminStatsRange, setAdminStatsRange] = useState('7d');
  const [articleManagerQuery, setArticleManagerQuery] = useState('');
  const [articleManagerStatus, setArticleManagerStatus] = useState('all');
  const [articleManagerCategory, setArticleManagerCategory] = useState('all');
  const [selectedManagerArticleIds, setSelectedManagerArticleIds] = useState([]);
  const [managerCollectionDraft, setManagerCollectionDraft] = useState('');
  const [managerPathDraft, setManagerPathDraft] = useState('');
  const [draggingArticleId, setDraggingArticleId] = useState(null);
  const [dragOverArticleId, setDragOverArticleId] = useState(null);
  const [imageManagerQuery, setImageManagerQuery] = useState('');
  const [imageManagerSort, setImageManagerSort] = useState('newest');
  const [draftHistory, setDraftHistory] = useState(readDraftHistory);
  const [frontendErrorLogs, setFrontendErrorLogs] = useState(readFrontendErrorLogs);
  const [backupRecords, setBackupRecords] = useState(readBackupRecords);
  const [backupNote, setBackupNote] = useState('');
  const [botCorpusSamples, setBotCorpusSamples] = useState(readBotCorpusSamples);
  const [corpusInput, setCorpusInput] = useState('');
  const [studyState, setStudyState] = useState(readStudyState);
  const [studyInput, setStudyInput] = useState('');
  const shouldShowAdminLayout = ['editor', 'notes', 'articles', 'music', 'comments', 'toolbox'].includes(activeAdminPage);
  const deferredArticleContent = useDeferredValue(articleForm.content);

  useEffect(() => {
    localStorage.setItem(ADMIN_PAGE_KEY, activeAdminPage);
  }, [activeAdminPage]);

  const articleCategoryOptions = Array.from(
    new Set(articles.map((article) => article.category || '未分类'))
  ).sort((first, second) => first.localeCompare(second, 'zh-CN'));
  const filteredManagerArticles = articles.filter((article) => {
    const query = articleManagerQuery.trim().toLowerCase();
    const searchable = [article.title, article.summary, article.category, article.noteCollection, article.notePath, ...(article.tags || [])]
      .join(' ')
      .toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (articleManagerStatus === 'all' || (article.status || 'published') === articleManagerStatus) &&
      (articleManagerCategory === 'all' || (article.category || '未分类') === articleManagerCategory)
    );
  });
  const articleExplorerGroups = buildArticleExplorerGroups(filteredManagerArticles);
  const selectedManagerArticles = filteredManagerArticles.filter((article) => selectedManagerArticleIds.includes(article.id));
  const isAllManagerArticlesSelected = filteredManagerArticles.length > 0
    && filteredManagerArticles.every((article) => selectedManagerArticleIds.includes(article.id));
  const articleExplorerStats = useMemo(() => {
    const folderCount = articleExplorerGroups.length;
    const uncollectedCount = filteredManagerArticles.filter((article) => isTechnicalArticle(article) && !article.noteCollection && !article.notePath).length;
    const draftVisibleCount = filteredManagerArticles.filter((article) => article.status === 'draft').length;
    return { folderCount, uncollectedCount, draftVisibleCount };
  }, [articleExplorerGroups, filteredManagerArticles]);

  function toggleManagerArticleSelection(articleId) {
    setSelectedManagerArticleIds((current) => (
      current.includes(articleId)
        ? current.filter((id) => id !== articleId)
        : [...current, articleId]
    ));
  }

  function toggleAllManagerArticles() {
    if (isAllManagerArticlesSelected) {
      setSelectedManagerArticleIds((current) => current.filter((id) => !filteredManagerArticles.some((article) => article.id === id)));
      return;
    }
    setSelectedManagerArticleIds((current) => Array.from(new Set([...current, ...filteredManagerArticles.map((article) => article.id)])));
  }

  async function runManagerBulkAction(action) {
    await manageArticlesBulk(selectedManagerArticles, action);
    setSelectedManagerArticleIds([]);
  }

  async function runManagerCollectAction() {
    await collectArticlesBulk(selectedManagerArticles, {
      noteCollection: managerCollectionDraft,
      notePath: managerPathDraft
    });
    setSelectedManagerArticleIds([]);
  }

  async function dropArticleOnTarget(targetArticleId) {
    const sourceArticleId = draggingArticleId;
    setDraggingArticleId(null);
    setDragOverArticleId(null);
    if (!sourceArticleId || !targetArticleId || sourceArticleId === targetArticleId) return;
    await reorderArticles(sourceArticleId, targetArticleId);
  }

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
  const adminTaskItems = [
    {
      id: 'comments',
      title: adminComments.length ? '评论区有互动' : '评论区很安静',
      detail: adminComments.length ? `现在共有 ${adminComments.length} 条评论，后台只保留查看和删除` : '有新评论后可直接查看或删除',
      action: '查看评论',
      page: 'comments',
      tone: adminComments.length ? 'ready' : 'neutral',
      icon: MessageCircle
    },
    {
      id: 'drafts',
      title: draftCount ? '继续草稿' : '新文章准备',
      detail: draftCount ? `还有 ${draftCount} 篇草稿可以继续推进` : '可以从模板或空白文章开始写',
      action: draftCount ? '看文章库' : '写文章',
      page: draftCount ? 'articles' : 'editor',
      tone: draftCount ? 'attention' : 'ready',
      icon: FilePenLine
    },
    {
      id: 'ops',
      title: '运行状态检查',
      detail: '进入运维页执行真实检查，确认 API、数据库和上传目录状态',
      action: '检查运维',
      page: 'ops',
      tone: 'neutral',
      icon: ShieldCheck
    },
    {
      id: 'visual',
      title: '后台视觉巡检',
      detail: '集中看卡片、表单、按钮和提示条，避免深色模式漏白底',
      action: '看巡检',
      page: 'visual',
      tone: 'ready',
      icon: Eye
    },
    {
      id: 'notes',
      title: '导入技术笔记',
      detail: '上传 Markdown 和同目录图片，自动变成一篇可编辑草稿',
      action: '上传笔记',
      page: 'notes',
      tone: 'neutral',
      icon: BookOpen
    }
  ];

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

  function syncPreviewScroll(event) {
    const source = event.currentTarget;
    const target = previewScrollRef.current;
    if (!source || !target) return;
    const sourceRange = source.scrollHeight - source.clientHeight;
    const targetRange = target.scrollHeight - target.clientHeight;
    target.scrollTop = sourceRange > 0 ? (source.scrollTop / sourceRange) * Math.max(0, targetRange) : 0;
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
    localStorage.setItem(ADMIN_PAGE_KEY, pageId);
  }

  function handleStartEditingArticle(article) {
    startEditingArticle(article);
    setActiveAdminPage('editor');
  }

  function handleInsertUploadedImage(image) {
    insertImageMarkdown(image.url, image.filename);
    setActiveAdminPage('editor');
  }

  function saveDraftSnapshot(reason = '手动快照') {
    if (!hasArticleDraftContent(articleForm)) {
      setAdminMessage('当前文章还没有可保存的草稿内容');
      return;
    }
    const snapshot = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: articleForm.title || '未命名草稿',
      reason,
      createdAt: new Date().toISOString(),
      wordCount: (articleForm.content || '').trim().length,
      editingArticleId,
      form: { ...articleForm }
    };
    const next = [snapshot, ...draftHistory].slice(0, 12);
    setDraftHistory(next);
    writeStoredJson(ARTICLE_DRAFT_HISTORY_KEY, next);
    setAdminMessage('已保存一份草稿版本');
  }

  function restoreDraftSnapshot(snapshot) {
    Object.entries(snapshot.form || {}).forEach(([field, value]) => updateArticleForm(field, value));
    setAdminMessage(`已恢复草稿版本：${snapshot.title}`);
    openAdminPage('editor');
  }

  function applyWritingTemplate(template) {
    if (!articleForm.title.trim()) updateArticleForm('title', template.title);
    if (!articleForm.summary.trim()) updateArticleForm('summary', template.summary);
    if (!articleForm.category.trim()) updateArticleForm('category', template.category);
    const existingTags = articleForm.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const templateTags = template.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    updateArticleForm('tags', Array.from(new Set([...existingTags, ...templateTags])).join(', '));
    insertContentSnippet(`${articleForm.content.trim() ? '\n\n' : ''}${template.content}`);
    setAdminMessage(`已套用模板：${template.title}`);
  }

  function refreshFrontendErrorLogs() {
    setFrontendErrorLogs(readFrontendErrorLogs());
  }

  function clearFrontendErrorLogs() {
    writeStoredJson(FRONTEND_ERROR_LOG_KEY, []);
    setFrontendErrorLogs([]);
    setAdminMessage('前端错误日志已清空');
  }

  function recordBackup() {
    const record = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      note: backupNote.trim() || '手动备份检查',
      createdAt: new Date().toISOString(),
      items: ['数据库', '上传图片', 'AI 配置', '部署脚本']
    };
    const next = [record, ...backupRecords].slice(0, 16);
    setBackupRecords(next);
    writeStoredJson(BACKUP_CENTER_KEY, next);
    setBackupNote('');
    setAdminMessage('已记录一次备份检查');
  }

  function exportSiteBackup() {
    const createdAt = new Date();
    const payload = {
      meta: {
        siteTitle: profile.siteTitle || "FelixFu's Craft",
        exportedAt: createdAt.toISOString(),
        version: releaseRoadmap[0]?.version || 'unknown'
      },
      profile,
      sitePreferences,
      articles,
      comments,
      reactionCounts,
      musicTracks,
      musicPlaylists,
      toolboxOverrides: readToolboxDefaultOverrides(),
      backupRecords
    };
    const datePart = createdAt.toISOString().slice(0, 10);
    downloadJsonFile(`felixfu-craft-backup-${datePart}.json`, payload);
    setAdminMessage('已导出站点备份 JSON');
  }

  function deleteBackupRecord(recordId) {
    const next = backupRecords.filter((record) => record.id !== recordId);
    setBackupRecords(next);
    writeStoredJson(BACKUP_CENTER_KEY, next);
  }

  function saveCorpusSample() {
    const lines = corpusInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setAdminMessage('至少粘贴两行群聊文本再保存样本');
      return;
    }
    const speakers = Array.from(new Set(
      lines
        .map((line) => line.split(/[:：]/)[0]?.trim())
        .filter((name) => name && name.length <= 12 && !/\d{4}[-/]\d{1,2}/.test(name))
    )).slice(0, 8);
    const anonymized = lines.slice(0, 8).map((line) => {
      let nextLine = line;
      speakers.forEach((speaker, index) => {
        nextLine = nextLine.replaceAll(speaker, `群友${index + 1}`);
      });
      return nextLine;
    });
    const sample = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      lineCount: lines.length,
      speakers,
      preview: anonymized.join('\n'),
      rawText: corpusInput
    };
    const next = [sample, ...botCorpusSamples].slice(0, 12);
    setBotCorpusSamples(next);
    writeStoredJson(BOT_CORPUS_KEY, next);
    setCorpusInput('');
    setAdminMessage('群聊语料样本已保存');
  }

  function deleteCorpusSample(sampleId) {
    const next = botCorpusSamples.filter((sample) => sample.id !== sampleId);
    setBotCorpusSamples(next);
    writeStoredJson(BOT_CORPUS_KEY, next);
  }

  function updateStudyState(updater) {
    setStudyState((current) => {
      const next = updater(current);
      writeStoredJson(STUDY_ASSISTANT_KEY, next);
      return next;
    });
  }

  function toggleStudyTask(taskId) {
    updateStudyState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    }));
  }

  function addStudyTask() {
    const title = studyInput.trim();
    if (!title) return;
    updateStudyState((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title,
          detail: '自定义学习任务',
          done: false
        }
      ]
    }));
    setStudyInput('');
  }

  function resetStudyTasks() {
    const next = createDefaultStudyState();
    setStudyState(next);
    writeStoredJson(STUDY_ASSISTANT_KEY, next);
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

      {adminMessage && <p className="admin-message">{adminMessage}</p>}

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

      {activeAdminPage === 'ops' && (
        <AdminPanelErrorBoundary
          resetKey={activeAdminPage}
          title="运维页暂时打不开"
          onReset={() => openAdminPage('overview')}
        >
          <Suspense fallback={<p className="empty-state">运维面板加载中...</p>}>
            <ProjectOpsPanel authToken={authToken} />
          </Suspense>
        </AdminPanelErrorBoundary>
      )}

      {activeAdminPage === 'releases' && <ReleaseWorkspace />}

      {activeAdminPage === 'overview' && (
        <>
          <section className="admin-panel admin-home-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>今天先看这里</h2>
                <span>常用动作拆开了，不用在一屏里翻到眼花</span>
              </div>
            </div>
            <div className="admin-pulse-grid" aria-label="后台状态速览">
              {adminPulseItems.map((item) => (
                <div className={`admin-pulse-card ${item.tone}`} key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
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
              <button className="ghost-button" type="button" onClick={() => openAdminPage('releases')}>
                <Code2 size={17} />
                <span>版本清单</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('visual')}>
                <Eye size={17} />
                <span>视觉巡检</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('security')}>
                <ShieldCheck size={17} />
                <span>安全日志</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('backups')}>
                <Save size={17} />
                <span>备份中心</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('corpus')}>
                <MessageCircle size={17} />
                <span>群聊语料</span>
              </button>
              <button className="ghost-button" type="button" onClick={() => openAdminPage('study')}>
                <CheckCircle2 size={17} />
                <span>学习助手</span>
              </button>
            </div>
            <div className="admin-site-switch-card">
              <div>
                <strong>暑期计划入口</strong>
                <span>{sitePreferences?.summerPlanVisible ? '当前公开，访客可以从侧边栏进入。' : '当前隐藏，只有管理员能看到和编辑。'}</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={Boolean(sitePreferences?.summerPlanVisible)}
                  disabled={isSavingSitePreferences}
                  onChange={(event) => saveSitePreferences({ summerPlanVisible: event.target.checked })}
                />
                <span>{sitePreferences?.summerPlanVisible ? '公开' : '隐藏'}</span>
              </label>
            </div>
            <form
              className="admin-profile-editor"
              onSubmit={(event) => {
                event.preventDefault();
                saveSiteProfile();
              }}
            >
              <div className="admin-panel-heading compact">
                <div>
                  <h3>公开资料</h3>
                  <span>这里会同步到首页和侧边栏。</span>
                </div>
                <button className="primary-action" type="submit" disabled={isSavingSiteProfile}>
                  <Save size={16} />
                  <span>{isSavingSiteProfile ? '保存中' : '保存资料'}</span>
                </button>
              </div>
              <div className="admin-profile-grid">
                <label>
                  <span>网站名称</span>
                  <input value={profileForm.siteTitle} onChange={(event) => updateProfileForm('siteTitle', event.target.value)} />
                </label>
                <label>
                  <span>展示名</span>
                  <input value={profileForm.name} onChange={(event) => updateProfileForm('name', event.target.value)} />
                </label>
                <label>
                  <span>英文名 / 签名</span>
                  <input value={profileForm.englishName} onChange={(event) => updateProfileForm('englishName', event.target.value)} />
                </label>
                <label>
                  <span>身份标签</span>
                  <input value={profileForm.role} onChange={(event) => updateProfileForm('role', event.target.value)} />
                </label>
                <label>
                  <span>学校 / 归属</span>
                  <input value={profileForm.school} onChange={(event) => updateProfileForm('school', event.target.value)} />
                </label>
                <label>
                  <span>兴趣标签</span>
                  <input value={profileForm.interests} onChange={(event) => updateProfileForm('interests', event.target.value)} placeholder="用顿号或逗号分隔" />
                </label>
              </div>
              <label className="admin-profile-summary">
                <span>自我介绍</span>
                <textarea
                  value={profileForm.summary}
                  onChange={(event) => updateProfileForm('summary', event.target.value)}
                  rows={4}
                />
              </label>
              <div className="admin-profile-preview">
                <strong>{profile.siteTitle || "FelixFu's Craft"}</strong>
                <span>{profile.name || '副将凡'} · {profile.role || '未设置身份标签'}</span>
              </div>
            </form>
            <div className="admin-task-grid">
              {adminTaskItems.map((task) => {
                const Icon = task.icon;
                return (
                  <button
                    className={`admin-task-card ${task.tone}`}
                    key={task.id}
                    type="button"
                    onClick={() => openAdminPage(task.page)}
                  >
                    <span className="admin-task-icon">
                      <Icon size={18} />
                    </span>
                    <span>
                      <strong>{task.title}</strong>
                      <em>{task.detail}</em>
                    </span>
                    <small>{task.action}</small>
                  </button>
                );
              })}
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
          <div>
            <h2>AI 设置和测试</h2>
            <span>保存后写作助手会直接使用真实模型；停用后回到本地模板</span>
          </div>
          <button className="ghost-button" type="button" onClick={refreshAiSettings}>
            <RefreshCw size={16} />
            <span>读取配置</span>
          </button>
        </div>
        <div className={aiSettings?.configured ? 'ai-status ready' : 'ai-status'}>
          <span>{aiSettings?.configured ? '真实模型已启用' : aiSettings?.saved ? 'AI 已保存但未启用' : '真实模型未完整配置'}</span>
          <strong>{aiSettings?.provider || 'local-placeholder'} · {aiSettings?.model || '未配置'}</strong>
          <p>{aiSettings?.note || '密钥不会从接口返回；保存后写作接口会优先使用后台配置。'}</p>
          <small>{aiSettings?.apiKeyConfigured ? `已保存密钥 ${aiSettings.apiKeyTail || ''}` : '未保存密钥'} · {aiSettings?.source || '未配置'}</small>
        </div>
        <form className="ai-config-form" onSubmit={saveAiSettings}>
          <input
            value={aiConfigForm.providerName}
            onChange={(event) => setAiConfigForm((current) => ({ ...current, providerName: event.target.value }))}
            placeholder="Provider 名称"
          />
          <select
            value={aiConfigForm.apiStyle}
            onChange={(event) => setAiConfigForm((current) => ({ ...current, apiStyle: event.target.value }))}
            aria-label="AI 接口类型"
          >
            <option value="openai">OpenAI 兼容</option>
            <option value="codex">Codex 中转</option>
          </select>
          <input
            value={aiConfigForm.baseUrl}
            onChange={(event) => setAiConfigForm((current) => ({ ...current, baseUrl: event.target.value }))}
            placeholder="Base URL，例如 https://api.openai.com/v1 或 Codex 中转地址"
          />
          <input
            value={aiConfigForm.model}
            onChange={(event) => setAiConfigForm((current) => ({ ...current, model: event.target.value }))}
            placeholder="模型名"
          />
          <input
            type="password"
            value={aiConfigForm.apiKey}
            onChange={(event) => setAiConfigForm((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder={aiSettings?.apiKeyConfigured ? '留空表示继续使用已保存密钥' : 'API Key'}
          />
          <input
            type="number"
            min="5"
            max="120"
            value={aiConfigForm.timeout}
            onChange={(event) => setAiConfigForm((current) => ({ ...current, timeout: Number(event.target.value) || 25 }))}
            placeholder="超时秒数"
          />
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={aiConfigForm.enabled}
              onChange={(event) => setAiConfigForm((current) => ({ ...current, enabled: event.target.checked }))}
            />
            <span>启用真实模型</span>
          </label>
          <div className="ai-config-actions">
            <button className="primary-action" type="submit" disabled={isSavingAiSettings}>
              <Save size={17} />
              <span>{isSavingAiSettings ? '保存中' : '保存配置'}</span>
            </button>
            <button className="ghost-button" type="button" onClick={testAiConfigSettings} disabled={isTestingAi}>
              <Bot size={17} />
              <span>{isTestingAi ? '测试中' : '测试当前表单'}</span>
            </button>
            <button className="ghost-button" type="button" onClick={disableAiSettings} disabled={isSavingAiSettings}>
              <X size={17} />
              <span>停用</span>
            </button>
            <button className="danger-button" type="button" onClick={deleteAiSettings} disabled={isSavingAiSettings}>
              <Trash2 size={17} />
              <span>删除配置</span>
            </button>
          </div>
        </form>
        <div className="admin-panel-heading compact-heading">
          <h3>一次性测试</h3>
          <span>只验证，不保存</span>
        </div>
        <form className="ai-test-form" onSubmit={testAiSettings}>
          <input
            value={aiTestForm.providerName}
            onChange={(event) => setAiTestForm((current) => ({ ...current, providerName: event.target.value }))}
            placeholder="Provider 名称"
          />
          <input
            value={aiTestForm.baseUrl}
            onChange={(event) => setAiTestForm((current) => ({ ...current, baseUrl: event.target.value }))}
            placeholder="Base URL"
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

      {activeAdminPage === 'visual' && (
        <section className="admin-panel visual-audit-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>后台视觉巡检</h2>
              <span>把容易漏成白底的控件集中摆在这里，切换日夜间模式就能快速扫一遍</span>
            </div>
            <span className="release-badge">v5.4.5</span>
          </div>

          <div className="visual-audit-grid">
            <article className="visual-audit-card">
              <div className="visual-card-head">
                <Moon size={17} />
                <strong>深色模式重点</strong>
              </div>
              <div className="visual-checklist">
                {['页面大卡片', '输入框和下拉框', '按钮 hover', '提示条', '危险操作按钮'].map((item) => (
                  <span key={item}>
                    <CheckCircle2 size={15} />
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <article className="visual-audit-card">
              <div className="visual-card-head">
                <Sun size={17} />
                <strong>状态色板</strong>
              </div>
              <div className="visual-token-row">
                <span className="visual-swatch accent">强调</span>
                <span className="visual-swatch ready">完成</span>
                <span className="visual-swatch warn">提醒</span>
                <span className="visual-swatch danger">删除</span>
              </div>
            </article>

            <article className="visual-audit-card wide">
              <div className="visual-card-head">
                <FilePenLine size={17} />
                <strong>表单和按钮</strong>
              </div>
              <div className="visual-component-row">
                <input value="示例输入框" readOnly aria-label="视觉巡检输入框" />
                <select defaultValue="published" aria-label="视觉巡检下拉框">
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                </select>
                <button className="primary-action" type="button">
                  <Save size={16} />
                  <span>主操作</span>
                </button>
                <button className="ghost-button" type="button">
                  <RefreshCw size={16} />
                  <span>次操作</span>
                </button>
                <button className="danger-button" type="button">
                  <Trash2 size={16} />
                  <span>危险</span>
                </button>
              </div>
              <p className="admin-message visual-message">提示条示例：如果这里在夜间模式变成刺眼白底，就说明样式又漏了。</p>
            </article>
          </div>
        </section>
      )}

      {activeAdminPage === 'backups' && (
        <section className="admin-panel utility-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>备份中心</h2>
              <span>大改、上线、迁移前先确认数据和配置有退路</span>
            </div>
            <div className="manager-actions">
              <button className="ghost-button" type="button" onClick={exportSiteBackup}>
                <Download size={17} />
                <span>导出 JSON</span>
              </button>
              <button className="primary-action" type="button" onClick={recordBackup}>
                <Save size={17} />
                <span>记录检查</span>
              </button>
            </div>
          </div>
          <div className="release-metric-grid">
            <div className="release-metric">
              <span>备份记录</span>
              <strong>{backupRecords.length}</strong>
            </div>
            <div className="release-metric">
              <span>覆盖范围</span>
              <strong>4 项</strong>
            </div>
            <div className="release-metric">
              <span>最近记录</span>
              <strong>{backupRecords[0] ? new Date(backupRecords[0].createdAt).toLocaleDateString('zh-CN') : '暂无'}</strong>
            </div>
          </div>
          <div className="admin-filter-bar">
            <input
              value={backupNote}
              onChange={(event) => setBackupNote(event.target.value)}
              placeholder="这次备份的备注，例如：v2.6 上线前"
              aria-label="备份备注"
            />
          </div>
          <div className="security-rule-grid">
            {[
              ['数据库', '文章、评论、用户、AI 历史都在这里。'],
              ['上传图片', '封面和正文图片使用 Docker volume 保存。'],
              ['工具箱/友链', '自定义链接和预置覆盖项会随 JSON 一起导出。'],
              ['部署脚本', 'GitHub Actions 和服务器脚本决定上线结果。']
            ].map(([title, detail]) => (
              <article key={title}>
                <strong>{title}</strong>
                <span>{detail}</span>
              </article>
            ))}
          </div>
          <div className="ops-list">
            {backupRecords.length === 0 ? (
              <p className="empty-state">暂无备份记录。真正执行备份仍在服务器脚本里，这里先作为上线前检查账本。</p>
            ) : backupRecords.map((record) => (
              <article className="ops-list-row" key={record.id}>
                <div>
                  <strong>{record.note}</strong>
                  <span>{new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                  <span>{record.items.join('、')}</span>
                </div>
                <button className="ghost-button" type="button" onClick={() => deleteBackupRecord(record.id)}>
                  <X size={16} />
                  <span>删除</span>
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeAdminPage === 'corpus' && (
        <section className="admin-panel utility-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>微信群 bot 语料工作台</h2>
              <span>直接粘贴聊天文本，先做匿名预览和样本整理</span>
            </div>
            <button className="primary-action" type="button" onClick={saveCorpusSample}>
              <Save size={17} />
              <span>保存样本</span>
            </button>
          </div>
          <textarea
            className="corpus-textarea"
            value={corpusInput}
            onChange={(event) => setCorpusInput(event.target.value)}
            rows={8}
            placeholder={'群友A：这东西感觉能做\n群友B：但是它会不会突然跑偏\n群友C：先把语料喂进去看看'}
          />
          <div className="release-metric-grid">
            <div className="release-metric">
              <span>样本组</span>
              <strong>{botCorpusSamples.length}</strong>
            </div>
            <div className="release-metric">
              <span>总行数</span>
              <strong>{botCorpusSamples.reduce((sum, sample) => sum + sample.lineCount, 0)}</strong>
            </div>
            <div className="release-metric">
              <span>下一步</span>
              <strong>风格标签</strong>
            </div>
          </div>
          <div className="ops-list">
            {botCorpusSamples.length === 0 ? (
              <p className="empty-state">暂无语料样本。建议先贴一小段已脱敏聊天，验证 bot 能不能抓到群友跳脱的风格。</p>
            ) : botCorpusSamples.map((sample) => (
              <article className="ops-list-row corpus-row" key={sample.id}>
                <div>
                  <strong>{sample.lineCount} 行 · {sample.speakers.length || '未知'} 位说话人</strong>
                  <span>{new Date(sample.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                  <pre>{sample.preview}</pre>
                </div>
                <button className="ghost-button" type="button" onClick={() => deleteCorpusSample(sample.id)}>
                  <X size={16} />
                  <span>删除</span>
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeAdminPage === 'study' && (
        <section className="admin-panel utility-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>学习助手</h2>
              <span>把暑假学习、科研阅读和项目推进放进同一个每日清单</span>
            </div>
            <button className="ghost-button" type="button" onClick={resetStudyTasks}>
              <RefreshCw size={16} />
              <span>重置默认</span>
            </button>
          </div>
          <div className="release-metric-grid">
            <div className="release-metric">
              <span>今日完成</span>
              <strong>{studyState.tasks.filter((task) => task.done).length} / {studyState.tasks.length}</strong>
            </div>
            <div className="release-metric">
              <span>推荐节奏</span>
              <strong>番茄钟</strong>
            </div>
            <div className="release-metric">
              <span>输出目标</span>
              <strong>可发布笔记</strong>
            </div>
          </div>
          <div className="admin-filter-bar">
            <input
              value={studyInput}
              onChange={(event) => setStudyInput(event.target.value)}
              placeholder="添加今天的新学习任务"
              aria-label="添加学习任务"
            />
            <button className="primary-action" type="button" onClick={addStudyTask}>
              <PlusCircle size={17} />
              <span>添加</span>
            </button>
          </div>
          <div className="study-task-list">
            {studyState.tasks.map((task) => (
              <label className={task.done ? 'study-task done' : 'study-task'} key={task.id}>
                <input type="checkbox" checked={task.done} onChange={() => toggleStudyTask(task.id)} />
                <span>
                  <strong>{task.title}</strong>
                  <em>{task.detail}</em>
                </span>
              </label>
            ))}
          </div>
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

          <div className="admin-panel-heading compact-heading">
            <div>
              <h3>前端错误日志</h3>
              <span>页面卡住后会记录到浏览器本地，方便回后台定位</span>
            </div>
            <div className="manager-actions">
              <button className="ghost-button" type="button" onClick={refreshFrontendErrorLogs}>
                <RefreshCw size={16} />
                <span>读取</span>
              </button>
              <button className="ghost-button" type="button" onClick={clearFrontendErrorLogs}>
                <X size={16} />
                <span>清空</span>
              </button>
            </div>
          </div>
          <div className="ops-list">
            {frontendErrorLogs.length === 0 ? (
              <p className="empty-state">暂无前端错误记录</p>
            ) : frontendErrorLogs.map((errorLog) => (
              <article className="ops-list-row" key={errorLog.id || errorLog.createdAt}>
                <div>
                  <strong>{errorLog.message || '未知错误'}</strong>
                  <span>{new Date(errorLog.createdAt).toLocaleString('zh-CN', { hour12: false })} · {errorLog.url || '当前页面'}</span>
                  {errorLog.componentStack && <span>{String(errorLog.componentStack).split('\n').filter(Boolean)[0]}</span>}
                </div>
                <code>frontend</code>
              </article>
            ))}
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
      <div className={activeAdminPage === 'editor' ? 'admin-layout editor-layout' : 'admin-layout admin-layout-single'}>
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

          <section className="mini-workbench">
            <div className="admin-panel-heading compact-heading">
              <div>
                <h3>写作模板库</h3>
                <span>先铺结构，再慢慢填内容</span>
              </div>
              <button className="ghost-button" type="button" onClick={() => saveDraftSnapshot('套模板前快照')}>
                <Save size={16} />
                <span>保存快照</span>
              </button>
            </div>
            <div className="template-grid">
              {writingTemplates.map((template) => (
                <button className="template-card" key={template.id} type="button" onClick={() => applyWritingTemplate(template)}>
                  <strong>{template.title}</strong>
                  <span>{template.summary}</span>
                  <small>{template.category}</small>
                </button>
              ))}
            </div>
          </section>

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

          <section className="editor-compose-block" aria-label="正文编辑和预览">
            <div className="editor-compose-heading">
              <span>正文</span>
              <em>Markdown / LaTeX 实时预览</em>
            </div>
            <div className="editor-compose-grid">
              <div className="editor-source-pane">
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
                  <button type="button" title="待办" onClick={() => insertIntoContent('- [ ] ', '', '待办事项')}>
                    <CheckCircle2 size={16} />
                  </button>
                  <button type="button" title="引用" onClick={() => insertIntoContent('> ', '', '引用内容')}>
                    <Quote size={16} />
                  </button>
                  <button type="button" title="删除线" onClick={() => insertIntoContent('~~', '~~', '删除线文字')}>
                    <span>~~</span>
                  </button>
                  <button type="button" title="分割线" onClick={() => insertIntoContent('\n---\n', '', '')}>
                    <span>—</span>
                  </button>
                  <button type="button" title="代码块" onClick={() => insertIntoContent('```js\n', '\n```', 'console.log("Hello Felix")')}>
                    <Code2 size={16} />
                  </button>
                  <button type="button" title="公式" onClick={() => insertIntoContent('\n$$\n', '\n$$\n', 'E = mc^2')}>
                    <Sigma size={16} />
                  </button>
                  <button type="button" title="Callout" onClick={() => insertIntoContent('\n> [!NOTE] 提醒\n> ', '', '这里写提示内容')}>
                    <CircleHelp size={16} />
                  </button>
                  <button type="button" title="Wiki 双链" onClick={() => insertIntoContent('[[', ']]', '相关笔记')}>
                    <BookOpen size={16} />
                  </button>
                  <button type="button" title="Mermaid 图表" onClick={() => insertIntoContent('```mermaid\ngraph TD\n  A[开始] --> B[结束]', '\n```', '')}>
                    <Code2 size={16} />
                  </button>
                </div>
                <textarea
                  ref={contentTextareaRef}
                  value={articleForm.content}
                  onChange={(event) => updateArticleForm('content', event.target.value)}
                  onScroll={syncPreviewScroll}
                  placeholder="在这里写 Markdown，右侧会像 VS Code 预览一样同步显示"
                  rows={18}
                  required
                />
              </div>
              <section className="article-preview-panel editor-inline-preview" aria-label="正文预览">
                <div className="admin-panel-heading">
                  <h3>正文预览</h3>
                  <span>跟随正文</span>
                </div>
                <div className="editor-preview-scroll" ref={previewScrollRef}>
                  {deferredArticleContent.trim() ? (
                    <MarkdownContent content={deferredArticleContent} title={articleForm.title || '文章预览'} />
                  ) : (
                    <p className="empty-state">左侧开始写正文后，这里会实时预览。</p>
                  )}
                </div>
              </section>
            </div>
          </section>

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
              <span>笔记合集</span>
              <input
                value={articleForm.noteCollection}
                onChange={(event) => updateArticleForm('noteCollection', event.target.value)}
                placeholder="X-lab 软件团队学习笔记"
              />
            </label>
            <label>
              <span>目录路径</span>
              <input
                value={articleForm.notePath}
                onChange={(event) => updateArticleForm('notePath', event.target.value)}
                placeholder="算法相关/高级数据结构与算法分析/Heaps"
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
                value={estimateReadingTime(articleForm.content)}
                readOnly
                disabled
                aria-label="按正文自动计算的预计阅读时长"
              />
            </label>
            <label>
              <span>创建时间</span>
              <input value={formatArticleTimestamp(articleForm.createdAt)} readOnly disabled />
            </label>
            <label>
              <span>最后修改</span>
              <input value={formatArticleTimestamp(articleForm.updatedAt)} readOnly disabled />
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
            <label className="pin-switch-control">
              <input
                type="checkbox"
                checked={articleForm.pinned}
                onChange={(event) => updateArticleForm('pinned', event.target.checked)}
              />
              <span aria-hidden="true" />
              <strong>{articleForm.pinned ? '已置顶' : '普通文章'}</strong>
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

        {activeAdminPage === 'notes' && (
        <section className="admin-panel note-import-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>笔记上传</h2>
              <span>导入 Markdown，图片会跟着变成文章里的内嵌资源</span>
            </div>
            <button className="ghost-button" type="button" onClick={() => openAdminPage('editor')}>
              <FilePenLine size={17} />
              <span>去写作台</span>
            </button>
          </div>

          <div className="note-import-grid">
            <label className="note-import-card">
              <BookOpen size={24} />
              <strong>上传单篇 .md</strong>
              <span>适合已经整理好的单篇课程笔记或项目文档。</span>
              <input
                type="file"
                accept=".md,text/markdown,text/plain"
                disabled={isImportingNoteFiles}
                onChange={async (event) => {
                  const ok = await importNoteFiles(event.target.files);
                  event.target.value = '';
                  if (ok) openAdminPage('editor');
                }}
              />
            </label>

            <label className="note-import-card">
              <ImageIcon size={24} />
              <strong>选择笔记文件夹</strong>
              <span>一次选择 .md 和 images 里的图片，相对路径会自动改写。</span>
              <input
                type="file"
                multiple
                webkitdirectory="true"
                disabled={isImportingNoteFiles}
                onChange={async (event) => {
                  const ok = await importNoteFiles(event.target.files);
                  event.target.value = '';
                  if (ok) openAdminPage('editor');
                }}
              />
            </label>
          </div>

          <div className="security-rule-grid">
            <article>
              <strong>推荐目录</strong>
              <span>一个文件夹里放一篇 .md，图片放在 images/ 或 assets/ 下。</span>
            </article>
            <article>
              <strong>导入结果</strong>
              <span>会先生成草稿，不会直接发布，方便你预览和微调。</span>
            </article>
            <article>
              <strong>图片管理</strong>
              <span>图片作为文章/笔记的一部分上传，不再单独占一个后台入口。</span>
            </article>
          </div>
        </section>
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

          <div className="manager-bulk-bar">
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={isAllManagerArticlesSelected}
                disabled={filteredManagerArticles.length === 0}
                onChange={toggleAllManagerArticles}
              />
              <span>选择当前筛选结果</span>
            </label>
            <strong>{selectedManagerArticles.length} 篇已选</strong>
            <div className="manager-actions">
              <button type="button" onClick={() => runManagerBulkAction('published')} disabled={!selectedManagerArticles.length || isSavingArticle}>
                <CheckCircle2 size={16} />
                <span>批量发布</span>
              </button>
              <button type="button" onClick={() => runManagerBulkAction('draft')} disabled={!selectedManagerArticles.length || isSavingArticle}>
                <FilePenLine size={16} />
                <span>转为草稿</span>
              </button>
              <button className="danger-button" type="button" onClick={() => runManagerBulkAction('delete')} disabled={!selectedManagerArticles.length || isSavingArticle}>
                <Trash2 size={16} />
                <span>批量删除</span>
              </button>
            </div>
          </div>

          <div className="manager-collect-bar">
            <div>
              <strong>收纳笔记</strong>
              <span>把选中的内容放进对应合集和目录路径。</span>
            </div>
            <input
              value={managerCollectionDraft}
              onChange={(event) => setManagerCollectionDraft(event.target.value)}
              placeholder="合集，比如 X-lab 软件团队学习笔记"
              aria-label="笔记合集"
            />
            <input
              value={managerPathDraft}
              onChange={(event) => setManagerPathDraft(event.target.value)}
              placeholder="目录路径，比如 React / Hooks"
              aria-label="笔记目录路径"
            />
            <button type="button" onClick={runManagerCollectAction} disabled={!selectedManagerArticles.length || isSavingArticle}>
              <BookOpen size={16} />
              <span>收纳所选</span>
            </button>
          </div>

          <div className="manager-list">
            {filteredManagerArticles.length === 0 ? (
              <p className="empty-state">没有符合条件的文章</p>
            ) : (
              <div className="content-library-shell">
                <aside className="content-library-tree" aria-label="内容目录">
                  <div className="content-library-tree-head">
                    <BookOpen size={17} />
                    <strong>内容目录</strong>
                  </div>
                  <div className="content-library-stats">
                    <span>{articleExplorerStats.folderCount} 个目录</span>
                    <span>{articleExplorerStats.draftVisibleCount} 篇草稿</span>
                    <span>{articleExplorerStats.uncollectedCount} 篇未收纳</span>
                  </div>
                  {articleExplorerGroups.map((group) => (
                    <div className="content-library-tree-group" key={group.key}>
                      <span>{group.section}</span>
                      <button type="button" onClick={() => setArticleManagerQuery(group.folder)}>
                        <BookOpen size={14} />
                        <strong>{group.folder}</strong>
                        <em>{group.articles.length}</em>
                      </button>
                      <div className="content-library-tree-items">
                        {group.articles.slice(0, 5).map((article) => (
                          <button
                            type="button"
                            key={article.id}
                            onClick={() => {
                              setArticleManagerQuery(article.title);
                              setSelectedManagerArticleIds([article.id]);
                            }}
                          >
                            <FilePenLine size={13} />
                            <span>{article.title}</span>
                          </button>
                        ))}
                        {group.articles.length > 5 && <small>还有 {group.articles.length - 5} 篇</small>}
                      </div>
                    </div>
                  ))}
                </aside>

                <div className="content-library-table" role="table" aria-label="文章和笔记列表">
                  <div className="content-library-header" role="row">
                    <span>排序</span>
                    <span>标题</span>
                    <span>目录</span>
                    <span>状态</span>
                    <span>最后修改</span>
                    <span>操作</span>
                  </div>
                  {filteredManagerArticles.map((article, index) => (
                    <article
                      className={[
                        'content-library-row',
                        draggingArticleId === article.id ? 'dragging' : '',
                        dragOverArticleId === article.id && draggingArticleId !== article.id ? 'drag-over' : ''
                      ].filter(Boolean).join(' ')}
                      key={article.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggingArticleId(article.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', article.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setDragOverArticleId(article.id);
                      }}
                      onDragLeave={() => {
                        setDragOverArticleId((current) => (current === article.id ? null : current));
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        dropArticleOnTarget(article.id);
                      }}
                      onDragEnd={() => {
                        setDraggingArticleId(null);
                        setDragOverArticleId(null);
                      }}
                      role="row"
                    >
                      <div className="content-library-order" role="cell" title="拖动这一行调整顺序">
                        <GripVertical size={16} />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="content-library-title" role="cell">
                        <label className="manager-select-box" aria-label={`选择 ${article.title}`}>
                          <input
                            type="checkbox"
                            checked={selectedManagerArticleIds.includes(article.id)}
                            onChange={() => toggleManagerArticleSelection(article.id)}
                          />
                        </label>
                        <div>
                          <strong>{article.title}</strong>
                          <small>{article.summary || '暂无摘要'}</small>
                        </div>
                      </div>
                      <span role="cell">{isTechnicalArticle(article) ? [article.noteCollection, article.notePath].filter(Boolean).join(' / ') || '未收纳笔记' : article.category || '未分类'}</span>
                      <span role="cell" className={article.status === 'draft' ? 'status-badge draft' : 'status-badge'}>{article.status === 'draft' ? '草稿' : '已发布'}</span>
                      <span role="cell">{formatArticleTimestamp(article.updatedAt, article.createdAt || article.date || '未知')}</span>
                      <div className="manager-actions" role="cell">
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
              </div>
            )}
          </div>
        </section>
        )}

        {activeAdminPage === 'editor' && (
        <aside className="editor-side-stack">
          <section className="admin-panel draft-history-panel">
            <div className="admin-panel-heading compact-heading">
              <h3>草稿版本历史</h3>
              <span>{draftHistory.length} 份</span>
            </div>
            {draftHistory.length === 0 ? (
              <p className="empty-state">可以在写作模板区手动保存快照</p>
            ) : (
              <div className="ai-history-list">
                {draftHistory.map((snapshot) => (
                  <article className="ai-history-item" key={snapshot.id}>
                    <div>
                      <strong>{snapshot.title}</strong>
                      <span>{snapshot.reason} · {snapshot.wordCount} 字 · {new Date(snapshot.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                    </div>
                    <button className="ghost-button" type="button" onClick={() => restoreDraftSnapshot(snapshot)}>
                      <RefreshCw size={16} />
                      <span>恢复</span>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
        )}

        {activeAdminPage === 'toolbox' && (
          <ToolboxWorkspace currentUser={currentUser} authToken={authToken} manageOnly />
        )}

        {activeAdminPage === 'music' && (
        <section className="admin-panel music-manager">
          <div className="admin-panel-heading">
            <div>
              <h2>音乐管理</h2>
              <span>{isLoadingMusicTracks ? '加载中' : `${musicTracks.length} 首`}</span>
            </div>
            <button type="button" onClick={refreshMusicTracks}>
              <RefreshCw size={17} />
              <span>刷新</span>
            </button>
          </div>

          <label className="file-upload-control">
            <Music size={17} />
            <span>{isUploadingMusic ? '上传中' : '上传音乐'}</span>
            <input
              type="file"
              accept=".mp3,.wav,.ogg,.flac,.m4a,.aac,audio/*"
              disabled={isUploadingMusic}
              onChange={(event) => {
                uploadMusicTrack(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>

          <div className="music-admin-list">
            {musicTracks.length === 0 ? (
              <p className="empty-state">暂无音乐。上传后会出现在前台“音乐”页面。</p>
            ) : (
              musicTracks.map((track) => (
                <article className="music-admin-row" key={track.filename}>
                  <div>
                    <strong>{track.title}</strong>
                    <span>{track.filename} · {formatFileSize(track.size)} · {formatArticleTimestamp(track.createdAt, '未知时间')}</span>
                    <span>{track.coverUrl ? '已上传封面' : '未上传封面'} · {track.lyricsUrl ? '已上传歌词' : '未上传歌词'}</span>
                  </div>
                  <audio controls preload="none" src={track.url}>
                    当前浏览器不支持音频播放。
                  </audio>
                  <div className="music-admin-sidecar-actions">
                    <label className="file-upload-control compact-upload">
                      <ImageIcon size={15} />
                      <span>封面</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(event) => {
                          uploadMusicCover(track, event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                    </label>
                    <label className="file-upload-control compact-upload">
                      <FilePenLine size={15} />
                      <span>歌词</span>
                      <input
                        type="file"
                        accept=".lrc,.txt,text/plain"
                        onChange={(event) => {
                          uploadMusicLyrics(track, event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <button className="danger-button" type="button" onClick={() => deleteMusicTrack(track)}>
                    <Trash2 size={16} />
                    <span>删除</span>
                  </button>
                </article>
              ))
            )}
          </div>
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

          <p className="comment-manager-note">评论后台只保留查看和删除；正常评论会直接显示，不再走复杂筛选和审核流程。</p>

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

function IconToggle({ active, label, count, icon: Icon, onClick, tone = 'default' }) {
  return (
    <button className={active ? 'icon-toggle active' : 'icon-toggle'} type="button" onClick={onClick} title={label} data-tone={tone}>
      <Icon size={17} />
      <span>{label} <strong>{count}</strong></span>
    </button>
  );
}

export default App;
