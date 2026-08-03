export const profile = {
  name: '付江樊',
  englishName: 'Felix Fu',
  school: '浙江大学',
  role: '个人博客 · 学习笔记 · AI 工作台 · 技术项目',
  interests: ['技术写作', 'AI 自动化', '长跑', '游戏'],
  summary:
    '这里沉淀学习笔记、项目复盘和个人实验。当前博客已经进入项目验收收尾版：文章发布、分类归档、评论回复、用户中心、访问统计、GitHub 登录、云端部署和 AI 写作辅助已形成可演示闭环。',
  metrics: [
    { label: '当前阶段', value: '项目验收' },
    { label: '内容系统', value: '完整闭环' },
    { label: 'AI 模块', value: '可测试' }
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
