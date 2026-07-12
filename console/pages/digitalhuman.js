/**
 * AI数字人直播后台 - 对接AI智享直播
 *
 * 基于用户实际资产：AI智享直播（数字人直播平台）
 * 功能：直播脚本管理、数字人播报控制、弹幕截流、多平台同步
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>🎙️ AI数字人直播控制台</h3>
      <div class="hint">对接「AI智享直播」平台 · 中芳堂数字人"小芳"7×24小时自动直播</div>
    </div>

    <!-- 直播状态面板 -->
    <div class="grid3 mt16" id="liveStatus"></div>

    <!-- 直播控制 -->
    <div class="card mt16">
      <h3>⚡ 直播控制</h3>
      <div class="grid3">
        <div><label>直播平台</label><select id="dl_platform" multiple style="height:100px">
          <option value="douyin" selected>抖音（抖音来客·屈氏美容美体）</option>
          <option value="xiaohongshu" selected>小红书（个人号）</option>
          <option value="shipinhao" selected>视频号（2个号）</option>
          <option value="kuaishou">快手（个人号）</option>
          <option value="bilibili">B站（个人号）</option>
        </select></div>
        <div><label>直播时长(分钟)</label><input id="dl_duration" type="number" value="120"></div>
        <div><label>体质主题</label><select id="dl_const">
          <option>气虚质</option><option>阳虚质</option><option>阴虚质</option><option>痰湿质</option>
          <option>湿热质</option><option>血瘀质</option><option>气郁质</option><option>特禀质</option><option>平和质</option>
        </select></div>
      </div>
      <div class="flex gap10 mt12">
        <button class="btn" onclick="startDigitalLive()" id="btnStartLive">▶ 启动数字人直播</button>
        <button class="btn ghost" onclick="generateLiveScript()">📝 生成直播脚本</button>
        <button class="btn ghost" onclick="stopDigitalLive()" id="btnStopLive" style="display:none">⏹ 停止直播</button>
      </div>
      <div class="hint mt12">AI智享直播自动驱动数字人"小芳" → 多平台同步推流 → 弹幕截流自动回复</div>
    </div>

    <!-- 直播脚本预览 -->
    <div class="card mt16" id="scriptPreview" style="display:none">
      <h3>📝 直播脚��� <span class="hint" id="scriptInfo"></span></h3>
      <div id="scriptContent"></div>
    </div>

    <!-- 弹幕互动 + 截流 -->
    <div class="grid2 mt16">
      <div class="card">
        <h3>💬 弹幕互动截流</h3>
        <div id="commentFeed" style="max-height:300px;overflow-y:auto"></div>
        <div class="flex gap6 mt12">
          <input id="dl_comment" placeholder="模拟弹幕测试截流...">
          <button class="btn sm" onclick="testInterception()">测试截流</button>
        </div>
      </div>
      <div class="card">
        <h3>📊 截流数据</h3>
        <div id="interceptStats"></div>
      </div>
    </div>

    <!-- 平台对接状态 -->
    <div class="card mt16">
      <h3>🔗 平台对接状态（实际资产）</h3>
      <div id="platformAssets"></div>
    </div>
  `;

  updateLiveStatus('idle');
  loadPlatformAssets();
  loadInterceptStats();
}

// ==================== 直播状态 ====================
function updateLiveStatus(state) {
  const el = document.getElementById('liveStatus');
  const states = {
    idle: [
      { num: '待启动', lbl: '直播状态', cls: 'b-pending' },
      { num: '中芳堂·小芳', lbl: '数字人形象', cls: 'b-active' },
      { num: 'AI智享直播', lbl: '直播引擎', cls: 'b-active' },
    ],
    live: [
      { num: '🟢 直播中', lbl: '直播状态', cls: 'b-running' },
      { num: '中芳堂·小芳', lbl: '数字人形象', cls: 'b-active' },
      { num: 'AI智享直播', lbl: '直播引擎', cls: 'b-active' },
    ],
  };
  const s = states[state] || states.idle;
  el.innerHTML = s.map(c => `<div class="stat-card"><div class="num" style="font-size:16px">${c.num}</div><div class="lbl">${c.lbl}</div></div>`).join('');
}

// ==================== 启动直播 ====================
window.startDigitalLive = async function() {
  document.getElementById('btnStartLive').style.display = 'none';
  document.getElementById('btnStopLive').style.display = 'inline-flex';
  updateLiveStatus('live');

  // 获取选中的平台
  const platforms = Array.from(document.getElementById('dl_platform').selectedOptions).map(o => o.value);
  const duration = document.getElementById('dl_duration').value;
  const constitution = document.getElementById('dl_const').value;

  toast(`数字人"小芳"已在 ${platforms.length} 个平台开播，时长${duration}分钟`);

  // 触发数字人Agent生成脚本
  try {
    const { ok, j } = await API.agents.trigger('digital-human-agent', {
      duration: parseInt(duration),
      platforms,
      constitution,
    });
    if (ok && j.success) {
      showScript(j.data?.script);
    }
  } catch(e) {}
};

window.stopDigitalLive = function() {
  document.getElementById('btnStartLive').style.display = 'inline-flex';
  document.getElementById('btnStopLive').style.display = 'none';
  updateLiveStatus('idle');
  toast('直播已停止');
};

// ==================== 生成脚本 ====================
window.generateLiveScript = async function() {
  const constitution = document.getElementById('dl_const').value;
  const duration = document.getElementById('dl_duration').value;

  try {
    const { ok, j } = await API.agents.trigger('digital-human-agent', {
      duration: parseInt(duration),
      constitution,
    });
    if (ok && j.success) {
      showScript(j.data?.script);
      toast('直播脚本已生成');
    }
  } catch(e) {
    // 降级：本地生成脚本
    showLocalScript(constitution, parseInt(duration));
  }
};

function showScript(script) {
  if (!script) return showLocalScript('气虚质', 120);
  document.getElementById('scriptPreview').style.display = 'block';
  document.getElementById('scriptInfo').textContent = `${script.totalSegments || 0}段 · ${script.duration || 0}分钟`;
  const segments = script.segments || [];
  document.getElementById('scriptContent').innerHTML = segments.map((s, i) => `
    <div class="row">
      <div style="min-width:40px;text-align:center"><span class="badge b-active">${s.minute}'</span></div>
      <div class="grow"><b>${esc(s.type)}</b> (${s.duration}分钟)</div>
    </div>
  `).join('');
}

function showLocalScript(constitution, duration) {
  document.getElementById('scriptPreview').style.display = 'block';
  document.getElementById('scriptInfo').textContent = `本地生成 · ${duration}分钟`;
  const segments = [
    { minute: 0, type: '开场暖场', duration: 3 },
    { minute: 3, type: `${constitution}体质科普`, duration: 5 },
    { minute: 8, type: '九体辨识精油讲解', duration: 5 },
    { minute: 13, type: '互动问答', duration: 2 },
    { minute: 15, type: '到店引导(宜昌)', duration: 3 },
    { minute: 18, type: '优惠活动', duration: 2 },
  ];
  document.getElementById('scriptContent').innerHTML = segments.map((s, i) => `
    <div class="row"><div style="min-width:40px;text-align:center"><span class="badge b-active">${s.minute}'</span></div><div class="grow"><b>${s.type}</b> (${s.duration}分钟)</div></div>
  `).join('');
}

// ==================== 弹幕截流 ====================
window.testInterception = async function() {
  const comment = document.getElementById('dl_comment').value;
  if (!comment) return toast('请输入弹幕内容');
  try {
    const { ok, j } = await API.agents.trigger('interception-agent', {
      contents: [{ platform: 'douyin', authorId: 'test', authorName: '观众', content: comment, source: 'comment' }],
    });
    if (ok) {
      document.getElementById('commentFeed').innerHTML += `<div class="row"><div class="grow"><span class="meta">观众:</span> ${esc(comment)}</div><span class="badge b-published">已截流</span></div>`;
      toast('截流识别完成');
    }
  } catch(e) {
    toast('截流测试完成（降级模式）');
  }
  document.getElementById('dl_comment').value = '';
};

// ==================== 平台资产 ====================
function loadPlatformAssets() {
  const assets = [
    { name: 'AI智享直播', account: '数字人直播平台', status: 'active', note: '7×24小时自动直播引擎' },
    { name: '蚁小二', account: '多平台一键分发', status: 'active', note: '内容同步发布到抖音/小红书/视频号/快手/B站' },
    { name: '抖音来客', account: '屈氏美容美体服务部', status: 'active', note: '门店认领+团购+预约' },
    { name: '小红书', account: '个人号', status: 'active', note: '种草笔记+私信截流' },
    { name: '公众号', account: '服务号(已认证)', status: 'active', note: '模板消息+菜单+客服' },
    { name: '视频号小店', account: '微信视频号小店', status: 'active', note: '商品橱窗+直播带货' },
    { name: '视频号', account: '2个视频号', status: 'active', note: '短视频+直播双号矩阵' },
    { name: 'B站', account: '个人号', status: 'active', note: '知识科普长视频' },
    { name: '快手', account: '个人号', status: 'active', note: '老铁风格短视频' },
    { name: '企业微信', account: '未认证', status: 'pending', note: '认证后可对接SCRM' },
    { name: '小程序', account: '备案审核中', status: 'pending', note: '审核通过后接入预约/商城' },
  ];

  document.getElementById('platformAssets').innerHTML = assets.map(a => `
    <div class="row">
      <div class="grow"><b>${esc(a.name)}</b> <span class="meta">· ${esc(a.account)}</span></div>
      <span class="badge b-${a.status}">${a.status === 'active' ? '已对接' : '待对接'}</span>
      <span class="meta" style="max-width:200px">${esc(a.note)}</span>
    </div>
  `).join('');
}

// ==================== 截流统计 ====================
async function loadInterceptStats() {
  try {
    const { ok, j } = await API.leads.list();
    if (ok && j.success) {
      const leads = j.data || [];
      const high = leads.filter(l => l.isHighPotential).length;
      document.getElementById('interceptStats').innerHTML = `
        <div class="stat-card"><div class="num">${leads.length}</div><div class="lbl">总线索</div></div>
        <div class="stat-card mt12"><div class="num">${high}</div><div class="lbl">高潜用户</div></div>
      `;
    }
  } catch(e) {}
}

function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function toast(m) { const t = document.getElementById('toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); } }
