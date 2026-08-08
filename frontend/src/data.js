export const profile = {
  name: '付江樊',
  englishName: 'Felix Fu',
  school: '浙江大学',
  role: '计算机学生 · 技术写作 · AI 工具 · 个人项目',
  interests: ['Web 全栈', 'AI 自动化', '安全与运维', '长跑', '游戏'],
  summary:
    '这里是我的学习主页和项目工作台：记录课程笔记、技术实验、AI 自动化、小游戏和运维工具。目标是把“想到的东西”尽快做成可以上线、可以复盘、可以继续迭代的作品。',
  metrics: [
    { label: '当前方向', value: 'Web + AI' },
    { label: '站点形态', value: '博客工作台' },
    { label: '迭代节奏', value: '持续上线' }
  ]
};

export const articles = [];

export const aiNews = [
  {
    title: '前后端分离项目优先打通接口契约',
    source: 'Daily Tech Digest',
    summary: '先固定页面、数据结构和 API 路由，可以降低后续接入数据库和鉴权时的改动成本。'
  },
  {
    title: 'AI 总结模块适合从文章摘要开始',
    source: 'AI Workflow',
    summary: 'MVP 阶段可先保留摘要入口，后续把文章正文发送到模型服务并缓存总结结果。'
  }
];

export const gameModule = {
  title: '决斗小游戏',
  repository: 'https://github.com/firefelixfu026/card-war-made-by-class-3',
  playUrl: 'https://firefelixfu026.github.io/card-war-made-by-class-3/',
  status: '已嵌入',
  plan: '当前通过 GitHub Pages 页面直接嵌入博客。后续可以继续补充游戏介绍、排行榜和统一登录后的分数记录。'
};
