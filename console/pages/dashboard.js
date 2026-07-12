/**
 * 运营仪表盘页面
 */
import * as API from '../js/api.js';

export async function render(el) {
  const [statusRes, agentsRes] = await Promise.all([
    API.system.status().catch(() => ({ success: false })),
    API.agents.list().catch(() => ({ success: false })),
  ]);

  const s = statusRes.success ? statusRes.data : null;
  const agents = agentsRes.success ? agentsRes.data : [];

  const counts = s?.counts || { content: 0, leads: 0, customers: 0, publishes: 0 };
  const agentCount = agents.length;
  const runningAgents = agents.filter(a => a.status === 'running' || a.status === 'idle').length;

  el.innerHTML = `
    <div class="grid4">
      <div class="stat-card"><div class="num">${counts.content}</div><div class="lbl">内容总数</div><div class="sub">${counts.publishes} 已发布</div></div>
      <div class="stat-card"><div class="num">${counts.leads}</div><div class="lbl">截流线索</div><div class="sub">公域获客</div></div>
      <div class="stat-card"><div class="num">${counts.customers}</div><div class="lbl">私域客户</div><div class="sub">CRM管理</div></div>
      <div class="stat-card"><div class="num">${agentCount}</div><div class="lbl">AI智能体</div><div class="sub">${runningAgents} 运行中</div></div>
    </div>

    <div class="grid2 mt16">
      <div class="card">
        <h3>🤖 AI智能体状态</h3>
        <div id="agentList">
          ${agents.length ? agents.map(a => `
            <div class="row">
              <div class="grow">
                <div class="ell"><b>${esc(a.name)}</b> <span class="meta">· ${esc(a.trigger)}</span></div>
                <div class="meta">运行 ${a.metrics.runCount} 次 · 成功 ${a.metrics.successCount} · 失败 ${a.metrics.failCount}</div>
              </div>
              <span class="badge b-${a.status}">${statusText(a.status)}</span>
            </div>`).join('') : '<div class="empty">无Agent数据</div>'}
        </div>
      </div>

      <div class="card">
        <h3>📡 系统概览</h3>
        <div class="row"><div class="grow">AI模式</div><span class="badge ${s?.aiMode==='llm'?'b-active':'b-pending'}">${s?.aiMode==='llm'?'真实大模型':'知识库模式'}</span></div>
        <div class="row"><div class="grow">内容引擎</div><span class="badge b-${s?.engines?.content==='running'?'active':'pending'}">${statusText(s?.engines?.content)}</span></div>
        <div class="row"><div class="grow">截流引擎</div><span class="badge b-${s?.engines?.interception==='running'?'active':'pending'}">${statusText(s?.engines?.interception)}</span></div>
        <div class="row"><div class="grow">私域引擎</div><span class="badge b-${s?.engines?.privateDomain==='running'?'active':'pending'}">${statusText(s?.engines?.privateDomain)}</span></div>
        <div class="row"><div class="grow">发布引擎</div><span class="badge b-${s?.engines?.publish==='running'?'active':'pending'}">${statusText(s?.engines?.publish)}</span></div>
        <div class="hint mt12">系统架构：9 Agent + 8引擎 + 4服务，零成本可运行</div>
      </div>
    </div>

    <div class="card mt16">
      <h3>🚀 快速开始</h3>
      <div class="flex gap10">
        <button class="btn" onclick="switchPage('content')">✍️ 生成内容</button>
        <button class="btn blue" onclick="switchPage('agents')">🤖 管理Agent</button>
        <button class="btn green" onclick="switchPage('leads')">🎯 截流获客</button>
        <button class="btn ghost" onclick="switchPage('web3')">⛓️ Web3存证</button>
      </div>
    </div>
  `;
}

function statusText(s){
  const map={running:'运行中',idle:'待命',paused:'已暂停',error:'异常',degraded:'降级',active:'正常',pending:'未启动'};
  return map[s]||s||'未知';
}

function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
