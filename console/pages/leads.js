/**
 * 截流线索页面
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>🎯 捕获截流线索</h3>
      <div class="grid3">
        <div><label>平台</label><select id="l_platform"><option value="douyin">抖音</option><option value="xiaohongshu">小红书</option><option value="weixin">视频号</option><option value="kuaishou">快手</option><option value="bilibili">B站</option><option value="baidu">百度</option></select></div>
        <div><label>作者</label><input id="l_author" placeholder="昵称"></div>
        <div><label>地区</label><input id="l_loc" placeholder="如 宜昌伍家岗"></div>
      </div>
      <label>内容（评论/私信/提问原文）</label>
      <textarea id="l_content" rows="2" placeholder="例如：宜昌有没有靠谱的精油推拿？我气虚总累"></textarea>
      <div class="grid3">
        <div><label>来源</label><select id="l_source"><option value="comment">评论</option><option value="question">提问</option><option value="dm">私信</option><option value="post">帖子</option></select></div>
        <div><label>意向分(0-100)</label><input id="l_score" type="number" value="60"></div>
        <div><label>匹配关键词(逗号分隔)</label><input id="l_kw" placeholder="精油,推拿"></div>
      </div>
      <button class="btn blue mt12" onclick="addLead()">＋ 捕获线索入库</button>
    </div>
    <div class="card mt16">
      <h3>📋 线索池 <span class="hint" id="l_count"></span></h3>
      <div id="leadList"></div>
    </div>
  `;
  await loadLeads();
}

window.addLead = async function(){
  const body={platform:document.getElementById('l_platform').value,authorName:document.getElementById('l_author').value,content:document.getElementById('l_content').value,location:document.getElementById('l_loc').value,source:document.getElementById('l_source').value,intentScore:document.getElementById('l_score').value,matchedKeywords:document.getElementById('l_kw').value.split(',').map(s=>s.trim()).filter(Boolean)};
  if(!body.content){toast('请填写线索内容');return;}
  const {ok,j}=await API.leads.create(body);
  toast(ok&&j.success?j.message:'失败'); if(ok){document.getElementById('l_content').value='';loadLeads();}
};

async function loadLeads(){
  const {ok,j}=await API.leads.list();
  if(!(ok&&j.success))return;
  document.getElementById('l_count').textContent='共 '+j.data.length+' 条';
  document.getElementById('leadList').innerHTML=j.data.map(l=>`
    <div class="row">
      <div class="grow"><div class="ell"><b>${esc(l.authorName||'匿名')}</b> <span class="meta">· ${esc(l.platform)} · 意向${l.intentScore}</span></div>
      <div class="meta ell">${esc(l.content)}</div></div>
      <span class="badge ${l.isHighPotential?'b-high':'b-'+esc(l.status)}">${l.isHighPotential?'高潜':esc(l.status)}</span>
      <button class="btn sm ghost" onclick="setLead('${l._id}','contacted')">联系</button>
      <button class="btn sm" onclick="setLead('${l._id}','converted')">转化</button>
    </div>`).join('')||'<div class="empty">暂无线索</div>';
}

window.setLead = async function(id,s){
  const {ok,j}=await API.leads.updateStatus(id,s);toast(ok&&j.success?'已更新':'失败');if(ok)loadLeads();
};

function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
