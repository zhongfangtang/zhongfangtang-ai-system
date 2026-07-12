/**
 * Web3存证页面
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>⛓️ 链上存证</h3>
      <div id="chainInfo"></div>
      <label>存证内容（客户数据/交易/产品技能）</label>
      <textarea id="w_payload" rows="3" placeholder='{"type":"customer","id":"xxx","action":"consume"}'></textarea>
      <label>记录类型</label>
      <select id="w_type"><option value="customer">客户数据</option><option value="transaction">交易记录</option><option value="product">产品技能</option><option value="points">积分记录</option></select>
      <button class="btn mt12" onclick="notarize()">⛓️ 上链存证</button>
      <div class="hint">Web3+RWA确权：数据哈希上链，不可篡改，零隐私泄露</div>
    </div>
    <div class="card mt16">
      <h3>🔍 存证验证</h3>
      <input id="w_hash" placeholder="输入0x哈希">
      <button class="btn ghost sm mt12" onclick="verifyHash()">验证</button>
      <div id="verifyResult" class="mt12"></div>
    </div>
  `;
  await loadChainInfo();
}

async function loadChainInfo(){
  const {ok,j}=await API.web3.info();
  if(ok&&j.success){
    const d=j.data;
    document.getElementById('chainInfo').innerHTML=`
      <div class="row"><div class="grow">网络</div><b>${esc(d.network||'未知')}</b></div>
      <div class="row"><div class="grow">Chain ID</div><b>${esc(d.chainId||'-')}</b></div>
      <div class="row"><div class="grow">合约地址</div><b style="font-size:11px">${esc(d.contractAddress||'未部署')}</b></div>
      <div class="row"><div class="grow">可写状态</div><span class="badge b-${d.canWrite?'active':'pending'}">${d.canWrite?'可写入':'只读(离线哈希)'}</span></div>`;
  }
}

window.notarize = async function(){
  let payload;
  try{payload=JSON.parse(document.getElementById('w_payload').value);}catch(e){return toast('JSON格式错误');}
  const {ok,j}=await API.web3.notarize({type:document.getElementById('w_type').value,payload});
  if(ok&&j.success){
    toast('存证成功');
    document.getElementById('w_hash').value=j.data.hash;
  } else toast('存证失败：'+(j.message||''));
};

window.verifyHash = async function(){
  const hash=document.getElementById('w_hash').value.trim();
  if(!hash)return toast('请输入哈希');
  const {ok,j}=await API.web3.verify(hash);
  if(ok&&j.success){
    document.getElementById('verifyResult').innerHTML=`<div class="badge b-active">✅ 已存证</div><pre>${esc(JSON.stringify(j.data,null,2))}</pre>`;
  } else {
    document.getElementById('verifyResult').innerHTML=`<div class="badge b-pending">未找到记录</div>`;
  }
};

function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
