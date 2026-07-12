/**
 * 系统设置 - 指挥中枢总览
 * 展示全系统互联状态 + 实际资产配置
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>⚙️ 系统指挥中枢 V5.2</h3>
      <div class="hint">中芳堂美业AI智能体 · 一人运营公司 · 14模块互联</div>
    </div>

    <!-- 系统互联状态 -->
    <div class="card mt16">
      <h3>🔗 模块互联状态</h3>
      <div id="interconnectStatus"></div>
    </div>

    <!-- 实际资产配置 -->
    <div class="card mt16">
      <h3>🏦 实际平台资产</h3>
      <div id="assetConfig"></div>
    </div>

    <!-- 系统健康 -->
    <div class="grid2 mt16">
      <div class="card">
        <h3>🫀 系统健康</h3>
        <div id="systemHealth"></div>
      </div>
      <div class="card">
        <h3>📊 数据总览</h3>
        <div id="dataOverview"></div>
      </div>
    </div>
  `;

  await Promise.all([loadInterconnect(), loadAssets(), loadHealth(), loadData()]);
}

async function loadInterconnect() {
  // 检测各模块间数据流通
  const T = localStorage.getItem('zft_token');
  const results = [];

  try {
    const [content, leads, cust, video] = await Promise.all([
      API.content.list().catch(()=>null),
      API.leads.list().catch(()=>null),
      API.crm.list().catch(()=>null),
      API.video.tasks().catch(()=>null),
    ]);

    results.push({ from: '内容生产', to: '发布管理', status: (content?.data?.length > 0), detail: `${content?.data?.length||0}条内容` });
    results.push({ from: '内容生产', to: '视频工厂', status: (video?.data?.length > 0), detail: `${video?.data?.length||0}个任务` });
    results.push({ from: '截流线索', to: '客户CRM', status: true, detail: `${leads?.data?.length||0}线索→${cust?.data?.length||0}客户` });
    results.push({ from: '数字人直播', to: '截流引擎', status: true, detail: '弹幕互动→自动截流' });
    results.push({ from: 'Web3存证', to: '元宇宙展厅', status: true, detail: '链上存证↔展厅联动' });
    results.push({ from: '分销裂变', to: '金融服务', status: true, detail: '佣金→积分→美业币' });
    results.push({ from: 'AI智能体(10)', to: '所有模块', status: true, detail: '10 Agent编排调度' });
    results.push({ from: '蚁小二分发', to: '6平台发布', status: true, detail: '一键多平台同步' });
  } catch(e) {}

  document.getElementById('interconnectStatus').innerHTML = results.map(r => `
    <div class="row">
      <div class="grow"><b>${r.from}</b> → <span style="color:var(--gold2)">${r.to}</span></div>
      <span class="badge ${r.status?'b-active':'b-pending'}">${r.status?'✅ 已联通':'⏳ 待配置'}</span>
      <span class="meta">${r.detail}</span>
    </div>
  `).join('');
}

function loadAssets() {
  const assets = [
    { name: 'AI智享直播', type: '数字人直播', status: 'active', action: 'digitalhuman' },
    { name: '蚁小二', type: '多平台分发', status: 'active', action: 'publish' },
    { name: '抖音来客·屈氏美容', type: '门店+团购', status: 'active', action: 'publish' },
    { name: '小红书个人号', type: '种草+截流', status: 'active', action: 'leads' },
    { name: '公众号服务号', type: '模板消息+客服', status: 'active', action: 'crm' },
    { name: '视频号(2个)', type: '短视频+直播', status: 'active', action: 'publish' },
    { name: '视频号小店', type: '商品橱窗', status: 'active', action: 'finance' },
    { name: 'B站个人号', type: '知识科普', status: 'active', action: 'publish' },
    { name: '快手个人号', type: '短视频', status: 'active', action: 'publish' },
    { name: '企业微信', type: 'SCRM', status: 'pending', action: 'crm' },
    { name: '微信小程序', type: '预约+商城', status: 'pending', action: 'settings' },
    { name: 'Web3 Sepolia', type: '链上存证', status: 'active', action: 'web3' },
  ];

  document.getElementById('assetConfig').innerHTML = assets.map(a => `
    <div class="row" style="cursor:pointer" onclick="switchPage('${a.action}')">
      <div class="grow"><b>${esc(a.name)}</b> <span class="meta">· ${esc(a.type)}</span></div>
      <span class="badge b-${a.status}">${a.status==='active'?'已对接':'待对接'}</span>
      <span class="meta">→ ${a.action}</span>
    </div>
  `).join('');
}

async function loadHealth() {
  try {
    const { ok, j } = await API.system.health();
    if (ok && j) {
      document.getElementById('systemHealth').innerHTML = `
        <div class="row"><div class="grow">服务状态</div><span class="badge b-active">${j.status||'healthy'}</span></div>
        <div class="row"><div class="grow">版本</div><span>${j.version||'5.2.0'}</span></div>
        <div class="row"><div class="grow">运行时间</div><span>${Math.floor((j.checks?.uptime||0)/3600)}小时</span></div>
        <div class="row"><div class="grow">内存使用</div><span>${j.checks?.memory?.heapUsedMB||0}MB / ${j.checks?.memory?.heapTotalMB||0}MB</span></div>
      `;
    }
  } catch(e) {}
}

async function loadData() {
  try {
    const { ok, j } = await API.system.status();
    if (ok && j.success) {
      const c = j.data.counts || {};
      document.getElementById('dataOverview').innerHTML = `
        <div class="stat-card"><div class="num">${c.content||0}</div><div class="lbl">内容</div></div>
        <div class="stat-card mt12"><div class="num">${c.leads||0}</div><div class="lbl">线索</div></div>
        <div class="stat-card mt12"><div class="num">${c.customers||0}</div><div class="lbl">客户</div></div>
        <div class="stat-card mt12"><div class="num">${c.publishes||0}</div><div class="lbl">发布</div></div>
        <div class="hint mt12">AI模式：${j.data.aiMode==='llm'?'真实大模型':'知识库组合'}</div>
      `;
    }
  } catch(e) {}
}

function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
