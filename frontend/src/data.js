export const profile = {
  name: '付江樊',
  englishName: 'Felix Fu',
  school: '浙江大学',
  role: 'Web 前端 & Python',
  interests: ['Web 全栈', 'AI 自动化', '安全与运维', '长跑', '游戏'],
  summary:
    '普通大学生，正在努力把“想做的事”变成“会做的事”。从一行代码开始，一路把课程笔记、AI 工具、小游戏和运维后台慢慢接到这个小站里。',
  metrics: [
    { label: '技能方向', value: '3+' },
    { label: '线上项目', value: '1+' },
    { label: '好奇心', value: '100%' }
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
    summary: '可以先从文章摘要、标题候选和写作续写开始，逐步把模型能力沉淀成日常工作流。'
  }
];

export const gameModule = {
  title: '决斗小游戏',
  repository: 'https://github.com/firefelixfu026/card-war-made-by-class-3',
  playUrl: 'https://firefelixfu026.github.io/card-war-made-by-class-3/',
  status: '已嵌入',
  plan: '当前通过 GitHub Pages 页面直接嵌入博客。后续可以继续补充游戏介绍、排行榜和统一登录后的分数记录。'
};
