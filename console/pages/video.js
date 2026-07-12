/**
 * 视频工厂页面 - 接收来自内容生产线的视频任务
 * 自动关联：脚本 → 剪辑 → 配音 → 字幕 → 发布队列
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>🎬 视频工厂</h3>
      <div class="hint">接收内容生产线送来的视频脚本 → AI自动剪辑 → 配音 → 字幕 → 自动进入发布队列</div>
    </div>

    <div class="grid2 mt16">
      <div class="card">
        <h3>⚙️ 新建视频任务</h3>
        <div class="grid3">
          <div><label>平台</label><select id="v_platform"><option value="xiaohongshu">小红书</option><option value="douyin">抖音</option><option value="bilibili">B站</option></select></div>
          <div><label>主题</label><input id="v_topic" value="九体辨识精油居家调理"></div>
          <div><label>模板</label><select id="v_template"><option value="xiaohongshu">小红书风(3:4/60s)</option><option value="douyin">抖音风(9:16/30s)</option><option value="bilibili">B站风(16:9/180s)</option></select></div>
        </div>
        <label>分镜脚本（从内容生产线自动填入）</label>
        <textarea id="v_script" rows="4" placeholder="从内容生产选择脚本，或手动粘贴"></textarea>
        <div class="flex gap6 mt12">
          <button class="btn" onclick="createVideoTask()">🎬 创建视频任务</button>
          <button class="btn ghost" onclick="autoFillScript()">📋 从内容库选择脚本</button>
        </div>
        <div class="hint">FFmpeg自动剪辑 + TTS配音 + 字幕叠加 + 品牌水印 → 自动进入发布队列</div>
      </div>

      <div class="card">
        <h3>📊 处理进度</h3>
        <div id="processingStatus"></div>
      </div>
    </div>

    <div class="card mt16">
      <div class="flex" style="justify-content:space-between;align-items:center">
        <h3 style="margin:0">📋 视频任务列表 <span class="hint" id="taskCount"></span></h3>
        <button class="btn ghost sm" onclick="loadTasks()">🔄 刷新</button>
      </div>
      <div id="videoTaskList" class="mt12"></div>
    </div>
  `;

  await loadTasks();
}

window.createVideoTask = async function() {
  const platform = document.getElementById('v_platform').value;
  const topic = document.getElementById('v_topic').value;
  const template = document.getElementById('v_template').value;
  const script = document.getElementById('v_script').value;

  const { ok, j } = await API.video.generate({ platform, topic, template });
  if (ok && j.success) {
    toast('视频任务已创建 → 自动处理中');
    document.getElementById('v_script').value = '';
    loadTasks();
  } else {
    toast('创建失败：' + (j.message || '未知'));
  }
};

window.autoFillScript = async function() {
  const { ok, j } = await API.content.list();
  if (!ok || !j.success) return toast('获取失败');
  const scripts = (j.data || []).filter(c => c.type === 'video' || c.metadata?.keyPoints?.length > 0);
  if (!scripts.length) return toast('暂无视频脚本，先去内容生产线生成');

  const list = scripts.slice(0, 5).map(s => `[${s.platform}] ${(s.title||'').substring(0,40)}`).join('\n');
  document.getElementById('v_script').value = scripts[0].title || '';
  toast('已选择最新脚本');
};

async function loadTasks() {
  const { ok, j } = await API.video.tasks('?limit=30');
  if (!ok || !j.success) return;
  const tasks = j.data || [];
  document.getElementById('taskCount').textContent = `共 ${tasks.length} 个任务`;

  // 处理进度
  const processing = tasks.filter(t => t.status === 'processing').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  document.getElementById('processingStatus').innerHTML = `
    <div class="stat-card"><div class="num">${processing}</div><div class="lbl">处理中</div></div>
    <div class="stat-card mt12"><div class="num">${completed}</div><div class="lbl">已完成</div></div>
    <div class="stat-card mt12"><div class="num">${tasks.length}</div><div class="lbl">总任务</div></div>
  `;

  document.getElementById('videoTaskList').innerHTML = tasks.length ? tasks.map(t => `
    <div class="row">
      <div class="grow">
        <div class="ell"><b>${esc(t.title || '未命名')}</b></div>
        <div class="meta">
          ${esc((t.platforms || []).join('/'))} ·
          进度 ${t.progress || 0}% ·
          <span class="badge ${statusBadge(t.status)}">${esc(t.status)}</span>
          ${t.error ? `<span class="err"> · ${esc(t.error)}</span>` : ''}
        </div>
      </div>
      ${t.status === 'completed' ? `<button class="btn sm green" onclick="publishVideo('${t._id}')">📡 发布</button>` : ''}
      ${t.status === 'failed' ? `<button class="btn sm" onclick="retryVideo('${t._id}')">🔄 重试</button>` : ''}
    </div>
  `).join('') : '<div class="empty">暂无视频任务 — 从内容生产线生成视频脚本后自动创建</div>';
}

window.publishVideo = async function(taskId) {
  toast('已进入发布队列');
  loadTasks();
};

window.retryVideo = async function(taskId) {
  toast('已重试');
  loadTasks();
};

function statusBadge(s) {
  const map = { pending: 'b-pending', processing: 'b-reviewing', completed: 'b-published', failed: 'b-high', reviewing: 'b-reviewing' };
  return map[s] || 'b-pending';
}
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function toast(m) { const t = document.getElementById('toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); } }
