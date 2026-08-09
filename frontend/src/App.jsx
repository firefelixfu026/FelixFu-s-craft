import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import ProjectOpsPanel from './ProjectOpsPanel.jsx';

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
const THEME_KEY = 'felix_blog_theme';
const SIDEBAR_COLLAPSED_KEY = 'felix_blog_sidebar_collapsed';
const AUTH_FAIL_STATE_KEY = 'felix_blog_auth_fail_state';
const SITE_LAUNCH_DATE = '2026-07-22T00:00:00+08:00';
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
  const publicViews = new Set(['overview', 'articles', 'plan', 'music', 'game', 'login', 'account', 'admin']);
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
  const knownPages = new Set(['overview', 'ops', 'releases', 'editor', 'notes', 'articles', 'music', 'comments', 'security']);
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
const RELEASE_PAGE_SIZE = 6;

const toolboxCategories = ['全部', '学习', '开发', 'AI', '设计素材', '效率', '娱乐生活'];

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
  return ['title', 'summary', 'content', 'coverUrl', 'tags'].some((field) => form[field]?.trim());
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
    article.title || '',
    article.summary || '',
    ...(article.tags || [])
  ].join(' ');
  return TECH_NOTE_KEYWORDS.some((keyword) => haystack.toLowerCase().includes(keyword.toLowerCase()));
}

function getArticleSection(article) {
  return isTechnicalArticle(article) ? 'notes' : 'essays';
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
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
  const [activeView, setActiveView] = useState(readStoredActiveView);
  const [theme, setTheme] = useState(readStoredTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readStoredSidebarCollapsed);
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
  const [comments, setComments] = useState({});
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
  const [isImportingNoteFiles, setIsImportingNoteFiles] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isLoadingUploadedImages, setIsLoadingUploadedImages] = useState(false);
  const [musicTracks, setMusicTracks] = useState([]);
  const [isLoadingMusicTracks, setIsLoadingMusicTracks] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicPlaylists, setMusicPlaylists] = useState(readStoredMusicPlaylists);
  const [selectedMusicPlaylistId, setSelectedMusicPlaylistId] = useState('all');
  const [musicCurrentFilename, setMusicCurrentFilename] = useState('');
  const [musicIsPlaying, setMusicIsPlaying] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicRepeatMode, setMusicRepeatMode] = useState('list');
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
  const ThemeIcon = theme === 'dark' ? Moon : Sun;
  const nextThemeLabel = theme === 'dark' ? '日间模式' : '夜间模式';
  const SidebarToggleIcon = isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose;
  const globalAudioRef = useRef(null);

  const visibleNavItems = useMemo(() => {
    if (!currentUser) {
      return visitorNavItems;
    }

    if (currentUser.role === 'admin') {
      return [...readerNavItems, accountNavItem, adminNavItem];
    }

    return [...readerNavItems, accountNavItem];
  }, [currentUser?.role]);

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

  function persistMusicPlaylists(nextPlaylists) {
    setMusicPlaylists(nextPlaylists);
    writeStoredJson(MUSIC_PLAYLISTS_KEY, nextPlaylists);
  }

  function playMusicTrack(track, playlistId = selectedMusicPlaylistId) {
    if (!track) return;
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

  useEffect(() => {
    localStorage.setItem(ACTIVE_VIEW_KEY, activeView);
  }, [activeView]);

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

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  }

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
        await refreshMusicTracks();
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
      persistAuthSession(token);
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
      if (!['overview', 'articles', 'plan', 'music', 'game', 'login'].includes(activeView)) {
        setActiveView('overview');
      }
      return;
    }

    if (activeView === 'admin' && currentUser.role !== 'admin') {
      setActiveView('overview');
      return;
    }

    if (activeView === 'ai') {
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
      setActiveView(result.user?.role === 'admin' ? 'admin' : 'articles');
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
      const estimatedMinutes = Math.max(2, Math.ceil(content.replace(/[#>*_`[\]()!-]/g, '').length / 500));

      setEditingArticleId(null);
      setArticleForm({
        ...createEmptyArticleForm(),
        title,
        summary,
        content,
        tags: '技术笔记, Markdown',
        category: '技术笔记',
        readTime: `${estimatedMinutes} min`,
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
      readTime: article.readTime,
      createdAt: article.createdAt || '',
      updatedAt: article.updatedAt || '',
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
          <img className="brand-mark" src="/avatar.jpg" alt="付江樊头像" />
          <div className="brand-text">
            <strong>{profile.name}</strong>
            <span>{profile.englishName}</span>
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
                onClick={() => setActiveView(item.id)}
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
              <button className="icon-text-button" type="button" onClick={() => setActiveView('login')} title="登录" aria-label="登录">
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
            openMusic={() => setActiveView('music')}
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
            query={query}
            searchMeta={searchMeta}
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
            isPlaying={musicIsPlaying}
            progress={musicProgress}
            duration={musicDuration}
            repeatMode={musicRepeatMode}
            setRepeatMode={setMusicRepeatMode}
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
            playTrack={playMusicTrack}
            togglePlayback={toggleMusicPlayback}
            stepTrack={stepMusicTrack}
            seekTrack={seekMusicTrack}
          />
        )}

        {activeView === 'plan' && <SummerPlanWorkspace currentUser={currentUser} authToken={authToken} />}

        {activeView === 'toolbox' && <ToolboxWorkspace currentUser={currentUser} authToken={authToken} />}

        {activeView === 'account' && currentUser && (
          <AccountWorkspace
            currentUser={currentUser}
            accountActivity={accountActivity}
            refreshAccountActivity={refreshAccountActivity}
            setActiveView={setActiveView}
            logout={logout}
            openArticle={(articleId) => {
              setActiveView('articles');
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
            deleteMusicTrack={deleteMusicTrack}
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
            approveAdminCommentsBulk={approveAdminCommentsBulk}
            deleteAdminComment={deleteAdminComment}
            currentUser={currentUser}
            authToken={authToken}
            logout={logout}
          />
        )}
      </main>
    </div>
  );
}

function Overview({ profile, articles, setActiveView, currentUser }) {
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

  const skillPillars = [
    {
      title: 'Web 全栈',
      detail: 'React、FastAPI、PostgreSQL、Docker，把想法快速接成可访问的网站。',
      level: '70%',
      icon: Code2
    },
    {
      title: 'AI 工作流',
      detail: '把模型能力接到写作、学习助手、群聊语料和自动化工具里。',
      level: '62%',
      icon: Bot
    },
    {
      title: '部署运维',
      detail: '服务器续费、快照备份、日志排查、域名绑定和线上发布都纳入后台。',
      level: '58%',
      icon: ShieldCheck
    }
  ];

  const roadmapItems = [
    { stage: 'Now', title: '把个人博客打磨成稳定工作台', detail: '内容、评论、后台、备份和 AI 配置已经形成基本闭环。' },
    { stage: 'Next', title: '沉淀学习助手和微信群 bot 语料', detail: '把暑期学习、课程笔记和群聊文本变成可检索、可总结的数据。' },
    { stage: 'Later', title: '做更多可展示的小项目', detail: '管理工具、游戏、科研辅助和安全练习都可以接到同一个主页。' }
  ];
  const storyTimeline = [
    {
      stage: '01',
      title: '从课程和笔记开始',
      detail: '把 React、后端、网络基础和旧笔记整理成可检索的文章库，让学习过程留下痕迹。',
      signal: '内容沉淀'
    },
    {
      stage: '02',
      title: '把站点做成自己的工具箱',
      detail: '后台、图片管理、评论审核、备份中心、运维状态和版本清单都接进同一套界面。',
      signal: '工程闭环'
    },
    {
      stage: '03',
      title: '继续接入 AI 和自动化',
      detail: '让写作辅助、学习助手和群聊语料逐步变成能复盘、能问答、能帮忙推进项目的系统。',
      signal: 'AI 工作流'
    }
  ];
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
    { label: '阅读记录', value: `${totalViews} 次`, detail: '来自文章详情页' },
    { label: '评论互动', value: `${totalComments} 条`, detail: currentUser ? '已登录可参与' : 'GitHub 登录后可评论' }
  ];

  const capabilityCards = [
    {
      title: '文章系统',
      summary: '支持 Markdown、LaTeX、图片上传、封面图、标签筛选、评论审核和阅读统计。',
      action: '浏览文章',
      view: 'articles',
      icon: BookOpen
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
  const projectHighlights = [
    {
      title: '个人博客工作台',
      detail: '从内容发布到评论审核、版本记录、备份和线上部署，已经跑通一个完整的小型全栈产品。',
      meta: `${publishedArticles.length} 篇公开文章`,
      view: 'articles',
      icon: BookOpen
    },
    {
      title: '暑期计划控制台',
      detail: '时间段计划、完成记录、应用使用、睡眠饮食和记账都集中在同一个页面里。',
      meta: '8月4日 - 8月15日',
      view: 'plan',
      icon: List
    },
    {
      title: '运维和备份面板',
      detail: '把健康检查、容器状态、备份记录和版本路线放进后台，让网站不是一次性作品。',
      meta: `v${releaseRoadmap[0].version.replace(/^v/, '')}`,
      view: currentUser?.role === 'admin' ? 'admin' : 'overview',
      icon: ShieldCheck
    }
  ];
  const explorationCards = [
    { label: '正在学', value: 'Web 全栈、网络基础、AI 工具链' },
    { label: '正在做', value: '把博客升级成个人作品集和学习控制台' },
    { label: '接下来', value: '评论体验、站内副驾驶、更多可展示项目' }
  ];
  const recentArticles = [...articles].slice(0, 3);
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
            你好，我是
            <span className="gradient-text">{profile.name}</span>
          </h1>
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
            <button className="ghost-button" type="button" onClick={() => setActiveView('plan')}>
              <List size={17} />
              <span>看学习计划</span>
            </button>
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
          <div className="home-update-list">
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

      <section className="content-band live-status-band">
        <div className="section-heading">
          <p className="eyebrow">现在</p>
          <h2>这个站点正在发生什么</h2>
        </div>
        <div className="live-status-grid">
          {liveStats.map((item) => (
            <article className="live-status-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        {recentArticle && (
          <button className="latest-article-strip" type="button" onClick={() => setActiveView('articles')}>
            <span>最近更新</span>
            <strong>{recentArticle.title}</strong>
            <em>{recentArticle.date}</em>
          </button>
        )}
      </section>

      <section className="content-band personal-story-band">
        <div className="section-heading">
          <p className="eyebrow">故事线</p>
          <h2>这个主页不只是入口，也是学习路线图</h2>
        </div>
        <div className="story-layout">
          <div className="story-timeline">
            {storyTimeline.map((item) => (
              <article className="story-step" key={item.stage}>
                <span>{item.stage}</span>
                <div>
                  <strong>{item.signal}</strong>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="exploration-panel">
            <p className="eyebrow">当前探索</p>
            {explorationCards.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <p className="eyebrow">技能树</p>
          <h2>正在点亮的方向</h2>
        </div>
        <div className="skill-pillar-grid">
          {skillPillars.map((skill) => {
            const Icon = skill.icon;
            return (
              <article className="skill-pillar-card" key={skill.title}>
                <div className="skill-pillar-heading">
                  <Icon size={20} />
                  <div>
                    <h3>{skill.title}</h3>
                    <span>{skill.level}</span>
                  </div>
                </div>
                <p>{skill.detail}</p>
                <div className="skill-meter" aria-label={`${skill.title} 当前进度 ${skill.level}`}>
                  <span style={{ width: skill.level }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-band project-showcase-band">
        <div className="section-heading">
          <p className="eyebrow">作品墙</p>
          <h2>已经能拿出来讲的东西</h2>
        </div>
        <div className="project-showcase-grid">
          {projectHighlights.map((project) => {
            const Icon = project.icon;
            return (
              <button className="project-showcase-card" type="button" key={project.title} onClick={() => setActiveView(project.view)}>
                <Icon size={20} />
                <span>{project.meta}</span>
                <strong>{project.title}</strong>
                <p>{project.detail}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <p className="eyebrow">项目入口</p>
          <h2>主页连接到正在生长的作品</h2>
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
          <p className="eyebrow">路线</p>
          <h2>下一段迭代怎么走</h2>
        </div>
        <div className="roadmap-list">
          {roadmapItems.map((item) => (
            <article className="roadmap-item" key={item.stage}>
              <span>{item.stage}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
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
  searchMeta = parseSearchQuery('')
}) {
  const selectedArticle = articles.find((article) => article.id === selectedArticleId) || null;
  const [articleSection, setArticleSection] = useState('essays');
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
        onBack={() => setSelectedArticleId(null)}
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
          onClick={() => {
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
          onClick={() => {
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
  const grouped = articles.reduce((groups, article) => {
    const key = article.category || '技术笔记';
    groups[key] = groups[key] || [];
    groups[key].push(article);
    return groups;
  }, {});

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
        {Object.entries(grouped).map(([category, group]) => (
          <div className="note-tree-group" key={category}>
            <strong>{category}</strong>
            {group.map((item) => (
              <button
                className={item.id === activeArticleId ? 'active' : ''}
                key={item.id}
                type="button"
                onClick={() => openArticle(item.id)}
              >
                <span>{item.title}</span>
                <em>{item.readTime}</em>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
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

function SummerPlanWorkspace({ currentUser, authToken }) {
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

      <div className="summer-module-grid">
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

        <PlanModule title="体重与状态" count={`${plan.bodyMetrics.length} 条`} wide>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('bodyMetrics', { date: '8月4日', weight: '', exercise: '', mood: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增记录</span>
          </button>
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

        <PlanModule title="睡眠记录" count={`${plan.sleep.length} 条`} wide>
          <button className="ghost-button module-add-button" type="button" onClick={() => addRow('sleep', { date: '8月4-5日', bed: '', wake: '', hours: '', quality: '' })} disabled={!canEdit}>
            <PlusCircle size={16} />
            <span>新增睡眠</span>
          </button>
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
    description: '',
    tags: '',
    pinned: false
  };
}

function normalizeToolboxLink(link, index = 0) {
  return {
    ...link,
    id: link.id ?? `default-${index}`,
    tags: Array.isArray(link.tags) ? link.tags : [],
    custom: Boolean(link.custom)
  };
}

function ToolboxWorkspace({ currentUser, authToken }) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [toolboxQuery, setToolboxQuery] = useState('');
  const [customLinks, setCustomLinks] = useState([]);
  const [toolboxForm, setToolboxForm] = useState(createEmptyToolboxForm);
  const [editingToolboxLinkId, setEditingToolboxLinkId] = useState(null);
  const [toolboxMessage, setToolboxMessage] = useState('');
  const [isLoadingToolboxLinks, setIsLoadingToolboxLinks] = useState(false);
  const [isSavingToolboxLink, setIsSavingToolboxLink] = useState(false);
  const canManageToolbox = currentUser?.role === 'admin';
  const allToolboxLinks = [
    ...customLinks.map((link) => ({ ...normalizeToolboxLink(link), custom: true })),
    ...defaultToolboxLinks.map((link, index) => normalizeToolboxLink(link, index))
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
  const featuredLinks = allToolboxLinks
    .filter((link) => link.pinned || ['OI Wiki', 'MDN Web Docs', 'ChatGPT', 'Excalidraw'].includes(link.title))
    .slice(0, 6);

  useEffect(() => {
    refreshToolboxLinks();
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

  function updateToolboxForm(field, value) {
    setToolboxForm((current) => ({ ...current, [field]: value }));
  }

  function resetToolboxForm(message = '') {
    setToolboxForm(createEmptyToolboxForm());
    setEditingToolboxLinkId(null);
    setToolboxMessage(message);
  }

  function startEditingToolboxLink(link) {
    setEditingToolboxLinkId(link.id);
    setToolboxForm({
      title: link.title || '',
      category: link.category || '自定义',
      url: link.url || '',
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
    if (!canManageToolbox || !authToken || !link.custom) return;
    if (!window.confirm(`确定删除工具箱链接：${link.title}？`)) return;
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

  return (
    <section className="workspace toolbox-workspace">
      <div className="section-heading">
        <p className="eyebrow">工具箱</p>
        <h1>常用网站、学习资源和摸鱼入口</h1>
        <p>把好用的网站集中放在这里，需要查资料、写代码、做图或者记录番剧时不用到处翻收藏夹。</p>
      </div>

      <div className="content-band toolbox-hero">
        <div>
          <span>Felix Links</span>
          <h2>今天要去哪里？</h2>
          <p>先从高频入口开始，登录管理员后可以继续把课程、项目、娱乐和生活服务都整理进来。</p>
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

      {canManageToolbox && (
        <form className="toolbox-editor" onSubmit={submitToolboxLink}>
          <div className="admin-panel-heading compact-heading">
            <div>
              <h3>{editingToolboxLinkId ? '编辑自定义网址' : '添加自定义网址'}</h3>
              <span>{isLoadingToolboxLinks ? '正在同步链接' : `${customLinks.length} 个自定义链接`}</span>
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
              <input value={toolboxForm.category} onChange={(event) => updateToolboxForm('category', event.target.value)} placeholder="学习 / 开发 / 自定义" />
            </label>
            <label className="wide">
              <span>网址</span>
              <input value={toolboxForm.url} onChange={(event) => updateToolboxForm('url', event.target.value)} placeholder="https://example.com" />
            </label>
            <label className="wide">
              <span>用途说明</span>
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
          </div>
          {toolboxMessage && <p className="admin-message">{toolboxMessage}</p>}
        </form>
      )}

      <div className="toolbox-grid">
        {filteredLinks.map((link) => (
          <article className={link.custom ? 'toolbox-card custom' : 'toolbox-card'} key={`${link.custom ? 'custom' : 'default'}-${link.id || link.url}`}>
            <span className="toolbox-card-category">{link.category}</span>
            <div>
              <h2>{link.title}</h2>
              <a href={link.url} target="_blank" rel="noreferrer" aria-label={`打开 ${link.title}`}>
                <ExternalLink size={17} />
              </a>
            </div>
            <p>{link.description}</p>
            <span className="toolbox-url">{new URL(link.url).hostname.replace(/^www\./, '')}</span>
            <div className="toolbox-tags">
              {link.custom && <span>自定义</span>}
              {link.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            {canManageToolbox && link.custom && (
              <div className="toolbox-card-actions">
                <button type="button" onClick={() => startEditingToolboxLink(link)}>
                  <PencilLine size={16} />
                  <span>编辑</span>
                </button>
                <button className="danger-button" type="button" onClick={() => deleteToolboxLink(link)}>
                  <Trash2 size={16} />
                  <span>删除</span>
                </button>
              </div>
            )}
          </article>
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

function SidebarMusicPlayer({ track, isPlaying, progress, duration, togglePlayback, stepTrack, seekTrack, openMusic }) {
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const safeProgress = safeDuration ? Math.min(safeDuration, Math.max(0, progress)) : 0;
  return (
    <div className={isPlaying ? 'sidebar-music-player playing' : 'sidebar-music-player'}>
      <button className="sidebar-music-main" type="button" onClick={openMusic} title="打开音乐">
        <span className="sidebar-music-disc">
          <Music size={18} />
        </span>
        <span>
          <strong>{track?.title || 'Felix Music'}</strong>
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

function MusicWorkspace({
  tracks,
  queue,
  currentTrack,
  isPlaying,
  progress,
  duration,
  repeatMode,
  setRepeatMode,
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
  playTrack,
  togglePlayback,
  stepTrack,
  seekTrack
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const selectedTrackNames = new Set(selectedPlaylist?.trackFilenames || []);
  const displayTracks = selectedPlaylist ? queue : tracks;

  return (
    <section className="workspace music-workspace">
      <div className="section-heading">
        <p className="eyebrow">Felix Music</p>
        <h1>个人音乐台</h1>
        <span>把喜欢的歌放进站点里，打开网页就能听。</span>
      </div>

      <section className="music-player-panel">
        <div className="music-now">
          <div className="music-cover" aria-hidden="true">
            <Music size={42} />
          </div>
          <div>
            <span>正在播放</span>
            <h2>{currentTrack?.title || '等待加入第一首歌'}</h2>
            <p>{currentTrack?.artist || '后台上传音乐后，这里会变成你的私人歌单。'}</p>
          </div>
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
        </div>
      </section>

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
              <div className={track.filename === currentTrack?.filename ? 'music-track active' : 'music-track'} key={track.filename}>
                <button type="button" onClick={() => playTrack(track, selectedPlaylistId)}>
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

function AccountWorkspace({ currentUser, accountActivity, refreshAccountActivity, setActiveView, openArticle, logout }) {
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
  const [releasePage, setReleasePage] = useState(0);
  const [releaseQuery, setReleaseQuery] = useState('');
  const [releaseMajor, setReleaseMajor] = useState('all');
  const [releaseStatus, setReleaseStatus] = useState('all');
  const latestRelease = releaseArchive[0];
  const shippedCount = releaseArchive.filter((release) => release.status === '已上线').length;
  const archivedCount = releaseArchive.filter((release) => release.status === '已归档').length;
  const totalPoints = releaseArchive.reduce((total, release) => total + release.points.length, 0);
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
  const pageCount = Math.max(1, Math.ceil(filteredReleases.length / RELEASE_PAGE_SIZE));
  const safeReleasePage = Math.min(releasePage, pageCount - 1);
  const visibleReleases = filteredReleases.slice(
    safeReleasePage * RELEASE_PAGE_SIZE,
    safeReleasePage * RELEASE_PAGE_SIZE + RELEASE_PAGE_SIZE
  );

  function updateReleaseQuery(value) {
    setReleaseQuery(value);
    setReleasePage(0);
  }

  function updateReleaseMajor(value) {
    setReleaseMajor(value);
    setReleasePage(0);
  }

  function updateReleaseStatus(value) {
    setReleaseStatus(value);
    setReleasePage(0);
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
            <option value="v2">v2.x</option>
            <option value="v1">v1.x</option>
            <option value="v0">v0.x</option>
          </select>
          <select value={releaseStatus} onChange={(event) => updateReleaseStatus(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="已上线">已上线</option>
            <option value="已归档">已归档</option>
          </select>
        </div>

        <div className="release-pager">
          <button
            className="ghost-button"
            type="button"
            onClick={() => setReleasePage((page) => Math.max(0, page - 1))}
            disabled={safeReleasePage === 0}
          >
            上一页
          </button>
          <span>{filteredReleases.length ? safeReleasePage + 1 : 0} / {pageCount}</span>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setReleasePage((page) => Math.min(pageCount - 1, page + 1))}
            disabled={safeReleasePage === pageCount - 1}
          >
            下一页
          </button>
        </div>
      </div>

      <div className="release-timeline">
        {visibleReleases.length === 0 ? (
          <p className="empty-state">没有匹配的版本记录。</p>
        ) : visibleReleases.map((release) => (
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
  deleteMusicTrack,
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
  approveAdminCommentsBulk,
  deleteAdminComment,
  currentUser,
  authToken,
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
    { id: 'releases', label: '版本', detail: '更新记录和路线', icon: Code2, count: releaseRoadmap[0].version },
    { id: 'ops', label: '运维', detail: '服务、部署、脚本', icon: ShieldCheck, count: '控制台' },
    { id: 'security', label: '安全', detail: '操作日志和删除保护', icon: ShieldCheck, count: `${adminAuditLogs.length} 条` }
  ];
  const contentTextareaRef = useRef(null);
  const [aiInsertMode, setAiInsertMode] = useState('append');
  const [activeAdminPage, setActiveAdminPage] = useState(readStoredAdminPage);
  const [adminStatsRange, setAdminStatsRange] = useState('7d');
  const [articleManagerQuery, setArticleManagerQuery] = useState('');
  const [articleManagerStatus, setArticleManagerStatus] = useState('all');
  const [articleManagerCategory, setArticleManagerCategory] = useState('all');
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
  const shouldShowAdminLayout = ['editor', 'notes', 'articles', 'music', 'comments'].includes(activeAdminPage);

  useEffect(() => {
    localStorage.setItem(ADMIN_PAGE_KEY, activeAdminPage);
  }, [activeAdminPage]);

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
          <ProjectOpsPanel authToken={authToken} />
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

      {activeAdminPage === 'backups' && (
        <section className="admin-panel utility-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>备份中心</h2>
              <span>大改、上线、迁移前先确认数据和配置有退路</span>
            </div>
            <button className="primary-action" type="button" onClick={recordBackup}>
              <Save size={17} />
              <span>记录备份</span>
            </button>
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
              ['AI 配置', '后台保存的 AI Key 位于后端持久目录。'],
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

          <label>
            <span>正文</span>
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
                  <span className="manager-meta-line">创建 {formatArticleTimestamp(article.createdAt, article.date || '未知')} · 修改 {formatArticleTimestamp(article.updatedAt, article.createdAt || article.date || '未知')}</span>
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
        <aside className="editor-side-stack">
          <section className="article-preview-panel" aria-label="文章预览">
            <div className="admin-panel-heading">
              <h3>正文预览</h3>
              <span>Markdown / LaTeX</span>
            </div>
            {articleForm.content.trim() ? (
              <MarkdownContent content={articleForm.content} title={articleForm.title || '文章预览'} />
            ) : (
              <p className="empty-state">左侧开始写正文后，这里会实时预览。</p>
            )}
          </section>

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
                  </div>
                  <audio controls preload="none" src={track.url}>
                    当前浏览器不支持音频播放。
                  </audio>
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

function IconToggle({ active, label, count, icon: Icon, onClick }) {
  return (
    <button className={active ? 'icon-toggle active' : 'icon-toggle'} type="button" onClick={onClick} title={label}>
      <Icon size={17} />
      <span>{label} {count}</span>
    </button>
  );
}

export default App;
