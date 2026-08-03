import { useMemo, useState } from 'react';

const services = [
  {
    id: 'frontend',
    name: '前端服务',
    target: 'frontend',
    status: 'online',
    health: 98,
    detail: 'React + Vite build, Nginx 托管静态文件',
    commands: {
      logs: 'docker compose logs frontend --tail=120',
      restart: 'docker compose restart frontend',
      deploy: 'docker compose up -d --build frontend'
    }
  },
  {
    id: 'backend',
    name: '后端 API',
    target: 'backend',
    status: 'online',
    health: 94,
    detail: 'FastAPI REST API, 鉴权、文章、评论、AI 和上传接口',
    commands: {
      logs: 'docker compose logs backend --tail=120',
      restart: 'docker compose restart backend',
      deploy: 'docker compose up -d --build backend'
    }
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    target: 'postgres',
    status: 'attention',
    health: 82,
    detail: '线上数据存储在服务器 Docker volume 中',
    commands: {
      logs: 'docker compose logs postgres --tail=120',
      restart: 'docker compose restart postgres',
      deploy: './scripts/backup-postgres.sh'
    }
  },
  {
    id: 'actions',
    name: 'GitHub Actions',
    target: 'deploy.yml',
    status: 'online',
    health: 90,
    detail: '推送 main 后触发 CI，成功后部署到阿里云',
    commands: {
      logs: 'gh run list --workflow deploy.yml --limit 5',
      restart: 'gh workflow run deploy.yml',
      deploy: 'git push origin main'
    }
  }
];

const scripts = [
  ['生产部署', 'scripts/deploy-production.sh', '拉取最新代码并重建 Docker 服务'],
  ['数据库备份', 'scripts/backup-postgres.sh', '重要展示或大改前先备份 PostgreSQL'],
  ['数据库恢复', 'scripts/restore-postgres.sh', '从备份文件恢复线上数据'],
  ['服务检查', 'docker compose ps', '查看 frontend、backend、postgres 是否在线']
];

const gatewayRoutes = [
  ['www.felixfu.xyz', '/', 'frontend 静态页面'],
  ['www.felixfu.xyz', '/api/*', 'backend FastAPI'],
  ['www.felixfu.xyz', '/uploads/*', '后端上传图片目录'],
  ['www.felixfu.xyz', '/api/auth/github/callback', 'GitHub OAuth 回调']
];

const commandLabels = {
  deploy: '部署',
  restart: '重启',
  logs: '日志'
};

function statusLabel(status) {
  return status === 'online' ? '在线' : status === 'attention' ? '关注' : '离线';
}

function statusClass(status) {
  return status === 'online' ? 'ready' : status === 'attention' ? 'warning' : 'danger';
}

function ProjectOpsPanel() {
  const [selectedServiceId, setSelectedServiceId] = useState('backend');
  const [selectedAction, setSelectedAction] = useState('logs');
  const [events, setEvents] = useState([
    ['后端 API 日志检查', '建议先看 backend 日志再处理 500 或登录异常'],
    ['数据库备份提醒', '大改、展示、迁移前先执行 backup-postgres.sh'],
    ['网关策略', '前端由 Nginx 托管，/api 请求反向代理到 FastAPI']
  ]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || services[0],
    [selectedServiceId]
  );
  const command = selectedService.commands[selectedAction];
  const onlineCount = services.filter((service) => service.status === 'online').length;

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setEvents((current) => [
      [`已复制 ${selectedService.name} ${commandLabels[selectedAction]}命令`, command],
      ...current.slice(0, 4)
    ]);
  }

  function simulateAction(action) {
    setSelectedAction(action);
    setEvents((current) => [
      [`已生成 ${selectedService.name} ${commandLabels[action]}操作`, selectedService.commands[action]],
      ...current.slice(0, 4)
    ]);
  }

  return (
    <section className="admin-panel ops-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>项目运维控制台</h2>
          <span>/opt/felixfu-blog · 安全预览模式</span>
        </div>
        <span className="status-badge">模拟执行</span>
      </div>

      <div className="ops-metric-grid">
        <div className="ops-metric">
          <span>在线服务</span>
          <strong>{onlineCount} / {services.length}</strong>
        </div>
        <div className="ops-metric">
          <span>部署入口</span>
          <strong>GitHub Actions</strong>
        </div>
        <div className="ops-metric">
          <span>服务器目录</span>
          <strong>/opt/felixfu-blog</strong>
        </div>
        <div className="ops-metric">
          <span>网关路由</span>
          <strong>{gatewayRoutes.length} 条</strong>
        </div>
      </div>

      <div className="ops-layout">
        <div className="ops-service-grid">
          {services.map((service) => (
            <button
              className={service.id === selectedService.id ? 'ops-service-card active' : 'ops-service-card'}
              key={service.id}
              type="button"
              onClick={() => setSelectedServiceId(service.id)}
            >
              <div>
                <strong>{service.name}</strong>
                <span>{service.detail}</span>
              </div>
              <span className={`ops-status ${statusClass(service.status)}`}>{statusLabel(service.status)}</span>
              <div className="ops-health" aria-label={`${service.name} 健康度 ${service.health}%`}>
                <span style={{ width: `${service.health}%` }} />
              </div>
            </button>
          ))}
        </div>

        <div className="ops-command-panel">
          <div className="ops-command-heading">
            <div>
              <span>当前目标</span>
              <strong>{selectedService.name}</strong>
            </div>
            <button className="ghost-button" type="button" onClick={copyCommand}>
              复制命令
            </button>
          </div>
          <pre>{command}</pre>
          <div className="ops-action-row">
            {Object.keys(commandLabels).map((action) => (
              <button
                className={selectedAction === action ? 'primary-action' : 'ghost-button'}
                key={action}
                type="button"
                onClick={() => simulateAction(action)}
              >
                {commandLabels[action]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ops-bottom-grid">
        <section>
          <div className="admin-panel-heading compact-heading">
            <h3>脚本清单</h3>
            <span>{scripts.length} 个</span>
          </div>
          <div className="ops-list">
            {scripts.map(([name, path, detail]) => (
              <article className="ops-list-row" key={path}>
                <div>
                  <strong>{name}</strong>
                  <span>{detail}</span>
                </div>
                <code>{path}</code>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="admin-panel-heading compact-heading">
            <h3>网关路由</h3>
            <span>Nginx</span>
          </div>
          <div className="ops-list">
            {gatewayRoutes.map(([host, route, target]) => (
              <article className="ops-list-row" key={`${host}-${route}`}>
                <div>
                  <strong>{route}</strong>
                  <span>{host}</span>
                </div>
                <code>{target}</code>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="ops-events">
        <div className="admin-panel-heading compact-heading">
          <h3>最近事件</h3>
          <span>本地模拟记录</span>
        </div>
        <div className="ops-list">
          {events.map(([title, detail]) => (
            <article className="ops-list-row" key={`${title}-${detail}`}>
              <div>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectOpsPanel;
