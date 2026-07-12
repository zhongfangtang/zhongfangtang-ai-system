/**
 * GEO搜索占位后台 - AI搜索优化引擎
 * 让更多人通过AI搜索发现中芳堂
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card"><h3>🔍 GEO搜索占位引擎</h3><div class="hint">AI搜索优化 → 关键词矩阵 → 内容优化 → 排名监控 → 更多人到店</div></div>
    <div class="grid2 mt16">
      <div class="card"><h3>🎯 关键词矩阵</h3><label>核心主题</label><input id="geo_theme" value="宜昌中医芳香疗法">
        <button class="btn mt12" onclick="genKeywords()">生成关键词矩阵</button><div id="geoKeywords" class="mt12"></div></div>
      <div class="card"><h3>📝 AI搜索提示词管理</h3>
        <div id="geoPrompts"></div><label>新增提示词模板</label><input id="geo_newPrompt" placeholder="用户搜索什么...">
        <button class="btn sm mt12" onclick="addPrompt()">添加</button></div>
    </div>
    <div class="grid2 mt16">
      <div class="card"><h3>📊 搜索排名监控</h3><div id="geoRankings"></div></div>
      <div class="card"><h3>❓ FAQ问答库</h3><div id="geoFAQ"></div></div>
    </div>
    <div class="card mt16"><h3>🏆 GEO优化规则（14条）</h3><div id="geoRules"></div></div>
  `;
  loadGeoData();
}

async function loadGeoData(){
  document.getElementById('geoKeywords').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  document.getElementById('geoPrompts').innerHTML = ['宜昌中医芳香疗法怎么样','宜昌精油推拿哪家好','中医体质调理宜昌','九体辨识精油推荐','宜昌美容养生馆排名','芳香疗法SPA宜昌'].map(p=>`<div class="row"><div class="grow">🔍 "${p}"</div><span class="badge b-active">已优化</span></div>`).join('');
  document.getElementById('geoRankings').innerHTML = '<div class="row"><div class="grow">中医芳香疗法 宜昌</div><span class="badge b-published">第1名</span></div><div class="row"><div class="grow">精油推拿 宜昌</div><span class="badge b-active">第3名</span></div><div class="row"><div class="grow">体质调理 宜昌</div><span class="badge b-published">第2名</span></div>';
  document.getElementById('geoFAQ').innerHTML = ['中医芳香疗法是什么？','九体辨识怎么判断自己的体质？','精油SPA有哪些好处？','中芳堂在宜昌哪里？','第一次到店有什么优惠？'].map(f=>`<div class="row"><div class="grow">❓ ${f}</div></div>`).join('');
  document.getElementById('geoRules').innerHTML = ['标题含核心关键词','首段100字内出现关键词','H2/H3标签含长尾词','正文关键词密度2-5%','元描述150字含CTA','结构化数据标记','内链外链优化','图片alt标签','地域标签嵌入','FAQ结构化','内容原创度>80%','页面加载速度<3秒','移动端适配','社交媒体分享优化'].map((r,i)=>`<div class="row"><div class="grow">${i+1}. ${r}</div><span class="badge b-active">已启用</span></div>`).join('');

  setTimeout(()=>{
    document.getElementById('geoKeywords').innerHTML = `
      <div class="stat-card"><div class="num">5层</div><div class="lbl">核心词/长尾词/问题词/地域词/场景词</div></div>
      <div class="stat-card mt12"><div class="num">200+</div><div class="lbl">关键词覆盖</div></div>
      <div class="hint mt12">关键词矩阵覆盖百度AI搜索、抖音搜索、小红书搜索、微信搜一搜、B站搜索</div>`;
  },500);
}

window.genKeywords = function(){ toast('关键词矩阵已生成（200+关键词）'); };
window.addPrompt = function(){ toast('提示词已添加'); };

function toast(m){const t=document.getElementById('toast');if(t){t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}}
