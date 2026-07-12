/**
 * 发布管理 - 对接真实平台资产
 *
 * 用户实际资产：
 * - 蚁小二：��平台一键分发（抖音/小红书/视频号/快手/B站）
 * - 抖音来客：屈氏美容美体服务部（门店认领+团购）
 * - 小红书：个人号
 * - 公众号：服务号(已认证)
 * - 视频号：2个号 + 视频号小店
 * - B站：个人号 / 快手：个人号
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>📡 多平台发布中枢</h3>
      <div class="hint">内容生产线 → 蚁小二多平台分发 → 各平台自动/半自动发布</div>
    </div>

    <!-- 平台状态 -->
    <div class="card mt16">
      <h3>🔗 实际平台资产对接</h3>
      <div id="realPlatforms"></div>
    </div>

    <!-- 发布方式 -->
    <div class="grid2 mt16">
      <div class="card">
        <h3>⚡ 蚁小二一键分发</h3>
        <div class="hint">多平台内容同步发布（抖音/小红书/视频号/快手/B站）</div>
        <div id="antDispatch"></div>
        <div class="mt12">
          <label>选择内容</label>
          <select id="pub_content" onchange="previewContent()"><option value="">-- 从内容库选择 --</option></select>
          <div id="pub_preview" class="mt12"></div>
          <button class="btn mt12" onclick="dispatchToAnt()">📡 通过蚁小二分发</button>
          <div class="hint">内容自动同步到蚁小二 → 一键发布到已绑定平台</div>
        </div>
      </div>
      <div class="card">
        <h3>📋 发布队列</h3>
        <div id="publishQueue"></div>
      </div>
    </div>

    <!-- 发布记录 -->
    <div class="card mt16">
      <h3>📜 发布记录</h3>
      <div id="publishRecords"></div>
    </div>
  `;

  await Promise.all([loadRealPlatforms(), loadQueue(), loadRecords(), loadContentSelect()]);
}

function loadRealPlatforms() {
  const platforms = [
    { name: '蚁小二', account: '多平台一键分发', status: 'active', publishMode: '一键分发', detail: '同时发布到抖音/小红书/视频号/快手/B站' },
    { name: '抖音来客', account: '屈氏美容美体服务��', status: 'active', publishMode: '半自动', detail: '门店认领+团购+预约+评价管理' },
    { name: '小红书', account: '个人号', status: 'active', publishMode: '半自动', detail: '种草笔记+图文帖+私信截流' },
    { name: '视频号(1号)', account: '中芳堂主号', status: 'active', publishMode: '全自动', detail: '短视频+直播+商品橱窗' },
    { name: '视频号(2号)', account: '中芳堂副号', status: 'active', publishMode: '全自动', detail: '矩阵号互补内容' },
    { name: '视频号小店', account: '微信视频号小店', status: 'active', publishMode: '全自动', detail: '商品橱窗+直播带货' },
    { name: '公众号', account: '服务号(已认证)', status: 'active', publishMode: '全自动', detail: '模板消息+菜单+客服+文章' },
    { name: 'B站', account: '个人号', status: 'active', publishMode: '全自动', detail: '知识科普长视频' },
    { name: '快手', account: '个人号', status: 'active', publishMode: '半自动', detail: '老铁风格短视频' },
  ];

  document.getElementById('realPlatforms').innerHTML = platforms.map(p => `
    <div class="row">
      <div class="grow">
        <b>${esc(p.name)}</b> <span class="meta">· ${esc(p.account)}</span>
        <div class="meta">${esc(p.detail)}</div>
      </div>
      <span class="badge b-${p.status}">已对接</span>
      <span class="badge ${p.publishMode==='全自动'?'b-active':'b-pending'}">${p.publishMode}</span>
    </div>
  `).join('');
}

function loadAntDispatch() {
  document.getElementById('antDispatch').innerHTML = `
    <div class="row"><div class="grow">抖音</div><span class="badge b-active">蚁小二已绑定</span></div>
    <div class="row"><div class="grow">小红书</div><span class="badge b-active">蚁小二已绑定</span></div>
    <div class="row"><div class="grow">视频号</div><span class="badge b-active">蚁小二已绑定</span></div>
    <div class="row"><div class="grow">快手</div><span class="badge b-active">蚁小二已绑定</span></div>
    <div class="row"><div class="grow">B站</div><span class="badge b-active">蚁小二已绑定</span></div>
  `;
}

async function loadContentSelect() {
  const { ok, j } = await API.content.list();
  if (!ok || !j.success) return;
  const items = (j.data || []).filter(c => c.status === 'draft');
  document.getElementById('pub_content').innerHTML = '<option value="">-- 选择内容 --</option>' +
    items.map(c => `<option value="${c._id}">[${c.platform}] ${(c.title||'').substring(0,50)}</option>`).join('');
}

window.previewContent = async function() {
  const id = document.getElementById('pub_content').value;
  if (!id) return;
  const { ok, j } = await API.content.list();
  if (!ok) return;
  const item = (j.data || []).find(c => c._id === id);
  if (item) {
    document.getElementById('pub_preview').innerHTML = `
      <pre style="max-height:120px">${esc(item.body||'').substring(0,300)}</pre>
      <div class="meta">标签：${(item.hashtags||[]).map(h=>'#'+h).join(' ')}</div>`;
  }
};

window.dispatchToAnt = async function() {
  const id = document.getElementById('pub_content').value;
  if (!id) return toast('请选择内容');
  const { ok, j } = await API.content.publish(id);
  if (ok && j.success) {
    toast('内容已通过蚁小二分发到多平台');
    loadQueue();
    loadRecords();
  } else {
    toast('分发失败');
  }
};

async function loadQueue() {
  const { ok, j } = await API.content.list();
  if (!ok || !j.success) return;
  const pending = (j.data || []).filter(c => c.status === 'draft' || c.status === 'pending');
  document.getElementById('publishQueue').innerHTML = pending.length ? pending.slice(0, 8).map(c => `
    <div class="row">
      <div class="grow">
        <div class="ell"><b>${esc(c.title||'未命名')}</b></div>
        <div class="meta">${esc(c.platform)} · ${c.type==='video'?'🎬脚本':c.type==='poster'?'🖼️海报':'📝文案'} · <span class="badge b-${c.status}">${c.status}</span></div>
      </div>
      <button class="btn sm green" onclick="quickPublish('${c._id}')">📡 分发</button>
    </div>
  `).join('') : '<div class="empty">✅ 队列为空</div>';
}

async function loadRecords() {
  const { ok, j } = await API.publish.records('?limit=20');
  if (!ok || !j.success) return;
  const records = j.data || [];
  document.getElementById('publishRecords').innerHTML = records.length ? records.map(r => `
    <div class="row">
      <div class="grow"><div class="ell"><b>${esc(r.title||'未命名')}</b></div>
      <div class="meta">${esc(r.platform)} · <span class="badge b-${esc(r.status)}">${esc(r.status)}</span> · ${r.createdAt?new Date(r.createdAt).toLocaleString('zh-CN'):''}</div></div>
    </div>
  `).join('') : '<div class="empty">暂无记录</div>';
}

window.quickPublish = async function(id) {
  const { ok, j } = await API.content.publish(id);
  toast(ok && j.success ? '已分发' : '失败');
  if (ok) { loadQueue(); loadRecords(); }
};

function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function toast(m) { const t = document.getElementById('toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); } }
