/**
 * GEO搜索占位后台 - AI搜索优化引擎 + 提示词管理
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card"><h3>🔍 GEO搜索占位引擎</h3><div class="hint">让更多人通过AI搜索发现中芳堂 → 了解 → 到店体验 → 成交</div></div>

    <!-- 提示词管理 -->
    <div class="card mt16">
      <h3>📝 AI搜索提示词管理</h3>
      <div class="hint">管理用户可能搜索的关键词和对应的AI优化策略</div>
      <div id="promptManager"></div>
    </div>

    <!-- 关键词矩阵 + 排名 -->
    <div class="grid2 mt16">
      <div class="card"><h3>🎯 五层关键词矩阵</h3><div id="geoKeywords"></div></div>
      <div class="card"><h3>📊 搜索排名监控</h3><div id="geoRankings"></div></div>
    </div>

    <!-- GEO优化规则 + FAQ -->
    <div class="grid2 mt16">
      <div class="card"><h3>🏆 GEO优化规则（14条）</h3><div id="geoRules"></div></div>
      <div class="card"><h3>❓ AI搜索FAQ库</h3><div id="geoFAQ"></div></div>
    </div>
  `;
  loadPrompts();
  loadGeoData();
}

// ==================== 提示词管理 ====================
let prompts = [
  { keyword: '宜昌中医芳香疗法', intent: 'informational', priority: 'high', optimized: true, note: '品牌词+地域词，核心占位' },
  { keyword: '精油推拿哪家好', intent: 'commercial', priority: 'high', optimized: true, note: '商业意图，截流竞品' },
  { keyword: '九体辨识怎么判断体质', intent: 'informational', priority: 'high', optimized: true, note: '问题类长尾，科普引流' },
  { keyword: '宜昌美容养生馆推荐', intent: 'commercial', priority: 'high', optimized: true, note: '地域+商业意图' },
  { keyword: '芳香疗法SPA宜昌', intent: 'navigational', priority: 'medium', optimized: true, note: '导航意图' },
  { keyword: '气虚体质怎么调理', intent: 'informational', priority: 'medium', optimized: false, note: '体质科普引流' },
  { keyword: '精油按摩多少钱一次', intent: 'transactional', priority: 'medium', optimized: false, note: '价格敏感，转化型' },
  { keyword: '屈原香草文化', intent: 'informational', priority: 'medium', optimized: false, note: '文化品牌差异化' },
  { keyword: '中医芳疗师培训', intent: 'commercial', priority: 'low', optimized: false, note: '培训招生' },
  { keyword: '腕家H1手表有用吗', intent: 'commercial', priority: 'low', optimized: false, note: '产品词引流' },
];

function loadPrompts() {
  const el = document.getElementById('promptManager');
  el.innerHTML = `
    <div class="flex gap6 mb12">
      <input id="newKeyword" placeholder="新搜索词..." style="flex:1">
      <select id="newIntent" style="width:150px">
        <option value="informational">信息型</option><option value="commercial">商业型</option>
        <option value="navigational">导航型</option><option value="transactional">交易型</option>
      </select>
      <select id="newPriority" style="width:120px"><option value="high">高优先</option><option value="medium">中优先</option><option value="low">低优先</option></select>
      <button class="btn sm" onclick="addPrompt()">+ 添加</button>
    </div>
    <div style="max-height:350px;overflow-y:auto">
      ${prompts.map((p,i)=>`<div class="row">
        <div class="grow"><b>🔍 "${p.keyword}"</b>
          <div class="meta">意图:${p.intent} | 优先级:${p.priority} | ${p.note}</div></div>
        <span class="badge ${p.optimized?'b-published':'b-pending'}">${p.optimized?'已优化':'待优化'}</span>
        <button class="btn ghost sm" onclick="optimizePrompt(${i})">优化</button>
        <button class="btn ghost sm" onclick="deletePrompt(${i})">✕</button>
      </div>`).join('')}
    </div>
    <div class="hint mt12">提示词自动关联到百度AI搜索、抖音搜索、小红书搜索、微信搜一搜、B站搜索的内容优化</div>`;
}

window.addPrompt = function() {
  const kw = document.getElementById('newKeyword').value.trim();
  if (!kw) return toast('请输入搜索词');
  prompts.push({ keyword: kw, intent: document.getElementById('newIntent').value, priority: document.getElementById('newPriority').value, optimized: false, note: '新增' });
  document.getElementById('newKeyword').value = '';
  loadPrompts();
  toast('已添加');
};

window.optimizePrompt = function(i) {
  prompts[i].optimized = true;
  loadPrompts();
  toast(`"${prompts[i].keyword}" 已优化`);
};

window.deletePrompt = function(i) {
  prompts.splice(i, 1);
  loadPrompts();
  toast('已删除');
};

// ==================== GEO数据 ====================
function loadGeoData() {
  document.getElementById('geoKeywords').innerHTML = `
    <div class="row"><b>L1 核心词</b><span class="meta">中医芳香疗法、精油SPA、九体辨识</span></div>
    <div class="row"><b>L2 长尾词</b><span class="meta">气虚怎么调理精油、宜昌精油推拿推荐</span></div>
    <div class="row"><b>L3 问题词</b><span class="meta">精油按摩有用吗、怎么判断体质</span></div>
    <div class="row"><b>L4 地域词</b><span class="meta">宜昌美容院、伍家岗养生馆、湖北芳疗</span></div>
    <div class="row"><b>L5 竞品词</b><span class="meta">中医芳疗vs传统美容、精油vs护肤品</span></div>
    <div class="hint mt12">覆盖百度AI搜索/抖音搜索/小红书搜索/微信搜一搜/B站搜索 200+关键词</div>`;

  document.getElementById('geoRankings').innerHTML = `
    <div class="row"><div class="grow">中医芳香疗法 宜昌</div><span class="badge b-published">第1名</span></div>
    <div class="row"><div class="grow">精油推拿 宜昌</div><span class="badge b-active">第3名</span></div>
    <div class="row"><div class="grow">体质调理 宜昌</div><span class="badge b-published">第2名</span></div>
    <div class="row"><div class="grow">屈原香草文化 芳疗</div><span class="badge b-published">第1名</span></div>
    <div class="row"><div class="grow">宜昌美容养生推荐</div><span class="badge b-active">第4名</span></div>`;

  document.getElementById('geoRules').innerHTML = [
    '标题含核心关键词', '首段100字内出现关键词', 'H2/H3标签含长尾词',
    '正文关���词密度2-5%', '元描述150字含CTA', '结构化数据标记(Schema)',
    '内链外链优化', '图片alt标签', '地域标签嵌入',
    'FAQ结构化', '内容原创度>80%', '页面加载速度<3秒',
    '移动端适配', '社交媒体分享优化'
  ].map((r,i)=>`<div class="row"><div class="grow">${i+1}. ${r}</div><span class="badge b-active">已启用</span></div>`).join('');

  document.getElementById('geoFAQ').innerHTML = [
    '中医芳香疗法是什么？', '九体辨识怎么判断自己的体质？', '精油SPA有哪些好处？',
    '中芳堂在宜昌哪里？', '第一次到店有什么优惠？', '精油按摩和普通按摩有什么区别？',
    '屈原和中医芳香疗法有什么关系？', '腕家H1手表怎么用？'
  ].map(f=>`<div class="row"><div class="grow">❓ ${f}</div><span class="badge b-active">已优化</span></div>`).join('');
}

function toast(m) { const t = document.getElementById('toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); } }
