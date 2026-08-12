export const profile = {
  siteTitle: "FelixFu's Craft",
  name: '副将凡',
  englishName: 'Felix Fu',
  school: '浙江大学',
  role: 'Web 前端 & Python',
  interests: ['Web 全栈', 'AI 自动化', '安全与运维', '音乐', '游戏'],
  summary:
    '这里是我慢慢搭起来的小站：放技术笔记、随笔、音乐、工具入口，也记录一点自己的学习和折腾。',
  metrics: [
    { label: '技能方向', value: '3+' },
    { label: '线上项目', value: '1+' },
    { label: '好奇心', value: '100%' }
  ]
};

export const articles = [];

export const aiNews = [
  {
    title: '站点资料可以在后台维护',
    source: 'FelixFu Craft Log',
    summary: '公开展示名、站点标题和自我介绍都可以从管理后台保存。'
  },
  {
    title: '内容会逐步搬进数据库',
    source: 'FelixFu Craft Log',
    summary: '后端不可用时前端会使用这份兜底数据，线上正常读取数据库内容。'
  }
];

export const gameModule = {
  title: '决斗小游戏',
  repository: 'https://github.com/firefelixfu026/card-war-made-by-class-3',
  playUrl: 'https://firefelixfu026.github.io/card-war-made-by-class-3/',
  status: '已嵌入',
  plan: '当前通过 GitHub Pages 页面直接嵌入博客，后续可以继续补充游戏介绍、排行榜和登录后的分数记录。'
};
