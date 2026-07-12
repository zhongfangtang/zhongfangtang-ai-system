/**
 * 内容生产页面 - AI全自动生产线
 *
 * 三合一生产线：
 *   文案 → 内容库 → 发布队列
 *   视频脚本 → 视频工厂 → 自动剪辑 → 发布队列
 *   图片 → 海报/封面 → 素材库 → 发布队列
 *
 * 所有模块自动关联，无需手动跳转。
 */
import * as API from '../js/api.js';

let lastGenerated = {};

export async function render(el) {
  el.innerHTML = `
    <div class="card">
      <h3>⚡ AI内容生产线</h3>
      <div class="hint" style="margin-bottom:12px">文案/脚本/图片 一键生成 → 自动关联视频工厂 → 自动进入发布队列</div>

      <!-- 类型选择 Tab -->
      <div class="flex gap6" style="margin-bottom:16px" id="typeTabs">
        <button class="btn on" data-type="copywriting" onclick="selectType('copywriting')">📝 文案生成</button>
        <button class="btn ghost" data-type="script" onclick="selectType('script')">🎬 视频脚本</button>
        <button class="btn ghost" data-type="poster" onclick="selectType('poster')">🖼️ 图片/海报</button>
      </div>

      <!-- 公共参数 -->
      <div class="grid3">
        <div><label>平台</label><select id="c_platform">
          <option value="xiaohongshu">小红书</option><option value="douyin">抖音</option>
          <option value="weixin">公众号</option><option value="kuaishou">快手</option>
          <option value="bilibili">B站</option><option value="baijiahao">百家号</option>
        </select></div>
        <div><label>体质（九体辨识）</label><select id="c_const">
          <option>平和质</option><option>气虚质</option><option>阳虚质</option><option>阴虚质</option>
          <option>痰湿质</option><option>湿热质</option><option>血瘀质</option><option>气郁质</option><option>特禀质</option>
        </select></div>
        <div><label>主题 / 选题</label><input id="c_topic" value="九体辨识精油居家调理"></div>
      </div>

      <!-- 文案参数 -->
      <div id="params-copywriting">
        <label>文案类型</label>
        <select id="c_type"><option value="article">图文/文章</option><option value="image_text">图文帖</option></select>
      </div>

      <!-- 脚本参数 -->
      <div id="params-script" style="display:none">
        <div class="grid3">
          <div><label>视频时长(秒)</label><input id="c_duration" type="number" value="60"></div>
          <div><label>视频模板</label><select id="c_vtemplate"><option value="xiaohongshu">小红书风</option><option value="douyin">抖音风</option><option value="bilibili">B站科普风</option></select></div>
          <div><label>自动进入视频工厂</label><select id="c_autoVideo"><option value="true">✅ 是（生成脚本后自动制作视频）</option><option value="false">否（仅生成脚本）</option></select></div>
        </div>
      </div>

      <!-- 图片参数 -->
      <div id="params-poster" style="display:none">
        <div class="grid3">
          <div><label>图片类型</label><select id="c_imgType"><option value="promotion">促销海报</option><option value="education">知识科普</option><option value="branding">品牌形象</option><option value="cover">小红书封面</option></select></div>
          <div><label>产品</label><input id="c_product" value="九体辨识复方精油"></div>
          <div><label>自动进入发布</label><select id="c_autoPublish"><option value="true">✅ 是（生成后自动发布）</option><option value="false">否（手动发布）</option></select></div>
        </div>
      </div>

      <!-- 流水线开关 -->
      <div class="flex gap10 mt16" style="align-items:center">
        <label style="margin:0;display:flex;align-items:center;gap:6px">
          <input type="checkbox" id="c_autoChain" checked style="width:auto;accent-color:var(--gold)">
          <span>自动串联（生成→入库→发布/视频工厂）</span>
        </label>
      </div>

      <button class="btn mt12" id="btnGenerate" onclick="genContent()" style="font-size:15px;padding:11px 24px">⚡ 一键生成</button>
      <div class="hint" id="genMode"></div>
    </div>

    <!-- 生成结果 -->
    <div class="card" id="genResult" style="display:none">
      <div class="flex" style="justify-content:space-between;align-items:center">
        <h3 id="gr_title" style="margin:0"></h3>
        <span class="badge" id="gr_status"></span>
      </div>
      <pre id="gr_body" style="margin-top:12px"></pre>
      <div id="gr_extra" class="hint"></div>

      <!-- 关联操作 -->
      <div id="gr_chain" class="mt12" style="display:none">
        <div class="flex gap6" style="flex-wrap:wrap">
          <button class="btn green sm" onclick="publishNow()">📡 立即发布</button>
          <button class="btn blue sm" id="btn_video" onclick="sendToVideo()" style="display:none">🎬 送视频工厂</button>
          <button class="btn sm" id="btn_poster" onclick="genPosterFromScript()" style="display:none">🖼️ 生成配套海报</button>
          <button class="btn ghost sm" onclick="copyResult()">📋 复制原文</button>
          <button class="btn ghost sm" id="btn_copy_douyin" onclick="copyForDouyin()" style="display:none">📱 一键复制(抖音格式)</button>
          <button class="btn ghost sm" id="btn_dl_video" onclick="downloadVideo()" style="display:none">⬇️ 下载视频</button>
        </div>
        <!-- 抖音发布指引 -->
        <div id="douyin_guide" class="hint mt12" style="display:none;background:#1a1a2e;border-radius:10px;padding:12px 14px;color:#ccc">
          <b style="color:#f0c040">📱 发布到抖音步骤：</b><br>
          1⃣ 点上方「⬇️ 下载视频」保存到手机<br>
          2⃣ 打开 <a href="https://creator.douyin.com/creator-micro/content/upload" target="_blank" style="color:#60a5fa;text-decoration:underline" rel="noopener">抖音创作者中心 → 发布视频</a><br>
          3⃣ 点「📱 一键复制(抖音格式)」，在标题栏 Ctrl+V<br>
          4⃣ 上传视频 → 填写描述 → #话题标签自动带出 → 发布 ✅<br>
          <span style="font-size:11px;color:#888">（全程约2分钟，AI已帮你完成90%的工作）</span>
        </div>
        <div id="gr_chainStatus" class="hint mt12"></div>
      </div>
    </div>

    <!-- 内容库 -->
    <div class="card mt16">
      <div class="flex" style="justify-content:space-between;align-items:center">
        <h3 style="margin:0">📚 内容库 <span class="hint" id="c_count"></span></h3>
        <div class="flex gap6">
          <select id="c_filter" onchange="loadContent()" style="width:auto">
            <option value="">全部</option><option value="copywriting">文案</option><option value="script">视频脚本</option><option value="poster">图片/海报</option>
          </select>
          <button class="btn ghost sm" onclick="loadContent()">🔄 刷新</button>
        </div>
      </div>
      <div id="contentList" class="mt12"></div>
    </div>
  `;

  selectType('copywriting');
  await loadContent();
}

window.selectType = function(type) {
  document.querySelectorAll('#typeTabs button').forEach(b => b.classList.toggle('on', b.dataset.type === type));
  document.getElementById('params-copywriting').style.display = type === 'copywriting' ? 'block' : 'none';
  document.getElementById('params-script').style.display = type === 'script' ? 'block' : 'none';
  document.getElementById('params-poster').style.display = type === 'poster' ? 'block' : 'none';
  window._genType = type;
};

// ==================== 核心：一键生成 ====================
window.genContent = async function() {
  const type = window._genType || 'copywriting';
  const autoChain = document.getElementById('c_autoChain').checked;
  const btn = document.getElementById('btnGenerate');
  if (btn) { btn.disabled = true; btn.textContent = '生成中…'; }

  const platform = document.getElementById('c_platform').value;
  const constitution = document.getElementById('c_const').value;
  const topic = document.getElementById('c_topic').value;
  let result;

  try {
    switch (type) {
      case 'copywriting':
        result = await generateCopywriting(platform, constitution, topic);
        break;
      case 'script':
        result = await generateScript(platform, constitution, topic);
        break;
      case 'poster':
        result = await generatePoster(platform, constitution, topic);
        break;
    }

    if (result) {
      showResult(result, type);

      // 自动串联流程
      if (autoChain) {
        await autoChainFlow(result, type, platform);
      }
    }
  } catch (e) {
    toast('生成失败：' + e.message);
    console.error('genContent error:', e);
  }

  if (btn) { btn.disabled = false; btn.textContent = '⚡ 一键生成'; }
  loadContent();
};

// ==================== 各类型生成 ====================
async function generateCopywriting(platform, constitution, topic) {
  const ctype = document.getElementById('c_type').value;
  const { ok, j } = await API.content.generate({
    platform, constitution, topic, type: ctype,
  });
  if (!ok || !j.success) throw new Error(j.message || '生成失败');
  return { ...j.data, contentType: 'copywriting', platform };
}

async function generateScript(platform, constitution, topic) {
  const duration = document.getElementById('c_duration').value;
  const { ok, j } = await API.content.generateVideoScript({
    platform, topic, constitution, duration: parseInt(duration),
  });
  if (!ok || !j.success) throw new Error(j.message || '生成失败');
  return { ...j.data, contentType: 'script', platform };
}

async function generatePoster(platform, constitution, topic) {
  const imgType = document.getElementById('c_imgType').value;
  const product = document.getElementById('c_product').value;
  // 通过内容生成API生成海报描述，然后触发图片生成
  const { ok, j } = await API.content.generate({
    platform, constitution, topic, type: 'poster',
  });
  if (!ok || !j.success) throw new Error(j.message || '生成失败');
  return { ...j.data, contentType: 'poster', imgType, product, platform };
}

// ==================== 自动串联流水线 ====================
async function autoChainFlow(result, type, platform) {
  const statusEl = document.getElementById('gr_chainStatus');
  const chainEl = document.getElementById('gr_chain');
  chainEl.style.display = 'block';
  statusEl.innerHTML = '<span class="badge b-reviewing">⏳ 自动串联中…</span>';

  const steps = [];

  try {
    // Step 1: 自动发布到内容库（已由generate完成）
    steps.push('✅ 已入库');

    // Step 2: 视频脚本 → 自动创建视频任务
    if (type === 'script') {
      const autoVideo = document.getElementById('c_autoVideo').value === 'true';
      if (autoVideo) {
        const vr = await API.video.generate({
          contentId: result._id,
          platform,
          topic: result.title,
          template: document.getElementById('c_vtemplate').value,
        });
        if (vr.success) {
          steps.push('✅ 已送视频工厂');
          document.getElementById('btn_video').style.display = 'inline-flex';
          document.getElementById('btn_video').dataset.videoId = vr.data?.taskId;
        } else {
          steps.push('⚠️ 视频任务创建失败');
        }
      }
    }

    // Step 3: 图片/海报 → 自动发布
    if (type === 'poster') {
      const autoPub = document.getElementById('c_autoPublish').value === 'true';
      if (autoPub && result._id) {
        const pr = await API.content.publish(result._id);
        if (pr.success) {
          steps.push('✅ 已进入发布队列');
        } else {
          steps.push('⚠️ 发布队列添加失败');
        }
      }
    }

    // Step 4: 文案 → 自动生成配套脚本+海报
    if (type === 'copywriting') {
      // 自动生成配套视频脚本
      const sr = await API.content.generateVideoScript({
        platform, topic: result.title, duration: 60,
      });
      if (sr.success) {
        steps.push('✅ 配套脚本已生成');
        document.getElementById('btn_video').style.display = 'inline-flex';
        document.getElementById('btn_video').dataset.autoScript = 'true';
        document.getElementById('btn_poster').style.display = 'inline-flex';
      }

      // 自动进入发布队列
      if (result._id) {
        const pr = await API.content.publish(result._id);
        if (pr.success) steps.push('✅ 已进入发布队列');
      }
    }

    statusEl.innerHTML = steps.map(s => `<div>${s}</div>`).join('');
    document.getElementById('gr_status').textContent = '已串联';
    document.getElementById('gr_status').className = 'badge b-published';

  } catch (e) {
    statusEl.innerHTML = `<span class="err">串联失败：${e.message}</span>`;
  }
}

// ==================== 展示结果 ====================
function showResult(result, type) {
  const el = document.getElementById('genResult');
  el.style.display = 'block';
  document.getElementById('genMode').textContent = result.aiGenerated ? '（AI大模型生成）' : '（知识库组合生成）';

  if (type === 'script') {
    document.getElementById('gr_title').textContent = '🎬 ' + (result.title || '视频脚本');
    const scenes = result.scenes || [];
    document.getElementById('gr_body').textContent = scenes.map(s =>
      `【镜头${s.number}】${s.description}\n台词：${s.narration}\n时长：${s.duration}s\n运镜：${s.camera || '固定'}`
    ).join('\n\n');
    document.getElementById('gr_extra').innerHTML = `总时长：${result.totalDuration || 60}秒 | 平台：${result.platform}`;
  } else if (type === 'poster') {
    document.getElementById('gr_title').textContent = '🖼️ ' + (result.title || '海报');
    document.getElementById('gr_body').textContent = result.body || '海报描述已生成';
    document.getElementById('gr_extra').innerHTML = `类型：${result.imgType || 'promotion'} | 产品：${result.product || '九体辨识复方精油'}`;
  } else {
    document.getElementById('gr_title').textContent = '📝 ' + (result.title || '文案');
    document.getElementById('gr_body').textContent = result.body || '';
    const tags = (result.hashtags || []).map(h => '#' + h).join(' ');
    document.getElementById('gr_extra').innerHTML = '标签：' + tags;
  }

  lastGenerated = result;
  document.getElementById('gr_chain').style.display = 'block';
  document.getElementById('gr_chainStatus').innerHTML = '';
  document.getElementById('gr_status').textContent = type === 'script' ? '脚本' : type === 'poster' ? '海报' : '文案';
  document.getElementById('gr_status').className = 'badge b-pending';

  // 显示/隐藏按钮
  document.getElementById('btn_video').style.display = (type === 'script' || type === 'copywriting') ? 'inline-flex' : 'none';
  document.getElementById('btn_poster').style.display = type === 'copywriting' ? 'inline-flex' : 'none';

  // 抖音专属：一键复制(抖音格式) + 下载视频 + 发布指引
  const isDouyin = (result.platform === 'douyin');
  document.getElementById('btn_copy_douyin').style.display = isDouyin ? 'inline-flex' : 'none';
  document.getElementById('btn_dl_video').style.display = isDouyin && (type === 'script') ? 'inline-flex' : 'none';
  document.getElementById('douyin_guide').style.display = isDouyin ? 'block' : 'none';
}

// ==================== 操作按钮 ====================
window.publishNow = async function() {
  if (!lastGenerated._id) return toast('请先生成内容');
  const { ok, j } = await API.content.publish(lastGenerated._id);
  toast(ok && j.success ? '已进入发布队列' : '发布失败');
};

window.sendToVideo = async function() {
  if (!lastGenerated?._id) {
    // 容错：尝试从最近的内容列表取
    const { ok, j } = await API.content.list();
    if (ok && j.success && j.data?.length) {
      lastGenerated = j.data[0];
    }
    if (!lastGenerated?._id) {
      return toast('请先生成内容（当前无可用草稿）');
    }
  }
  toast('正在发送至视频工厂…');
  const { ok, j } = await API.video.generate({
    contentId: lastGenerated._id,
    platform: lastGenerated.platform || 'xiaohongshu',
    topic: lastGenerated.title,
  });
  if (ok && j.success) {
    toast('✅ 已送视频工厂，正在排队制作');
    document.getElementById('gr_chainStatus').innerHTML += '<div>✅ 已送视频工厂（任务ID: ' + (j.data?._id || '—') + '）</div>';
  } else {
    toast('❌ 发送失败: ' + (j.message || '未知错误'));
    console.error('sendToVideo failed:', j);
  }
};

window.genPosterFromScript = async function() {
  const { ok, j } = await API.content.generate({
    platform: lastGenerated.platform || 'xiaohongshu',
    constitution: document.getElementById('c_const').value,
    topic: lastGenerated.title || document.getElementById('c_topic').value,
    type: 'poster',
  });
  if (ok && j.success) {
    toast('配套海报已生成');
    document.getElementById('gr_chainStatus').innerHTML += '<div>✅ 配套海报已生成</div>';
  } else {
    toast('生成失败');
  }
};

window.copyResult = function() {
  const text = document.getElementById('gr_body').textContent;
  navigator.clipboard?.writeText(text);
  toast('已复制');
};

// 一键复制：格式化为抖音创作者中心可用格式（标题+描述+话题标签）
window.copyForDouyin = function() {
  const title = lastGenerated.title || '';
  const body = (lastGenerated.body || '').slice(0, 2000); // 抖音限制
  const tags = (lastGenerated.hashtags || []).map(h => '#' + h).join(' ');
  // 抖音格式：第一行标题，空行，正文，空行，标签
  const formatted = [title, '', body, '', tags].filter(Boolean).join('\n');
  navigator.clipboard?.writeText(formatted).then(() => {
    toast('✅ 已复制！去抖音创作者中心 Ctrl+V 粘贴');
  }).catch(() => {
    // 降级：用 textarea 方式复制
    const ta = document.createElement('textarea');
    ta.value = formatted; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('✅ 已复制！');
  });
};

// 下载生成的视频MP4（列出可用文件，打开最新的）
window.downloadVideo = async function() {
  try {
    toast('正在查找视频文件…');
    const { ok, j } = await API.video.files();
    if (!ok || !j.success || !j.data?.length) {
      // 尝试直接打开 uploads 目录
      const latestDir = j.data?.[0]?.url;
      if (latestDir) { window.open(latestDir, '_blank'); return; }
      toast('暂无可下载的视频。先生成一个视频试试？');
      return;
    }
    // 打开最新一个视频文件
    window.open(j.data[0].url, '_blank');
    toast(`已打开：${j.data[0].name} (${j.data[0].size})`);
  } catch(e) { toast('下载失败：'+e.message); }
};

// ==================== 内容库 ====================
async function loadContent() {
  const { ok, j } = await API.content.list();
  if (!ok || !j.success) return;
  const filter = document.getElementById('c_filter')?.value || '';
  const list = filter ? (j.data || []).filter(c => {
    if (filter === 'script') return c.type === 'video' || (c.metadata?.keyPoints?.length > 0);
    if (filter === 'poster') return c.type === 'poster';
    return c.type === 'article' || c.type === 'image_text';
  }) : (j.data || []);

  document.getElementById('c_count').textContent = `共 ${list.length} 条`;
  document.getElementById('contentList').innerHTML = list.map(c => `
    <div class="row">
      <div class="grow">
        <div class="ell"><b>${esc(c.title || '未命名')}</b></div>
        <div class="meta">
          ${esc(c.platform)} ·
          <span class="badge b-${esc(c.status)}">${esc(c.status)}</span> ·
          ${c.type === 'video' ? '🎬 脚本' : c.type === 'poster' ? '🖼️ 海报' : '📝 文案'} ·
          ${c.aiGenerated ? 'AI' : '知识库'} ·
          ${new Date(c.createdAt).toLocaleString('zh-CN')}
        </div>
      </div>
      <button class="btn sm" onclick="publishFromList('${c._id}')">📡 发布</button>
      <button class="btn ghost sm" onclick="sendToVideoFromList('${c._id}')">🎬</button>
    </div>
  `).join('') || '<div class="empty">暂无内容，用上方生产线生成第一条</div>';
}

window.publishFromList = async function(id) {
  const { ok, j } = await API.content.publish(id);
  toast(ok && j.success ? '已发布' : '失败');
  if (ok) loadContent();
};

window.sendToVideoFromList = async function(id) {
  const { ok, j } = await API.video.generate({ contentId: id, platform: 'xiaohongshu' });
  toast(ok && j.success ? '已送视频工厂' : '失败');
};

// ==================== 工具 ====================
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function toast(m) { const t = document.getElementById('toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); } }
