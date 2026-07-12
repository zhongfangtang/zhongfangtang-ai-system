/**
 * 系统设置 - 指挥中枢 + 平台对接 + 企微配置
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card"><h3>⚙️ 中芳堂指挥中枢 V5.2</h3><div class="hint">17模块互联 · 10 Agent · 18知识库 · 6平台对接</div></div>

    <!-- 平台对接 -->
    <div class="card mt16"><h3>📡 6平台API对接</h3><div id="platformConfig"></div></div>

    <!-- 企业微信 -->
    <div class="card mt16"><h3>💬 企业微信SCRM对接</h3><div id="weworkConfig"></div></div>

    <!-- 系统健康 -->
    <div class="grid2 mt16">
      <div class="card"><h3>🫀 系统健康</h3><div id="systemHealth"></div></div>
      <div class="card"><h3>📊 数据总览</h3><div id="dataOverview"></div></div>
    </div>
  `;
  await Promise.all([loadPlatforms(), loadWework(), loadHealth(), loadData()]);
}

function loadPlatforms() {
  const platforms = [
    { name:'蚁小二', account:'多平台一键分发', status:'active', note:'内容同步发布到抖音/小红书/视频号/快手/B站' },
    { name:'抖音来客', account:'屈氏美容美体服务部', status:'active', note:'门店认领+团购+预约+评价' },
    { name:'小红书', account:'个人号', status:'active', note:'种草��记+私信截流' },
    { name:'公众号', account:'服务号(已认证)', status:'active', note:'模板消息+���单+客服' },
    { name:'视频号(×2)', account:'主���+副号', status:'active', note:'短视频+直播+视频号小店' },
    { name:'B站', account:'个人号', status:'active', note:'知识科普长视频' },
    { name:'快手', account:'个人号', status:'active', note:'短视频' },
    { name:'企业微信', account:'待认证', status:'pending', note:'认证后可对接SCRM自动欢迎+客户管理' },
    { name:'小程序', account:'备案审核中', status:'pending', note:'审核通过后接入预约+商城' },
  ];
  document.getElementById('platformConfig').innerHTML = platforms.map(p=>`
    <div class="row">
      <div class="grow"><b>${p.name}</b> <span class="meta">· ${p.account}</span><div class="meta">${p.note}</div></div>
      <span class="badge b-${p.status}">${p.status==='active'?'已对接':'待对接'}</span>
    </div>`).join('');
}

function loadWework() {
  document.getElementById('weworkConfig').innerHTML = `
    <div class="row"><div class="grow"><b>企业微信认证</b></div><span class="badge b-pending">未认证</span></div>
    <div class="row"><div class="grow">SCRM自动欢迎</div><span class="badge b-pending">待认证后启用</span></div>
    <div class="row"><div class="grow">客户标签管理</div><span class="badge b-pending">待认证后启用</span></div>
    <div class="row"><div class="grow">���发消息</div><span class="badge b-pending">待认证后启用</span></div>
    <div class="hint mt12">企业微信认证步骤：登录work.weixin.qq.com → 提交企业认证 → 获取corpId+corpSecret → 填入.env → 重启生效</div>`;
}

async function loadHealth() {
  try {
    const {ok,j}=await API.system.health();
    if(ok&&j){
      document.getElementById('systemHealth').innerHTML=`
        <div class="row"><div class="grow">服务状态</div><span class="badge b-active">${j.status||'healthy'}</span></div>
        <div class="row"><div class="grow">版本</div><span>${j.version||'5.2.0'}</span></div>
        <div class="row"><div class="grow">运行时间</div><span>${Math.floor((j.checks?.uptime||0)/3600)}小时</span></div>
        <div class="row"><div class="grow">内存</div><span>${j.checks?.memory?.heapUsedMB||0}MB</span></div>`;
    }
  }catch(e){}
}

async function loadData() {
  try {
    const {ok,j}=await API.system.status();
    if(ok&&j.success){
      const c=j.data.counts||{};
      document.getElementById('dataOverview').innerHTML=`
        <div class="stat-card"><div class="num">${c.content||0}</div><div class="lbl">内容</div></div>
        <div class="stat-card mt12"><div class="num">${c.leads||0}</div><div class="lbl">线索</div></div>
        <div class="stat-card mt12"><div class="num">${c.customers||0}</div><div class="lbl">客户</div></div>
        <div class="stat-card mt12"><div class="num">${c.publishes||0}</div><div class="lbl">发布</div></div>
        <div class="hint mt12">AI模式：${j.data.aiMode==='llm'?'真实大模型(硅基流动)':'知识库组合'}</div>`;
    }
  }catch(e){}
}
