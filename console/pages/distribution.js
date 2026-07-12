/**
 * 分销裂变页面（链动2+1）
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>🔗 分销关系绑定（链动2+1）</h3>
      <div class="grid3">
        <div><label>新分销员ID</label><input id="d_user" placeholder="用户ID"></div>
        <div><label>推荐人ID</label><input id="d_parent" placeholder="上级ID（可选）"></div>
        <div><label>名称</label><input id="d_name" placeholder="昵称"></div>
      </div>
      <button class="btn mt12" onclick="bindDist()">🔗 绑定关系</button>
      <div class="hint">链动规则：直推满2人后，第3人及以后放到上级（爷爷节点）下，每人最多拿2级佣金</div>
    </div>
    <div class="grid2 mt16">
      <div class="card">
        <h3>📊 分销概览</h3>
        <div id="distOverview"></div>
      </div>
      <div class="card">
        <h3>💰 佣金记录</h3>
        <div id="commissionList"></div>
      </div>
    </div>
  `;
  await Promise.all([loadOverview(), loadCommissions()]);
}

window.bindDist = async function(){
  const body={userId:document.getElementById('d_user').value,parentId:document.getElementById('d_parent').value||undefined,userName:document.getElementById('d_name').value};
  if(!body.userId){toast('请填写分销员ID');return;}
  const {ok,j}=await API.distribution.bind(body);
  toast(ok&&j.success?(j.data?.level!==undefined?'绑定成功，层级'+j.data.level:'绑定成功'):(j.message||'失败'));
  if(ok)Promise.all([loadOverview(),loadCommissions()]);
};

async function loadOverview(){
  const {ok,j}=await API.distribution.overview();
  if(!(ok&&j.success))return;
  const d=j.data;
  document.getElementById('distOverview').innerHTML=`
    <div class="stat-card"><div class="num">${d.totalDistributors}</div><div class="lbl">分销员总数</div></div>
    <div class="stat-card mt12"><div class="num">${d.activeDistributors}</div><div class="lbl">活跃分销员</div></div>
    <div class="stat-card mt12"><div class="num">¥${d.totalCommission.toFixed(0)}</div><div class="lbl">累计佣金</div></div>`;
}

async function loadCommissions(){
  const {ok,j}=await API.distribution.commissions('?limit=20');
  if(!(ok&&j.success))return;
  document.getElementById('commissionList').innerHTML=(j.data||[]).map(c=>`
    <div class="row"><div class="grow"><div class="ell"><b>L${c.level}</b> · ${esc(c.distributorId)}</div>
    <div class="meta">¥${c.amount} · ${esc(c.status)}</div></div></div>`).join('')||'<div class="empty">暂无佣金记录</div>';
}

function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
