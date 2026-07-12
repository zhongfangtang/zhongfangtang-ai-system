/**
 * 金融服务页面（分期/积分/异业联盟）
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="grid2">
      <div class="card">
        <h3>💳 金融方案</h3>
        <div id="financePlans"></div>
        <button class="btn mt12" onclick="showApplyForm()">＋ 申请分期/先享后付</button>
        <div id="applyForm" style="display:none" class="mt12">
          <label>客户ID</label><input id="f_cust" placeholder="客户ID">
          <label>方案</label><select id="f_plan"></select>
          <label>金额</label><input id="f_amount" type="number" placeholder="如 2980">
          <label>期数</label><input id="f_periods" type="number" value="6">
          <button class="btn green sm mt12" onclick="applyFinance()">提交申请</button>
        </div>
      </div>
      <div class="card">
        <h3>🤝 异业联盟伙伴</h3>
        <div id="allianceList"></div>
        <div class="hint mt12">保险 / 移动 / 旅游 联合营销活动</div>
      </div>
    </div>
    <div class="card mt16">
      <h3>📋 金融申请记录</h3>
      <div id="financeApps"></div>
    </div>
  `;
  await Promise.all([loadPlans(), loadAlliances(), loadApps()]);
  // 填充方案下拉
  const {ok,j}=await API.finance.plans();
  if(ok&&j.success){
    document.getElementById('f_plan').innerHTML=(j.data||[]).map(p=>`<option value="${p._id}">${esc(p.name)}</option>`).join('');
  }
}

window.showApplyForm = function(){const f=document.getElementById('applyForm');f.style.display=f.style.display==='none'?'block':'none';};
window.applyFinance = async function(){
  const body={customerId:document.getElementById('f_cust').value,planId:document.getElementById('f_plan').value,amount:document.getElementById('f_amount').value,periods:document.getElementById('f_periods').value};
  const {ok,j}=await API.finance.apply(body);
  toast(ok&&j.success?'申请已提交':'失败'); if(ok){document.getElementById('applyForm').style.display='none';loadApps();}
};

async function loadPlans(){
  const {ok,j}=await API.finance.plans();
  document.getElementById('financePlans').innerHTML=(ok&&j.success&&j.data||[]).map(p=>`
    <div class="row"><div class="grow"><b>${esc(p.name)}</b> <span class="badge b-active">${esc(p.type)}</span></div>
    <span class="badge b-${p.status}">${esc(p.status)}</span></div>`).join('')||'<div class="empty">暂无方案</div>';
}

async function loadAlliances(){
  const {ok,j}=await API.finance.alliances();
  document.getElementById('allianceList').innerHTML=(ok&&j.success&&j.data||[]).map(a=>`
    <div class="row"><div class="grow"><b>${esc(a.name)}</b> <span class="meta">· ${esc(a.industry)}</span></div>
    <span class="badge b-${a.status}">${esc(a.status)}</span></div>`).join('')||'<div class="empty">暂无联盟伙伴</div>';
}

async function loadApps(){
  const {ok,j}=await API.finance.applications('?limit=20');
  document.getElementById('financeApps').innerHTML=(ok&&j.success&&j.data||[]).map(a=>`
    <div class="row"><div class="grow"><div class="ell"><b>${esc(a.customerName||a.customerId)}</b> · ${esc(a.planName||a.planId)}</div>
    <div class="meta">¥${a.amount} · ${a.periods||''}期 · ${new Date(a.createdAt).toLocaleDateString('zh-CN')}</div></div>
    <span class="badge b-${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<div class="empty">暂无申请</div>';
}

function statusClass(s){return {pending:'pending',approved:'active',rejected:'b-high',completed:'published',overdue:'b-high'}[s]||'pending';}
function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
