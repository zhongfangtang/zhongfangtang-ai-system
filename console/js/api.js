/**
 * 运营后台 API 客户端
 * 统一请求封装 + 错误处理 + 自动降级
 */

const API_BASE = ''; // 同源相对地址

let TOKEN = localStorage.getItem('zft_token') || '';

function setToken(t) {
  TOKEN = t;
  if (t) localStorage.setItem('zft_token', t);
  else localStorage.removeItem('zft_token');
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;

  try {
    const r = await fetch(API_BASE + path, { ...opts, headers });
    if (r.status === 401) {
      setToken('');
      location.reload();
      throw new Error('登录已失效');
    }
    const j = await r.json().catch(() => ({ success: false, message: '响应解析失败' }));
    return { ok: r.ok, status: r.status, j };
  } catch (err) {
    if (err.message === '登录已失效') throw err;
    return { ok: false, status: 0, j: { success: false, message: err.message } };
  }
}

// 认证
async function login(username, password) {
  const { ok, j } = await api('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (ok && j.success) {
    setToken(j.data.token);
    return j;
  }
  throw new Error(j.message || '登录失败');
}

function logout() {
  setToken('');
  location.reload();
}

// 内容
const content = {
  list: () => api('/api/v1/console/content').then(r => r.j),
  generate: (data) => api('/api/v1/console/content/generate', {
    method: 'POST', body: JSON.stringify(data),
  }).then(r => r.j),
  publish: (id) => api(`/api/v1/console/content/${id}/publish`, { method: 'POST' }).then(r => r.j),
  platformContents: (params = '') => api(`/api/v1/platforms/contents${params}`).then(r => r.j),
  generateVideoScript: (data) => api('/api/v1/console/content/generate-video', {
    method: 'POST', body: JSON.stringify(data),
  }),
};

// 截流线索
const leads = {
  list: () => api('/api/v1/console/leads').then(r => r.j),
  create: (data) => api('/api/v1/console/leads', {
    method: 'POST', body: JSON.stringify(data),
  }).then(r => r.j),
  updateStatus: (id, status) => api(`/api/v1/console/leads/${id}/status`, {
    method: 'PUT', body: JSON.stringify({ status }),
  }).then(r => r.j),
  keywords: () => api('/api/v1/interception/keywords').then(r => r.j),
};

// 客户CRM
const crm = {
  list: () => api('/api/v1/console/customers').then(r => r.j),
  create: (data) => api('/api/v1/console/customers', {
    method: 'POST', body: JSON.stringify(data),
  }).then(r => r.j),
  detail: (id) => api(`/api/v1/crm/customers/${id}`).then(r => r.j),
  classify: (id) => api(`/api/v1/crm/customers/${id}/classify`, { method: 'POST' }).then(r => r.j),
  upsellPlan: (id) => api(`/api/v1/crm/customers/${id}/upsell-plan`, { method: 'POST' }).then(r => r.j),
};

// Agent管理
const agents = {
  list: () => api('/api/v1/agents').then(r => r.j),
  trigger: (id, input) => api(`/api/v1/agents/${id}/trigger`, {
    method: 'POST', body: JSON.stringify(input || {}),
  }).then(r => r.j),
  logs: (id) => api(`/api/v1/agents/${id}/logs`).then(r => r.j),
  pause: (id) => api(`/api/v1/agents/${id}/pause`, { method: 'POST' }).then(r => r.j),
  resume: (id) => api(`/api/v1/agents/${id}/resume`, { method: 'POST' }).then(r => r.j),
};

// 系统状态
const system = {
  status: () => api('/api/v1/console/status').then(r => r.j),
  health: () => api('/api/v1/system/status').then(r => r.j),
};

// Web3
const web3 = {
  info: () => api('/api/v1/web3/info').then(r => r.j),
  notarize: (data) => api('/api/v1/web3/notarize', {
    method: 'POST', body: JSON.stringify(data),
  }).then(r => r.j),
  verify: (hash) => api(`/api/v1/web3/verify?hash=${hash}`).then(r => r.j),
};

// 分销
const distribution = {
  overview: () => api('/api/v1/distribution/overview').then(r => r.j),
  bind: (data) => api('/api/v1/distribution/bind', {
    method: 'POST', body: JSON.stringify(data),
  }).then(r => r.j),
  tree: (userId) => api(`/api/v1/distribution/tree/${userId}`).then(r => r.j),
  commissions: (params = '') => api(`/api/v1/distribution/commissions${params}`).then(r => r.j),
};

// 积分
const points = {
  balance: (customerId) => api(`/api/v1/points/balance/${customerId}`).then(r => r.j),
  records: (params = '') => api(`/api/v1/points/records${params}`).then(r => r.j),
  products: () => api('/api/v1/points/products').then(r => r.j),
  earn: (data) => api('/api/v1/points/earn', { method: 'POST', body: JSON.stringify(data) }).then(r => r.j),
  redeem: (data) => api('/api/v1/points/redeem', { method: 'POST', body: JSON.stringify(data) }).then(r => r.j),
};

// 金融
const finance = {
  plans: () => api('/api/v1/finance/plans').then(r => r.j),
  apply: (data) => api('/api/v1/finance/apply', { method: 'POST', body: JSON.stringify(data) }).then(r => r.j),
  applications: (params = '') => api(`/api/v1/finance/applications${params}`).then(r => r.j),
  alliances: () => api('/api/v1/finance/alliances').then(r => r.j),
};

// 视频
const video = {
  tasks: (params = '') => api(`/api/v1/video/tasks${params}`).then(r => r.j),
  generate: (data) => api('/api/v1/video/generate', { method: 'POST', body: JSON.stringify(data) }).then(r => r.j),
  templates: () => api('/api/v1/video/templates').then(r => r.j),
};

// 报表
const reports = {
  list: (params = '') => api(`/api/v1/analytics/reports${params}`).then(r => r.j),
  generate: (data) => api('/api/v1/analytics/reports/generate', { method: 'POST', body: JSON.stringify(data) }).then(r => r.j),
};

// 发布管理
const publish = {
  records: (params = '') => api(`/api/v1/platforms/publish-records${params}`).then(r => r.j),
  accounts: () => api('/api/v1/platforms/accounts').then(r => r.j),
  status: (id) => api(`/api/v1/platforms/publish/${id}/status`).then(r => r.j),
};

export {
  API_BASE, login, logout, content, leads, crm, agents, system, web3,
  distribution, points, finance, video, reports, publish, setToken,
};
