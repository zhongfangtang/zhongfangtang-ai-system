/**
 * AI智能体监控页面
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>🤖 AI智能体矩阵（9 Agent）</h3>
      <div id="agentGrid" class="grid2"></div>
    </div>
    <div class="card mt16">
      <h3>📜 运行日志</h3>
      <div id="agentLogs"></div>
    </div>
  `;
  await loadAgents();
}

async function loadAgents(){
  const {ok,j}=await API.agents.list();
  if(!(ok&&j.success)){document.getElementById('agentGrid').innerHTML='<div class="empty">无数据</div>';return;}
  const agents=j.data;
  document.getElementById('agentGrid').innerHTML=agents.map(a=>`
    <div class="card" style="margin:0">
      <div class="flex" style="justify-content:space-between;align-items:center">
        <b>${esc(a.name)}</b>
        <span class="badge b-${a.status}">${statusText(a.status)}</span>
      </div>
      <div class="meta mt12">触发：${esc(a.trigger)} · ${a.canUseAI?'AI可用':'降级模式'}</div>
      <div class="meta">运行 ${a.metrics.runCount} · 成功 ${a.metrics.successCount} · 失败 ${a.metrics.failCount} · 降级 ${a.metrics.degradedCount}</div>
      <div class="flex gap6 mt12">
        <button class="btn sm" onclick="triggerAgent('${a.id}')">▶ 触发</button>
        ${a.status==='paused'?`<button class="btn sm green" onclick="resumeAgent('${a.id}')">恢复</button>`:`<button class="btn sm ghost" onclick="pauseAgent('${a.id}')">暂停</button>`}
        <button class="btn sm ghost" onclick="viewLogs('${a.id}')">日志</button>
      </div>
    </div>`).join('');
}

window.triggerAgent = async function(id){
  toast('触发中…');
  const {ok,j}=await API.agents.trigger(id,{});
  toast(ok&&j.success?'执行成功':'执行失败');
  setTimeout(loadAgents, 1000);
};

window.pauseAgent = async function(id){
  await API.agents.pause(id); toast('已暂停'); setTimeout(loadAgents,500);
};

window.resumeAgent = async function(id){
  await API.agents.resume(id); toast('已恢复'); setTimeout(loadAgents,500);
};

window.viewLogs = async function(id){
  const {ok,j}=await API.agents.logs(id);
  if(ok&&j.success){
    const logs=j.data.map(l=>`[${new Date(l.createdAt).toLocaleString('zh-CN')}] ${l.status} · ${l.error||'OK'}`).join('\n');
    alert(logs||'暂无日志');
  }
};

function statusText(s){
  const map={running:'运行中',idle:'待命',paused:'已暂停',error:'异常',degraded:'降级',active:'正常',pending:'未启动'};
  return map[s]||s||'未知';
}
function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
