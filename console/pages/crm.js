/**
 * 客户CRM页面
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>👤 新建客户档案</h3>
      <div class="grid3">
        <div><label>昵称 *</label><input id="cu_name" placeholder="如 小宜昌"></div>
        <div><label>电话</label><input id="cu_phone" placeholder="选填"></div>
        <div><label>等级</label><select id="cu_tier"><option value="C">C 普通</option><option value="B">B 潜力</option><option value="A">A 高价值</option><option value="D">D 沉默</option></select></div>
      </div>
      <div class="grid3">
        <div><label>性别</label><select id="cu_gender"><option value="unknown">未知</option><option value="female">女</option><option value="male">男</option></select></div>
        <div><label>体质</label><select id="cu_const"><option value="">不限</option><option>平和质</option><option>气虚质</option><option>阳虚质</option><option>阴虚质</option><option>痰湿质</option><option>湿热质</option><option>血瘀质</option><option>气郁质</option><option>特禀质</option></select></div>
        <div><label>诉求(逗号分隔)</label><input id="cu_con" placeholder="睡眠,祛湿"></div>
      </div>
      <label>备注</label><input id="cu_note" placeholder="选填">
      <button class="btn blue mt12" onclick="addCustomer()">＋ 建档</button>
    </div>
    <div class="card mt16">
      <h3>👥 客户列表 <span class="hint" id="cu_count"></span></h3>
      <div id="custList"></div>
    </div>
  `;
  await loadCustomers();
}

window.addCustomer = async function(){
  const body={nickname:document.getElementById('cu_name').value,phone:document.getElementById('cu_phone').value,gender:document.getElementById('cu_gender').value,tier:document.getElementById('cu_tier').value,constitution:document.getElementById('cu_const').value,concerns:document.getElementById('cu_con').value.split(',').map(s=>s.trim()).filter(Boolean),notes:document.getElementById('cu_note').value};
  if(!body.nickname){toast('请填写昵称');return;}
  const {ok,j}=await API.crm.create(body);
  toast(ok&&j.success?j.message:'失败'); if(ok){document.getElementById('cu_name').value='';loadCustomers();}
};

async function loadCustomers(){
  const {ok,j}=await API.crm.list();
  if(!(ok&&j.success))return;
  document.getElementById('cu_count').textContent='共 '+j.data.length+' 条';
  document.getElementById('custList').innerHTML=j.data.map(c=>`
    <div class="row"><div class="grow"><div class="ell"><b>${esc(c.nickname)}</b> <span class="meta">· ${esc(c.phone||'无电话')} · ${esc(c.tier)}级${c.constitution?' · '+esc(c.constitution):''}</span></div>
    <div class="meta">${esc((c.concerns||[]).join('/'))}</div></div>
    <span class="badge b-${esc(c.status)}">${esc(c.status)}</span>
    <button class="btn sm ghost" onclick="custDetail('${c._id}')">详情</button>
    <button class="btn sm" onclick="custUpsell('${c._id}')">升单</button></div>`).join('')||'<div class="empty">暂无客户</div>';
}

window.custDetail = async function(id){
  const {ok,j}=await API.crm.detail(id);
  if(ok&&j.success){
    const d=j.data;
    alert(`客户：${d.nickname}\n等级：${d.tier}\n体质：${d.constitution||'未填'}\n总消费：¥${d.totalSpend||0}\n互动记录：${(d.recentInteractions||[]).length}条`);
  }
};

window.custUpsell = async function(id){
  const {ok,j}=await API.crm.upsellPlan(id);
  if(ok&&j.success){
    const p=j.data.upsellPlan;
    alert(`升单方案（${j.data.tierName}）：\n策略：${p.strategy}\n推荐：${p.plans[0]?.name} - ¥${p.plans[0]?.price}\n${p.plans[0]?.description}`);
  } else toast('获取失败');
};

function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
