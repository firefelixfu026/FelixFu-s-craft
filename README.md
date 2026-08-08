# 付江樊的个人博客

[![CI](https://github.com/firefelixfu026/the-piggy-home-of-felixfu/actions/workflows/ci.yml/badge.svg)](https://github.com/firefelixfu026/the-piggy-home-of-felixfu/actions/workflows/ci.yml)

这是一个从零搭建的全栈个人博客项目，目标是展示个人文章、学习笔记、项目记录和 AI 写作辅助能力。项目使用 React、FastAPI、PostgreSQL、Docker、Nginx 和 GitHub Actions，已经完成从本地开发到云服务器上线的完整闭环。

线上地址：

```text
https://www.felixfu.xyz
```

## 项目亮点

- 文章列表、文章详情、搜索、标签、分类、归档、置顶和阅读时长
- Markdown、LaTeX 公式、代码块、表格和文章图片渲染
- 管理员后台支持文章发布、编辑、删除、草稿、图片上传和站点统计
- GitHub 登录、普通邮箱注册/登录、管理员权限控制和初始化密钥保护
- 登录后才能评论、点赞、收藏、点踩和使用“？”反馈
- 每个账号的互动只记录一次，刷新页面不会重复计数
- 评论支持分页、字数限制、回复、后台管理、删除和管理员免审开关
- 账号中心可查看自己的评论、收藏文章和互动记录
- 管理员 AI 工作台支持选题、摘要、标题、润色、续写和大纲生成
- 支持本地占位 AI，也支持 OpenAI 兼容接口或中转站接口
- Docker Compose 一键启动前端、后端和 PostgreSQL
- GitHub Actions 自动测试并部署到阿里云服务器

## 技术栈

- 前端：React、Vite、KaTeX、Markdown 渲染
- 后端：FastAPI、SQLAlchemy、Pydantic
- 数据库：PostgreSQL
- 登录认证：普通邮箱注册/登录、GitHub OAuth、Token 鉴权
- 部署：Docker Compose、Nginx、HTTPS、阿里云轻量应用服务器
- 自动化：GitHub Actions CI/CD
- AI：本地回退生成、OpenAI 兼容接口、Codex 中转接口

## 项目结构

```text
.
├── backend/                 # FastAPI 后端服务
├── frontend/                # React 前端页面
├── docs/
│   ├── README.md            # 文档导航
│   ├── guides/              # 正式部署、数据库、登录和运维文档
│   └── archive/             # 历史记录、旧阶段计划和临时备份
├── scripts/                 # 服务器维护和部署脚本
├── .github/workflows/       # GitHub Actions 工作流
├── docker-compose.yml       # 本地和服务器统一启动配置
├── .env.example             # 环境变量模板
├── CHANGELOG.md             # 版本日志
└── README.md                # 项目说明
```

## 本地启动

先复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

再启动服务：

```powershell
docker compose up -d --build
```

打开本地页面：

```text
http://127.0.0.1:8080
```

健康检查地址：

```text
http://127.0.0.1:8000/api/health
http://127.0.0.1:8080/api/health
```

更详细的启动方式见：[本地和服务器启动指南](docs/guides/本地和服务器启动指南.md)

## 重要环境变量

生产环境需要重点配置这些变量：

- `DATABASE_URL`：PostgreSQL 数据库连接地址
- `AUTH_SECRET`：后端登录 Token 加密密钥
- `ADMIN_SETUP_TOKEN`：初始化管理员密钥
- `ADMIN_COMMENTS_REQUIRE_APPROVAL`：是否让管理员评论也进入审核，默认 `false`
- `GITHUB_CLIENT_ID`：GitHub OAuth 应用 ID
- `GITHUB_CLIENT_SECRET`：GitHub OAuth 应用密钥
- `GITHUB_OAUTH_CALLBACK_URL`：GitHub 登录回调地址
- `GITHUB_ADMIN_LOGINS`：允许成为管理员的 GitHub 用户名
- `AI_PROVIDER_NAME`：AI 服务名称
- `AI_API_STYLE`：AI 接口类型，支持 `openai` 或 `codex`
- `AI_BASE_URL`：AI 接口地址
- `AI_MODEL`：模型名称
- `AI_API_KEY`：AI 密钥

注意：不要把 `.env`、真实 API Key、OAuth Secret 提交到 GitHub。

## AI 配置说明

AI 模块目前作为管理员写作辅助工具使用，有两种运行方式：

1. 本地占位模式：不需要真实 API Key，也能演示选题、摘要、标题和写作辅助流程。
2. 真实模型模式：通过 OpenAI 兼容接口或中转站接口调用真实模型。

如果使用 AICodeMirror 这类 OpenAI SDK 兼容接口，可以填写类似：

```text
https://api.aicodemirror.com/api/codex/backend-api/codex/v1
```

并设置：

```text
AI_API_STYLE=openai
```

后端会自动请求该地址下的 `/chat/completions`。

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

当前线上环境部署在阿里云 Ubuntu 服务器：

- Nginx 负责 HTTPS 和反向代理
- Docker Compose 运行前端、后端和 PostgreSQL
- PostgreSQL 数据和上传图片通过 Docker volume 持久化保存
- GitHub Actions 在 push 后执行自动测试和部署
- 域名 `www.felixfu.xyz` 指向服务器并配置 HTTPS

## 安全设计

- 管理后台只允许管理员访问
- 初始化管理员需要 `ADMIN_SETUP_TOKEN`
- 游客不能评论、点赞、收藏或点踩
- 每个账号对同一篇文章的互动只记录一次
- 评论和文章操作都走后端权限校验
- API Key 和 OAuth 密钥只保存在服务器环境变量中
- 上传图片会限制类型和访问路径

## 项目性质

这是一个个人学习、技术写作和作品集展示项目。
