/**
 * 产品与项目页面 - 公司简介 + 完整产品体系
 * 中芳堂三主体架构 + 5大产品线
 */
export async function render(el) {
  el.innerHTML = `
    <!-- 公司简介 -->
    <div class="card" style="border-color:var(--gold);background:linear-gradient(135deg,rgba(212,168,83,.06),transparent)">
      <h3>🏛️ 中芳堂 · 品牌简介</h3>
      <div class="meta" style="line-height:1.8">
        <b>品牌定位：</b>以中医九种体质辨证体系为根基、中医芳香疗法植物配伍技术为核心、AI智能大数据监测为工具、草本外养+真菌多糖内调为双赛道的新型科技康养美业品牌。<br><br>
        <b>核心理念：</b>不千人一方、不盲目养护、不夸大功效、不医疗化宣传，以数据为依据、以体质为标准、以温和长效为宗旨。<br><br>
        <b>三主体架构：</b>宜昌屈氏美业健康管理有限公司【管理总部】+ 湖北中芳堂美业生物科技发展有限责任公司【研发营运总部】+ 宜昌市伍家岗区屈氏美容美体服务部【终端体验】<br><br>
        <b>四大代理支撑：</b>纤姿达(流量) + 嘟嘟瓜(人才) + 腕家H1(监测) + 美罗国际(内调)<br><br>
        <b>商业闭环：</b>自主研发产品与技术 → AI+人工双体质测评 → 私人定制方案 → 到店外养 → 居家内调 → 私域终身锁客
      </div>
    </div>

    <!-- 产品分类 -->
    <div class="flex gap6 mt16" style="flex-wrap:wrap" id="productTabs">
      <button class="btn on" data-cat="zhongfangtang" onclick="showProducts('zhongfangtang')">中芳堂核心</button>
      <button class="btn ghost" data-cat="meiluo" onclick="showProducts('meiluo')">美罗国际·内调</button>
      <button class="btn ghost" data-cat="xianzida" onclick="showProducts('xianzida')">纤姿达·外养</button>
      <button class="btn ghost" data-cat="qushi" onclick="showProducts('qushi')">屈氏美容·服务</button>
      <button class="btn ghost" data-cat="wanjia" onclick="showProducts('wanjia')">腕家H1·监测</button>
      <button class="btn ghost" data-cat="wushentang" onclick="showProducts('wushentang')">伍申堂·膏方</button>
    </div>

    <div id="productContent" class="mt16"></div>
  `;
  showProducts('zhongfangtang');
}

const PRODUCTS = {
  zhongfangtang: {
    title: '中芳堂核心产品线 · 自研芳疗体系',
    items: [
      { name: '九体辨识复方精油套装', type: '精油', price: '¥698', desc: '9种体质专属复方精油，一对一辨证调配，屈兵自研配方', tags: ['明星产品','居家必备','自研'] },
      { name: '28养复方精油', type: '精油', price: '¥398', desc: '28天生理周期养肤精油配方，屈兵自研', tags: ['女性专属','周期养护','自研'] },
      { name: '精油SPA芳香疗法', type: '服务', price: '¥298起', desc: '60-90分钟全身精油SPA，体质辨证+定制调配', tags: ['到店体验','明星项目'] },
      { name: '肩颈疏通精油推拿', type: '服务', price: '¥198起', desc: '45分钟精油推拿+刮痧+热敷+穴位按压', tags: ['上班族','爆款'] },
      { name: '中医面部拨筋美容', type: '服务', price: '¥268起', desc: '60分钟精油导入+拨筋手法+提升紧致', tags: ['抗衰','V脸'] },
      { name: '九体辨识AI测评', type: '服务', price: '免费', desc: 'AI体质辨证+中医望闻问切+腕家H1数据', tags: ['首次免费','引流款'] },
      { name: '全身经络疏通调理', type: '服务', price: '¥398起', desc: '90分钟精油推拿+刮痧+拔罐+艾灸', tags: ['深度调理','VIP'] },
    ],
  },
  meiluo: {
    title: '美罗国际 · 高端真菌多糖内调体系',
    items: [
      { name: '灵芝系列', type: '保健品', price: '咨询', desc: '灵芝多糖+灵芝三萜，提升免疫力、抗疲劳、改善睡眠、保肝护肝', tags: ['免疫力','核心产品'] },
      { name: '松花粉系列', type: '保健品', price: '咨询', desc: '松花粉+多种氨基酸+维生素+矿物质，全面营养补充、调节内分泌', tags: ['营养','基础'] },
      { name: '猴头菇系列', type: '保健品', price: '咨询', desc: '猴头菇多糖，养胃护胃、修复胃黏膜、改善消化', tags: ['养胃'] },
      { name: '冬虫夏草系列', type: '保健品', price: '咨询', desc: '虫草多糖+虫草酸，补肺益肾、增强免疫、抗疲劳', tags: ['高端','滋补'] },
    ],
  },
  xianzida: {
    title: '纤姿达 · 本草植萃外养体系（抖音云连锁）',
    items: [
      { name: '本草植萃液', type: '外用', price: '咨询', desc: '艾草/生姜/当归/红花等多种本草萃取，温经通络、促进循环、排水消肿', tags: ['核心','外养'] },
      { name: '植萃平衡霜', type: '外用', price: '咨询', desc: '植物甾醇+本草提取物+维生素E，紧致塑形、滋润保湿、改善橘皮', tags: ['塑形'] },
      { name: '居家养护套组', type: '套装', price: '咨询', desc: '植萃液+平衡霜+热敷盐包+按摩工具，完整居家养护方案', tags: ['居家','套装'] },
      { name: '热敷盐包', type: '工具', price: '咨询', desc: '天然海盐+本草植物（艾草/生姜），温经散寒、促进循环、辅助精油吸收', tags: ['热敷'] },
    ],
  },
  qushi: {
    title: '屈氏美容美体服务部 · 终端体验服务（6套标准化方案）',
    items: [
      { name: '面部深层护理', type: '美容', price: '¥128起', desc: '清洁→去角质→精油按摩→面膜→保湿防护，60分钟', tags: ['面部'] },
      { name: '皮肤管理综合护理', type: '美容', price: '¥198起', desc: '皮肤检测→深层清洁→精华导入→LED光疗→面膜，90分钟', tags: ['问题肌'] },
      { name: '乾坤三宝综合理疗', type: '仪器', price: '咨询', desc: '深层疏通+经络调理+温热理疗', tags: ['仪器'] },
      { name: '中医艾灸调理', type: '外治', price: '咨询', desc: '温经散寒、扶阳固脱、防病保健，30-45分钟', tags: ['艾灸'] },
      { name: '中医刮痧排毒', type: '外治', price: '咨询', desc: '活血化瘀、排毒通络、清热解表，30分钟', tags: ['刮痧'] },
      { name: '中医拔罐调理', type: '外治', price: '咨询', desc: '祛风散寒、通经活络、消肿止痛，20-30分钟', tags: ['拔罐'] },
      { name: '中药熏蒸疗法', type: '外治', price: '咨询', desc: '温经通络、祛湿排毒、改善循环，30分钟', tags: ['熏蒸'] },
    ],
  },
  wanjia: {
    title: '腕家H1 · 中医AI智能监测手表（屈氏美容独家授权）',
    items: [
      { name: '腕家H1健康手表', type: '智能设备', price: '¥998', desc: '九体辨识+五脏状态+五气偏颇+心率/血氧/血压/心脑血管/心理压力/代谢睡眠，24小时全天候监测', tags: ['核心底座','AI','数据化'] },
    ],
    features: ['解决行业无数据痛点：凭数据而非凭感觉', '实现动态辨证调方：打破固定套盒模式', '全客群覆盖：居家/到店/纯外养均可高端升级', '合法合规安全：只做体质监测，不做医疗诊断', '极致锁客私域：手表绑定客户→数据绑定信任→持续复购'],
  },
  wushentang: {
    title: '伍申堂 · 草本九体膏方（8种，一质一方）',
    items: [
      { name: '平和质·平衡膏', type: '膏方', price: '¥168', desc: '黄芪/党参/枸杞/红枣，培补正气、平衡阴阳', tags: ['平和质'] },
      { name: '气虚质·益气膏', type: '膏方', price: '¥168', desc: '黄芪/党参/白术/茯苓/山药，补气健脾、固本培元', tags: ['气虚质'] },
      { name: '阳虚质·温阳膏', type: '膏方', price: '¥168', desc: '肉桂/附子/干姜/杜仲/菟丝子，温阳散寒、补肾暖宫', tags: ['阳虚质'] },
      { name: '阴虚质·滋阴膏', type: '膏方', price: '¥168', desc: '百合/玉竹/麦冬/沙参/生地，滋阴润燥、降火生津', tags: ['阴虚质'] },
      { name: '痰湿质·化湿膏', type: '膏方', price: '¥168', desc: '陈皮/茯苓/薏苡仁/半夏/白术，化痰祛湿、健脾��水', tags: ['痰湿质'] },
      { name: '湿热质·清湿膏', type: '膏方', price: '¥168', desc: '薏苡仁/茯苓/栀子/茵陈/黄芩，清热利湿、解毒散结', tags: ['湿热质'] },
      { name: '血瘀质·活瘀膏', type: '膏方', price: '¥168', desc: '当归/红花/桃仁/川芎/丹参，活血化瘀、通络止痛', tags: ['血瘀质'] },
      { name: '气郁质·舒郁膏', type: '膏方', price: '¥168', desc: '玫瑰花/佛手/陈皮/柴胡/合欢皮，疏肝解郁、理气安神', tags: ['气郁质'] },
    ],
  },
};

window.showProducts = function(cat) {
  document.querySelectorAll('#productTabs button').forEach(b=>b.classList.toggle('on',b.dataset.cat===cat));
  const data = PRODUCTS[cat];
  if (!data) return;
  let html = `<div class="card"><h3>${data.title}</h3>`;
  html += (data.items||[]).map(p=>`<div class="row">
    <div class="grow"><b>${p.name}</b> <span class="badge b-active">${p.type}</span>
    <div class="meta">${p.desc}</div></div>
    <span style="color:var(--gold);font-weight:600">${p.price}</span>
    ${(p.tags||[]).map(t=>`<span class="badge b-pending">${t}</span>`).join('')}
  </div>`).join('');
  if (data.features) html += `<div class="mt12">${data.features.map(f=>`<div class="row"><div class="grow meta">✅ ${f}</div></div>`).join('')}</div>`;
  html += '</div>';
  document.getElementById('productContent').innerHTML = html;
};
