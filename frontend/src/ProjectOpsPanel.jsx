import { useEffect, useMemo, useState } from 'react';

const SITE_LAUNCHED_AT = new Date('2026-07-04T00:00:00+08:00');
const OPS_HISTORY_KEY = 'felix_blog_ops_check_history';
const GITHUB_RUNS_URL = 'https://api.github.com/repos/firefelixfu026/the-piggy-home-of-felixfu/actions/runs?per_page=5';

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

function safeText(value, fallback = '暂无信息') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function statusLabel(status) {
  return status === 'online' ? '在线' : status === 'attention' ? '关注' : '离线';
}

function statusClass(status) {
  return status === 'online' ? 'ready' : status === 'attention' ? 'warning' : 'danger';
}

function isValidDate(date) {
  return date instanceof Date && Number.isFinite(date.getTime());
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidDate(date)) return '时间未知';
  try {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    const pad = (part) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}

function formatDuration(from, to) {
  if (!isValidDate(from) || !isValidDate(to)) return '上线时间待确认';
  const totalSeconds = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days} 天 ${hours} 小时 ${minutes} 分钟`;
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
  return `${minutes} 分钟 ${seconds} 秒`;
}

function parseServerTime(value) {
  if (!value) return null;
  const text = String(value);
  const parsed = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text}Z`);
  return isValidDate(parsed) ? parsed : null;
}

function normalizeLiveServices(value) {
  if (!Array.isArray(value)) return [];
  return value.map((service, index) => ({
    name: safeText(service?.name, `服务 ${index + 1}`),
    status: safeText(service?.status, 'attention'),
    detail: safeText(service?.detail),
  }));
}

function normalizeContainers(value) {
  if (!Array.isArray(value)) return [];
  return value.map((container, index) => ({
    name: safeText(container?.name, `容器 ${index + 1}`),
    status: safeText(container?.status, 'attention'),
    detail: safeText(container?.detail),
  }));
}

function normalizeWorkflowRun(run) {
  return {
    id: safeText(run?.id, `${Date.now()}`),
    name: safeText(run?.name, 'GitHub Actions'),
    title: safeText(run?.display_title, '部署任务'),
    status: safeText(run?.status, 'unknown'),
    conclusion: safeText(run?.conclusion, 'running'),
    branch: safeText(run?.head_branch, 'main'),
    sha: safeText(run?.head_sha, '').slice(0, 7) || '未知',
    url: safeText(run?.html_url, ''),
    updatedAt: safeText(run?.updated_at, '')
  };
}

function workflowStatusLabel(run) {
  if (run.status !== 'completed') return '运行中';
  if (run.conclusion === 'success') return '成功';
  if (run.conclusion === 'failure') return '失败';
  if (run.conclusion === 'cancelled') return '取消';
  return run.conclusion;
}

function workflowStatusClass(run) {
  if (run.status !== 'completed') return 'warning';
  return run.conclusion === 'success' ? 'ready' : 'danger';
}

function readCheckHistory() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = JSON.parse(localStorage.getItem(OPS_HISTORY_KEY) || '[]');
    return Array.isArray(stored) ? stored.slice(0, 8) : [];
  } catch {
    localStorage.removeItem(OPS_HISTORY_KEY);
    return [];
  }
}

function writeCheckHistory(history) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(OPS_HISTORY_KEY, JSON.stringify(history.slice(0, 8)));
}

function ProjectOpsPanel({ authToken }) {
  const [selectedServiceId, setSelectedServiceId] = useState('backend');
  const [selectedAction, setSelectedAction] = useState('logs');
  const [systemHealth, setSystemHealth] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isLoadingDeployments, setIsLoadingDeployments] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [checkHistory, setCheckHistory] = useState(readCheckHistory);
  const [deploymentRuns, setDeploymentRuns] = useState([]);
  const [deploymentMessage, setDeploymentMessage] = useState('等待读取 GitHub Actions');
  const [events, setEvents] = useState([
    ['后端 API 日志检查', '建议先看 backend 日志再处理 500 或登录异常'],
    ['数据库备份提醒', '大改、展示、迁移前先执行 backup-postgres.sh'],
    ['网关策略', '前端由 Nginx 托管，/api 请求反向代理到 FastAPI']
  ]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || services[0],
    [selectedServiceId]
  );
  const command = selectedService.commands?.[selectedAction] || '暂未配置命令';
  const onlineCount = services.filter((service) => service.status === 'online').length;
  const liveServices = normalizeLiveServices(systemHealth?.services);
  const containerServices = normalizeContainers(systemHealth?.containers);
  const checkedAt = parseServerTime(systemHealth?.checkedAt);
  const latestDeployRun = deploymentRuns.find((run) => run.name === 'Deploy') || deploymentRuns[0];
  const liveStatusCounts = liveServices.reduce(
    (counts, service) => ({
      ...counts,
      [service.status]: (counts[service.status] || 0) + 1
    }),
    {}
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    refreshSystemHealth();
    refreshDeploymentStatus();
  }, [authToken]);

  async function refreshDeploymentStatus() {
    setIsLoadingDeployments(true);
    try {
      const response = await fetch(GITHUB_RUNS_URL, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) {
        setDeploymentMessage(`GitHub 返回 ${response.status}`);
        return;
      }
      const payload = await response.json();
      const runs = Array.isArray(payload.workflow_runs)
        ? payload.workflow_runs.map(normalizeWorkflowRun)
        : [];
      setDeploymentRuns(runs);
      setDeploymentMessage(runs.length ? '已读取最近部署' : '暂时没有部署记录');
    } catch {
      setDeploymentMessage('无法读取 GitHub Actions，可能是网络或访问频率限制');
    } finally {
      setIsLoadingDeployments(false);
    }
  }

  async function refreshSystemHealth() {
    if (!authToken) return;
    setIsCheckingHealth(true);
    try {
      const response = await fetch('/api/admin/system/health', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!response.ok) {
        recordCheck('attention', '真实健康检查未完成', `接口返回 ${response.status}`);
        return;
      }
      const payload = await response.json();
      const normalizedServices = normalizeLiveServices(payload.services);
      setSystemHealth({
        ...payload,
        services: normalizedServices,
        containers: normalizeContainers(payload.containers)
      });
      const healthyCount = normalizedServices.filter((service) => service.status === 'online').length;
      const nextStatus = healthyCount === normalizedServices.length ? 'online' : 'attention';
      recordCheck(nextStatus, '真实健康检查完成', `${healthyCount} / ${normalizedServices.length} 项在线`, normalizedServices);
      setEvents((current) => [
        ['真实健康检查完成', formatDateTime(parseServerTime(payload.checkedAt) || new Date())],
        ...current.slice(0, 4)
      ]);
    } catch {
      recordCheck('attention', '真实健康检查失败', '当前无法读取 /api/admin/system/health');
      setEvents((current) => [
        ['真实健康检查失败', '当前无法读取 /api/admin/system/health'],
        ...current.slice(0, 4)
      ]);
    } finally {
      setIsCheckingHealth(false);
    }
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setEvents((current) => [
        [`已复制 ${selectedService.name} ${commandLabels[selectedAction]}命令`, command],
        ...current.slice(0, 4)
      ]);
    } catch {
      setEvents((current) => [
        ['复制失败', '浏览器暂未允许剪贴板权限，可手动选中命令复制'],
        ...current.slice(0, 4)
      ]);
    }
  }

  function simulateAction(action) {
    setSelectedAction(action);
    setEvents((current) => [
      [`已生成 ${selectedService.name} ${commandLabels[action]}操作`, selectedService.commands?.[action] || '暂未配置命令'],
      ...current.slice(0, 4)
    ]);
  }

  function recordCheck(status, title, detail, servicesSnapshot = []) {
    const nextItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status,
      title: safeText(title),
      detail: safeText(detail),
      checkedAt: new Date().toISOString(),
      services: servicesSnapshot.map((service) => ({
        name: safeText(service.name),
        status: safeText(service.status, 'attention')
      }))
    };
    setCheckHistory((current) => {
      const next = [nextItem, ...current].slice(0, 8);
      writeCheckHistory(next);
      return next;
    });
  }

  return (
    <section className="admin-panel ops-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>项目运维控制台</h2>
          <span>/opt/felixfu-blog · 安全预览模式</span>
        </div>
        <button className="ghost-button" type="button" onClick={refreshSystemHealth}>
          {isCheckingHealth ? '检查中' : '真实检查'}
        </button>
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
        <div className="ops-metric ops-clock-metric">
          <span>当前时间</span>
          <strong>{formatDateTime(now)}</strong>
        </div>
        <div className="ops-metric ops-clock-metric">
          <span>已上线</span>
          <strong>{formatDuration(SITE_LAUNCHED_AT, now)}</strong>
        </div>
        <div className="ops-metric ops-clock-metric">
          <span>最近检查</span>
          <strong>{checkedAt ? formatDateTime(checkedAt) : '尚未检查'}</strong>
        </div>
        <div className="ops-metric">
          <span>真实状态</span>
          <strong>{liveServices.length ? `${liveStatusCounts.online || 0} / ${liveServices.length}` : '待检查'}</strong>
        </div>
        <div className="ops-metric">
          <span>上传上限</span>
          <strong>{systemHealth?.limits?.maxUploadMb ? `${systemHealth.limits.maxUploadMb} MB` : '待检查'}</strong>
        </div>
        <div className="ops-metric">
          <span>线上提交</span>
          <strong>{latestDeployRun?.sha || '待读取'}</strong>
        </div>
        <div className="ops-metric">
          <span>最近部署</span>
          <strong>{latestDeployRun ? workflowStatusLabel(latestDeployRun) : '待读取'}</strong>
        </div>
      </div>

      <div className="ops-events">
        <div className="admin-panel-heading compact-heading">
          <h3>部署状态</h3>
          <button className="ghost-button" type="button" onClick={refreshDeploymentStatus}>
            {isLoadingDeployments ? '读取中' : '刷新部署'}
          </button>
        </div>
        <div className="ops-list">
          {deploymentRuns.length === 0 ? (
            <p className="empty-state">{deploymentMessage}</p>
          ) : deploymentRuns.map((run) => (
            <article className="ops-list-row ops-deploy-row" key={run.id}>
              <div>
                <strong>{run.name} · {run.title}</strong>
                <span>{run.branch} · {run.sha} · {formatDateTime(parseServerTime(run.updatedAt) || run.updatedAt)}</span>
              </div>
              {run.url ? (
                <a className={`ops-status ${workflowStatusClass(run)}`} href={run.url} target="_blank" rel="noreferrer">
                  {workflowStatusLabel(run)}
                </a>
              ) : (
                <span className={`ops-status ${workflowStatusClass(run)}`}>{workflowStatusLabel(run)}</span>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="ops-live-grid">
        {liveServices.length === 0 ? (
          <p className="empty-state">点击真实检查读取 API、数据库、上传目录和 AI 配置状态</p>
        ) : liveServices.map((service) => (
          <article className="ops-live-card" key={service.name}>
            <span className={`ops-status ${statusClass(service.status)}`}>{statusLabel(service.status)}</span>
            <strong>{service.name}</strong>
            <small>{service.detail}</small>
          </article>
        ))}
      </div>

      <div className="ops-events">
        <div className="admin-panel-heading compact-heading">
          <h3>容器状态</h3>
          <span>由后端尝试读取 docker compose ps</span>
        </div>
        <div className="ops-live-grid">
          {containerServices.length === 0 ? (
            <p className="empty-state">完成真实检查后显示容器状态</p>
          ) : containerServices.map((container) => (
            <article className="ops-live-card" key={container.name}>
              <span className={`ops-status ${statusClass(container.status)}`}>{statusLabel(container.status)}</span>
              <strong>{container.name}</strong>
              <small>{container.detail}</small>
            </article>
          ))}
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
          <h3>检查记录</h3>
          <span>{checkHistory.length ? `${checkHistory.length} 条` : '等待第一次检查'}</span>
        </div>
        <div className="ops-list">
          {checkHistory.length === 0 ? (
            <p className="empty-state">点击真实检查后，这里会留下最近的检查结果。</p>
          ) : checkHistory.map((item) => (
            <article className="ops-list-row ops-history-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
                <small>{formatDateTime(parseServerTime(item.checkedAt) || item.checkedAt)}</small>
              </div>
              <span className={`ops-status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
            </article>
          ))}
        </div>
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
