# 付江樊的个人博客

[![CI](https://github.com/firefelixfu026/the-piggy-home-of-felixfu/actions/workflows/ci.yml/badge.svg)](https://github.com/firefelixfu026/the-piggy-home-of-felixfu/actions/workflows/ci.yml)

这是付江樊的个人网站项目，用来放个人介绍、随笔、技术笔记、暑期计划、音乐和一些常用工具入口。项目从一个普通博客慢慢长成了更像“个人主页 + 内容库 + 小型后台”的站点。

线上地址：

```text
https://www.felixfu.xyz
```

## 当前定位

- 前台更偏个人展示和浏览体验：主页、文章、计划、音乐、工具箱、游戏、账号中心。
- 侧边栏支持轻量展开 / 折叠，桌面阅读时更省空间。
- 内容分成两类：`随笔 / 娱乐文章` 和 `技术笔记`，避免生活内容和课程笔记混在一起。
- 技术笔记采用知识库式阅读：左侧笔记树可悬浮滑出，中间正文，右侧目录和阅读进度跟随滚动。
- 后台可以给技术笔记设置“合集 / 目录路径”，前台会自动生成可折叠目录树。
- 后台只保留常用管理入口：写文章、笔记上传、内容库、评论删除、音乐管理、版本记录、运维和安全。
- 版本清单保留从 `v0.1.0` 到当前版本的完整演进记录。
- 工具箱支持管理员自定义网址，新增的链接会保存到后端数据库并公开展示。
- AI 工作台代码仍保留在仓库里，但不再作为主要功能入口。

## 功能概览

- 文章中心
  - 随笔 / 娱乐文章：适合生活、游戏、番剧、读书和小作文。
  - 技术笔记：适合课程笔记、项目文档、代码学习记录和知识库内容。
  - 支持 Markdown、LaTeX、代码块、表格、图片、标签、分类、归档、搜索和阅读次数。
  - 文章包含创建时间和最后修改时间。

- 技术笔记上传
  - 后台支持上传单篇 `.md` 文件。
  - 支持选择包含 `.md` 和 `images/`、`assets/` 图片的笔记文件夹。
  - 导入时会上传图片，并尽量把 Markdown 中的相对图片路径替换成网站可访问地址。
  - 导入后先生成草稿，方便预览和微调后再发布。

- 暑期计划
  - 支持按日期查看和编辑每日时间段计划。
  - 支持完成记录、完成度统计、折线图和柱状图。
  - 手机应用使用时间、睡眠、饮食、记账等模块支持按日期记录。

- 音乐
  - 支持上传本地音乐文件。
  - 前台有音乐页面和侧边栏迷你播放器。
  - 支持自建歌单、添加歌曲、调整顺序和拖动播放进度。

- 工具箱
  - 内置常用学习、开发、设计素材、效率和娱乐网站。
  - 管理员可以在工具箱页新增、编辑、删除自定义网址。
  - 自定义网址支持分类、标签、用途说明和置顶到高频入口。
  - 自定义链接保存到数据库，换设备访问也能看到。

- 互动和账号
  - 支持账号登录后评论、点赞、收藏、点踩和使用“？”反馈。
  - 评论后台目前只保留查看和删除，默认直接公开评论。
  - 账号中心可以查看自己的评论、收藏文章和互动记录。

- 管理后台
  - 写作台用于发布随笔和普通文章。
  - 笔记上传用于导入技术笔记。
  - 内容库用于编辑、删除、置顶和管理草稿。
  - 音乐管理用于上传和删除音乐。
  - 运维页用于查看服务状态和部署辅助信息。
  - 安全页保留操作日志和删除保护说明。

## 技术栈

- 前端：React、Vite、KaTeX、自定义 Markdown 渲染
- 后端：FastAPI、SQLAlchemy、Pydantic
- 数据库：PostgreSQL
- 登录认证：邮箱登录、GitHub OAuth、Token 鉴权
- 部署：Docker Compose、Nginx、HTTPS、GitHub Actions
- 持久化：数据库、上传文件目录、Docker volume

## 项目结构

```text
.
|-- backend/                 FastAPI 后端服务
|-- frontend/                React 前端页面
|-- docs/
|   |-- README.md            文档导航
|   |-- guides/              部署、数据库、登录和运维文档
|   `-- archive/             历史记录和旧阶段文档
|-- scripts/                 服务器维护和部署脚本
|-- .github/workflows/       GitHub Actions 工作流
|-- docker-compose.yml       本地和服务器统一启动配置
|-- .env.example             环境变量模板
|-- CHANGELOG.md             版本日志
`-- README.md                项目说明
```

## 本地启动

复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

启动服务：

```powershell
docker compose up -d --build
```

打开本地页面：

```text
http://127.0.0.1:8080
```

健康检查：

```text
http://127.0.0.1:8000/api/health
http://127.0.0.1:8080/api/health
```

更完整的启动说明见：[本地和服务器启动指南](docs/guides/本地和服务器启动指南.md)

## 重要环境变量

- `DATABASE_URL`：PostgreSQL 数据库连接地址
- `AUTH_SECRET`：后端登录 Token 加密密钥
- `ADMIN_SETUP_TOKEN`：初始化管理员所需密钥
- `ADMIN_COMMENTS_REQUIRE_APPROVAL`：是否开启非管理员评论审核，默认 `false`
- `ALLOW_PUBLIC_EMAIL_REGISTRATION`：是否允许公开邮箱注册
- `ALLOW_READER_EMAIL_LOGIN`：是否允许普通读者邮箱登录
- `LOGIN_FAILURE_LIMIT`：登录失败锁定阈值
- `LOGIN_LOCK_SECONDS`：登录失败后的锁定时间
- `GITHUB_CLIENT_ID`：GitHub OAuth 应用 ID
- `GITHUB_CLIENT_SECRET`：GitHub OAuth 应用密钥
- `GITHUB_OAUTH_CALLBACK_URL`：GitHub 登录回调地址
- `GITHUB_ADMIN_LOGINS`：允许成为管理员的 GitHub 用户名
- `GITHUB_ADMIN_EMAILS`：允许成为管理员的 GitHub 邮箱
- `AI_PROVIDER_NAME`、`AI_API_STYLE`、`AI_BASE_URL`、`AI_MODEL`、`AI_API_KEY`：保留的 AI 接口配置

不要把 `.env`、真实 API Key、OAuth Secret 或生产数据库密码提交到 GitHub。

## 笔记上传约定

推荐的技术笔记目录结构：

```text
my-note/
|-- index.md
`-- images/
    |-- intro.png
    `-- diagram.webp
```

Markdown 中可以写：

```markdown
![示意图](images/intro.png)
```

在后台“笔记上传”中选择整个文件夹后，系统会上传图片并把相对路径替换成 `/uploads/...` 地址。导入内容会进入写作台草稿，不会直接发布。

## 文档入口

完整文档索引见：[docs/README.md](docs/README.md)

常用文档：

- [本地和服务器启动指南](docs/guides/本地和服务器启动指南.md)
- [云服务器部署指南](docs/guides/云服务器部署指南.md)
- [云服务器和域名准备](docs/guides/云服务器和域名准备.md)
- [数据库说明](docs/guides/数据库说明.md)
- [数据库备份和恢复](docs/guides/数据库备份和恢复.md)
- [GitHub 登录配置指南](docs/guides/GitHub登录配置指南.md)
- [GitHub 自动部署指南](docs/guides/GitHub自动部署指南.md)
- [服务器运维手册](docs/guides/服务器运维手册.md)

## 线上部署概况

- Nginx 负责 HTTPS 和反向代理。
- Docker Compose 运行前端、后端和 PostgreSQL。
- PostgreSQL 数据和上传文件通过持久化目录保存。
- GitHub Actions 在推送后执行构建检查并部署到服务器。
- 域名 `www.felixfu.xyz` 指向服务器并配置 HTTPS。

## 项目性质

这是一个个人学习、技术写作和生活记录项目。功能会随付江樊自己的使用习惯继续调整，不追求“大而全”，更重视顺手、可维护和有个人气质。
