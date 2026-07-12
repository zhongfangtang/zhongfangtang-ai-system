/**
 * 系统设置 - 指挥中枢 + 密钥配置 + 企微
 */
import * as API from '../js/api.js';

export async function render(el) {
  el.innerHTML = `
    <div class="card"><h3>⚙️ 中芳堂指挥中枢 V5.2</h3><div class="hint">17模块 · 10 Agent · 18知识库 · 9平台对接</div></div>
    <div class="card mt16"><h3>📡 平台API密钥配置</h3><div class="hint">填入密钥即生效 · 未填则人工复核模式 · 详见「平台API密钥配置指南.md」</div><div id="platformConfig"></div></div>
    <div class="card mt16"><h3>💬 企业微信SCRM</h3><div id="weworkConfig"></div></div>
    <div class="grid2 mt16">
      <div class="card"><h3>🫀 健康</h3><div id="systemHealth"></div></div>
      <div class="card"><h3>📊 数据</h3><div id="dataOverview"></div></div>
    </div>`;
  loadPlatforms(); loadWework(); loadHealth(); loadData();
}

function loadPlatforms(){
  const p=[
    {n:'蚁小二',k:'无需API',s:'active',m:'手动分发',g:'在蚁小二后台创建发布任务'},
    {n:'抖音来客·屈氏美容',k:'DOUYIN_APP_ID/SECRET',s:'pending',m:'半自动',g:'open.douyin.com→创建应用'},
    {n:'小红书个人号',k:'XIAOHONGSHU_APP_ID/SECRET',s:'pending',m:'半自动',g:'open.xiaohongshu.com→开发者中心'},
    {n:'公众号服务号',k:'WEIXIN_APP_ID/SECRET',s:'pending',m:'全自动',g:'mp.weixin.qq.com→基本配置'},
    {n:'视频号(×2)',k:'WEIXIN_APP_ID/SECRET',s:'pending',m:'全自动',g:'open.weixin.qq.com→网站应用'},
    {n:'视频号小店',k:'微信小商店API',s:'pending',m:'全自动',g:'微信小商店后台→API对接'},
    {n:'快手个人号',k:'KUAISHOU_APP_ID/SECRET',s:'pending',m:'半自动',g:'open.kuaishou.com→创建应用'},
    {n:'B站个人号',k:'BILIBILI_SESSDATA',s:'pending',m:'全自动',g:'member.bilibili.com→F12 Cookie'},
    {n:'百家号',k:'BAIJIAHAO_COOKIE',s:'pending',m:'全自动',g:'baijiahao.baidu.com→F12 Cookie'},
  ];
  document.getElementById('platformConfig').innerHTML=p.map(x=>`<div class="row"><div class="grow"><b>${x.n}</b><span class="meta">· ${x.k}</span><div class="meta">📖 ${x.g}</div></div><span class="badge b-${x.s}">${x.s==='active'?'已配置':'待配置'}</span><span class="badge ${x.m==='全自动'?'b-active':'b-pending'}">${x.m}</span></div>`).join('');
}

function loadWework(){
  document.getElementById('weworkConfig').innerHTML=`<div class="row"><div class="grow"><b>企业微信认证</b><span class="meta">· work.weixin.qq.com</span></div><span class="badge b-pending">未认证</span></div><div class="row"><div class="grow">获取corpId+corpSecret填入.env</div><span class="badge b-pending">待配置</span></div><div class="hint mt12">认证后自动启用：SCRM欢迎语/客户标签/群发/离职继承</div>`;
}

async function loadHealth(){
  try{const{ok,j}=await API.system.health();if(ok)document.getElementById('systemHealth').innerHTML=`<div class="row"><div class="grow">服务</div><span class="badge b-active">${j.status}</span></div><div class="row"><div class="grow">版本</div><span>V5.2.4</span></div><div class="row"><div class="grow">运行</div><span>${Math.floor((j.checks?.uptime||0)/3600)}h</span></div>`;}catch(e){}
}

async function loadData(){
  try{const{ok,j}=await API.system.status();if(ok){const c=j.data.counts||{};document.getElementById('dataOverview').innerHTML=`<div class="stat-card"><div class="num">${c.content||0}</div><div class="lbl">内容</div></div><div class="stat-card mt12"><div class="num">${c.leads||0}</div><div class="lbl">线索</div></div><div class="stat-card mt12"><div class="num">${c.customers||0}</div><div class="lbl">客户</div></div><div class="hint mt12">AI:${j.data.aiMode==='llm'?'硅基流动':'知识库'}</div>`;}}catch(e){}
}
