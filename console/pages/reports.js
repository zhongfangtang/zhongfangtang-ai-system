/**
 * 数据报表页面
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>📈 报表中心</h3>
      <div class="flex gap10">
        <button class="btn" onclick="genReport('daily')">📅 生成日报</button>
        <button class="btn" onclick="genReport('weekly')">📆 生成周报</button>
        <button class="btn" onclick="genReport('monthly')">🗓️ 生成月报</button>
      </div>
    </div>
    <div class="card mt16">
      <h3>📋 历史报表</h3>
      <div id="reportList"></div>
    </div>
  `;
  await loadReports();
}

window.genReport = async function(type){
  toast('生成中…');
  const {ok,j}=await API.reports.generate({type, period:new Date().toISOString().slice(0,10)});
  toast(ok&&j.success?'报表已生成':'生成失败');
  if(ok)loadReports();
};

async function loadReports(){
  const {ok,j}=await API.reports.list('?limit=20');
  document.getElementById('reportList').innerHTML=(ok&&j.success&&j.data||[]).map(r=>`
    <div class="row"><div class="grow"><b>${esc(r.type)}</b> · ${esc(r.period)}</div>
    <span class="meta">${new Date(r.createdAt).toLocaleDateString('zh-CN')}</span></div>`).join('')||'<div class="empty">暂无报表</div>';
}

function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
