# 付江樊的个人博客

[![CI](https://github.com/firefelixfu026/the-piggy-home-of-felixfu/actions/workflows/ci.yml/badge.svg)](https://github.com/firefelixfu026/the-piggy-home-of-felixfu/actions/workflows/ci.yml)

这是付江樊的个人网站，用来放个人介绍、随笔、技术笔记、暑期计划、音乐、小游戏和常用工具入口。项目已经从一个普通博客，逐步长成“个人主页 + 内容库 + 生活记录 + 小型后台”的站点。

线上地址：

```text
https://www.felixfu.xyz
```

## 当前状态

- 前台页面：主页、文章、计划、音乐、工具箱、游戏、账号中心。
- 文章中心分为“随笔 / 娱乐文章”和“技术笔记”两个入口。
- 技术笔记采用知识库式阅读：左侧笔记树、中间正文、右侧阅读进度和文章目录。
- 计划页拆成时间安排、完成度、课程、应用、记账、饮食、身体、睡眠等子页面。
- 工具箱按分类展示常用网站，友链归入工具箱分类；自定义网站在后台管理。
- 音乐模块支持上传本地歌曲、自建歌单、拖拽调整歌单顺序、上传封面和歌词、全站迷你播放器。
- 黍泡泡作为站点吉祥物，以可拖动悬浮窗形式出现；模型来源：Bilibili UP 主切丁鱼片。
- 管理后台支持写文章、导入笔记、文件管理器式内容库、批量收纳笔记、拖拽排序、评论删除、音乐管理、工具箱统一管理、版本记录、视觉巡检、运维和安全日志。

## 页面路径

- 首页：`/`
- 文章中心：`/articles`
- 技术笔记：`/notes`
- 普通文章详情：`/articles/:id`
- 技术笔记详情：`/notes/:id`
- 暑期计划：`/plan`
- 计划子页面：`/plan/schedule`、`/plan/completion`、`/plan/courses`、`/plan/apps`、`/plan/finance`、`/plan/meals`、`/plan/body`、`/plan/sleep`
- 音乐：`/music`
- 工具箱：`/toolbox`
- 游戏：`/game`
- 账号中心：`/account`
- 管理后台：`/admin`

前端容器的 Nginx 已配置 SPA fallback，直接刷新这些路径时会回到前端应用处理。

## 技术栈

- 前端：React、Vite、KaTeX、自定义 Markdown 渲染
- 后端：FastAPI、SQLAlchemy、Pydantic
- 数据库：PostgreSQL
- 登录：邮箱登录、GitHub OAuth、Token 鉴权
- 部署：Docker Compose、Nginx、HTTPS、GitHub Actions
- 持久化：数据库、上传文件目录、Docker volume

## 项目结构

```text
.
|-- backend/                 FastAPI 后端服务
|-- frontend/                React 前端页面
|-- docs/                    文档和历史归档
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

## 关键环境变量

- `DATABASE_URL`：数据库连接地址。
- `AUTH_SECRET`：后端登录 Token 加密密钥。
- `ADMIN_SETUP_TOKEN`：初始化管理员所需密钥。
- `GITHUB_CLIENT_ID`：GitHub OAuth 应用 ID。
- `GITHUB_CLIENT_SECRET`：GitHub OAuth 应用密钥。
- `GITHUB_OAUTH_CALLBACK_URL`：GitHub 登录回调地址。
- `GITHUB_ADMIN_LOGINS`：允许成为管理员的 GitHub 用户名。
- `GITHUB_ADMIN_EMAILS`：允许成为管理员的 GitHub 邮箱。
- `ALLOW_PUBLIC_EMAIL_REGISTRATION`：是否允许公开邮箱注册。
- `ALLOW_READER_EMAIL_LOGIN`：是否允许普通读者邮箱登录。
- `ADMIN_COMMENTS_REQUIRE_APPROVAL`：是否开启评论审核。

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

在后台“笔记上传”中选择整个文件夹后，系统会上传图片，并尽量把相对图片路径替换成站内 `/uploads/...` 地址。导入内容会先进入写作台草稿，不会直接发布。

## 项目性质

这是一个个人学习、技术写作和生活记录项目。功能会随着付江樊自己的使用习惯继续调整，不追求“大而全”，更重视顺手、可维护和有个人气质。
