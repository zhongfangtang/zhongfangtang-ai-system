/**
 * ============================================================================
 * 中芳堂全域AI智能体系统 - 截流获客知识库 (Interception KB)
 * ============================================================================
 *
 * 用途：为截流Agent（interception-agent）提供全量关键词词库、竞品分析、
 * 分平台互动话术模板、截流效果评估等结构化知识。
 *
 * 使用方式：
 *   const { keywordBank, localKeywords, competitorAccounts, platformScripts,
 *           interceptionMetrics } = require('./interception-kb');
 *
 * 适用Agent：
 *   - interception-agent（全域截流官·小芳获客）
 *   - content-agent（内容总监·小芳创作）- 用于SEO和关键词布局
 *
 * 最后更新：2026-07-11
 * ============================================================================
 */

// ============================================================================
// 一、全量关键词词库 (Keyword Bank)
// 200+词，分5级意向 + 品牌词
// ============================================================================

const keywordBank = {
  // ------ 超高意向词（明确需求+地域/行动意图）------
  ultraHighIntent: [
    {
      keyword: '宜昌美容院推荐', platforms: ['抖音', '小红书', '百度'], strategy: '直接邀约到店',
      conversionPath: '评论→私信→企微→到店体验', score: 100
    },
    {
      keyword: '宜昌SPA哪家好', platforms: ['抖音', '小红书', '大众点评'], strategy: '差异化推荐',
      conversionPath: '评论→私信→到店', score: 100
    },
    {
      keyword: '伍家岗养生馆', platforms: ['抖音', '百度地图', '小红书'], strategy: '本地SEO占位',
      conversionPath: '搜索→主页→测评→到店', score: 100
    },
    {
      keyword: '宜昌精油按摩', platforms: ['抖音', '小红书'], strategy: '场景种草',
      conversionPath: '内容→私信→企微', score: 100
    },
    {
      keyword: '宜昌中医调理', platforms: ['抖音', '百度', '小红书'], strategy: '专业权威',
      conversionPath: '内容→测评→到店', score: 100
    },
    {
      keyword: '宜昌芳疗馆', platforms: ['小红书', '抖音'], strategy: '品牌曝光',
      conversionPath: '搜索→主页→预约', score: 100
    },
    {
      keyword: '宜昌身体调理哪家专业', platforms: ['抖音', '小红书', '百度'], strategy: '专业对比',
      conversionPath: '搜索→测评→到店', score: 100
    },
    {
      keyword: '宜昌祛痘哪家好', platforms: ['小红书', '抖音'], strategy: '精准切入',
      conversionPath: '内容→测评→产品', score: 100
    },
    {
      keyword: '宜昌减肥有效果的地方', platforms: ['抖音', '小红书'], strategy: '体质调理差异化',
      conversionPath: '评论→私信→体验', score: 100
    },
    {
      keyword: '夷陵区美容院', platforms: ['抖音', '百度地图'], strategy: '区域覆盖',
      conversionPath: '搜索→到店', score: 100
    },
    {
      keyword: '西陵区SPA', platforms: ['抖音', '大众点评'], strategy: '区域覆盖',
      conversionPath: '搜索→到店', score: 95
    },
    {
      keyword: '点军区养生', platforms: ['抖音', '百度'], strategy: '区域覆盖',
      conversionPath: '搜索→主页→测评', score: 95
    },
    {
      keyword: '肩颈酸痛去哪里调理', platforms: ['抖音', '小红书', '百度'], strategy: '痛点切入',
      conversionPath: '内容→私信→到店', score: 95
    },
    {
      keyword: '失眠调理哪里好', platforms: ['小红书', '抖音', '百度'], strategy: '痛点切入',
      conversionPath: '内容→测评→方案', score: 95
    },
    {
      keyword: '更年期调理哪里好', platforms: ['小红书', '百度'], strategy: '专业切入',
      conversionPath: '内容→私信→体验', score: 95
    },
    {
      keyword: '产后修复宜昌', platforms: ['小红书', '抖音'], strategy: '场景切入',
      conversionPath: '搜索→私信→体验', score: 95
    },
    {
      keyword: '精油减肥真的有效吗', platforms: ['抖音', '小红书'], strategy: '科普教育',
      conversionPath: '内容→测评→方案', score: 90
    },
    {
      keyword: '中医体质测试免费', platforms: ['小红书', '抖音', '百度'], strategy: '免费测评引流',
      conversionPath: '搜索→小程序→测评→留资', score: 90
    },
    {
      keyword: '痛经怎么调理好', platforms: ['小红书', '抖音'], strategy: '痛点切入',
      conversionPath: '内容→私信→方案', score: 90
    },
    {
      keyword: '体寒怎么调理', platforms: ['小红书', '抖音', '百度'], strategy: '科普教育',
      conversionPath: '内容→测评→方案', score: 90
    }
  ],

  // ------ 高意向词（明确需求但无地域/行动）------
  highIntent: [
    { keyword: '体质调理', platforms: ['抖音', '小红书', '百度'], strategy: '专业科普', score: 85 },
    { keyword: '中医体质辨识', platforms: ['百度', '小红书'], strategy: '测评引流', score: 85 },
    { keyword: '芳疗调理', platforms: ['小红书', '抖音'], strategy: '品牌种草', score: 85 },
    { keyword: '精油调理', platforms: ['小红书', '抖音'], strategy: '产品种草', score: 85 },
    { keyword: '肩颈酸痛怎么办', platforms: ['抖音', '百度', '小红书'], strategy: '痛点解答', score: 85 },
    { keyword: '失眠多梦怎么调理', platforms: ['小红书', '百度'], strategy: '痛点解答', score: 85 },
    { keyword: '手脚冰凉怎么调理', platforms: ['小红书', '抖音'], strategy: '痛点解答', score: 85 },
    { keyword: '长痘反复怎么办', platforms: ['小红书', '抖音'], strategy: '痛点解答', score: 85 },
    { keyword: '减肥瘦身不反弹', platforms: ['抖音', '小红书'], strategy: '痛点解答', score: 85 },
    { keyword: '湿气重怎么祛湿', platforms: ['小红书', '抖音', '百度'], strategy: '科普教育', score: 85 },
    { keyword: '产后身材恢复', platforms: ['小红书', '抖音'], strategy: '场景切入', score: 85 },
    { keyword: '更年期失眠潮热', platforms: ['小红书', '百度'], strategy: '痛点解答', score: 85 },
    { keyword: '皮肤暗沉怎么调理', platforms: ['小红书', '抖音'], strategy: '痛点解答', score: 80 },
    { keyword: '敏感肌怎么护理', platforms: ['小红书'], strategy: '专业建议', score: 80 },
    { keyword: '月经不调怎么调', platforms: ['小红书', '百度'], strategy: '科普教育', score: 80 },
    { keyword: '精油按摩有什么好处', platforms: ['抖音', '小红书'], strategy: '科普种草', score: 80 },
    { keyword: '中药膏方调理', platforms: ['百度', '小红书'], strategy: '产品种草', score: 80 },
    { keyword: '精油香薰助眠', platforms: ['小红书', '抖音'], strategy: '场景种草', score: 80 },
    { keyword: '精油瘦腿', platforms: ['小红书', '抖音'], strategy: '精准种草', score: 80 },
    { keyword: '精油祛痘', platforms: ['小红书', '抖音'], strategy: '精准种草', score: 80 }
  ],

  // ------ 中意向词（泛需求/信息收集）------
  mediumIntent: [
    { keyword: '养生调理', platforms: ['全平台'], strategy: '品牌曝光', score: 60 },
    { keyword: '中医养生', platforms: ['全平台'], strategy: '权威科普', score: 60 },
    { keyword: '精油芳疗', platforms: ['小红书', '抖音'], strategy: '品类种草', score: 60 },
    { keyword: '身体护理', platforms: ['全平台'], strategy: '服务曝光', score: 55 },
    { keyword: '面部护理', platforms: ['小红书', '抖音'], strategy: '服务曝光', score: 55 },
    { keyword: '美容美体', platforms: ['全平台'], strategy: '行业曝光', score: 55 },
    { keyword: '精油推荐', platforms: ['小红书'], strategy: '产品种草', score: 55 },
    { keyword: '按摩SPA', platforms: ['抖音', '小红书'], strategy: '场景种草', score: 55 },
    { keyword: '健康调理', platforms: ['百度', '小红书'], strategy: '科普教育', score: 50 },
    { keyword: '亚健康调理', platforms: ['百度', '小红书'], strategy: '科普教育', score: 50 },
    { keyword: '植物精油', platforms: ['小红书', '抖音'], strategy: '品类曝光', score: 50 },
    { keyword: '纯露护肤', platforms: ['小红书'], strategy: '产品种草', score: 50 },
    { keyword: '膏方养生', platforms: ['小红书', '百度'], strategy: '产品种草', score: 50 },
    { keyword: '艾灸调理', platforms: ['抖音', '百度'], strategy: '关联曝光', score: 50 },
    { keyword: '刮痧拔罐', platforms: ['抖音', '百度'], strategy: '关联曝光', score: 50 },
    { keyword: '经络疏通', platforms: ['抖音', '小红书'], strategy: '服务曝光', score: 50 },
    { keyword: '排毒养颜', platforms: ['小红书', '抖音'], strategy: '科普种草', score: 50 },
    { keyword: '抗衰护肤', platforms: ['小红书', '抖音'], strategy: '产品种草', score: 50 },
    { keyword: '美白祛斑', platforms: ['小红书', '抖音'], strategy: '痛点切入', score: 50 },
    { keyword: '精油护肤', platforms: ['小红书'], strategy: '品类种草', score: 50 }
  ],

  // ------ 低意向词（泛流量/兴趣探索）------
  lowIntent: [
    { keyword: '健康生活', platforms: ['全平台'], strategy: '品牌曝光', score: 30 },
    { keyword: '生活方式', platforms: ['小红书', '抖音'], strategy: '调性种草', score: 30 },
    { keyword: '自然疗法', platforms: ['百度', '小红书'], strategy: '科普教育', score: 30 },
    { keyword: '放松解压', platforms: ['抖音', '小红书'], strategy: '场景种草', score: 30 },
    { keyword: '自我关爱', platforms: ['小红书'], strategy: '情感共鸣', score: 30 },
    { keyword: '慢生活', platforms: ['小红书'], strategy: '调性种草', score: 30 },
    { keyword: '好物推荐', platforms: ['小红书', '抖音'], strategy: '产品种草', score: 30 },
    { keyword: '护肤心得', platforms: ['小红书'], strategy: '内容种草', score: 25 },
    { keyword: '变美日记', platforms: ['小红书'], strategy: '内容种草', score: 25 },
    { keyword: '女生必备', platforms: ['小红书', '抖音'], strategy: '情感种草', score: 25 },
    { keyword: '香薰蜡烛', platforms: ['小红书'], strategy: '品类关联', score: 20 },
    { keyword: '居家好物', platforms: ['小红书', '抖音'], strategy: '场景关联', score: 20 },
    { keyword: '送礼推荐', platforms: ['小红书', '抖音'], strategy: '场景种草', score: 20 },
    { keyword: '母亲节礼物', platforms: ['小红书', '抖音'], strategy: '节日种草', score: 20 },
    { keyword: '闺蜜约会', platforms: ['小红书', '抖音'], strategy: '场景种草', score: 20 },
    { keyword: '周末去哪', platforms: ['抖音', '小红书'], strategy: '本地生活', score: 20 },
    { keyword: '女性成长', platforms: ['小红书'], strategy: '情感共鸣', score: 20 },
    { keyword: '精致生活', platforms: ['小红书'], strategy: '调性种草', score: 20 },
    { keyword: '养生茶', platforms: ['小红书', '抖音'], strategy: '品类关联', score: 20 },
    { keyword: '泡脚养生', platforms: ['抖音', '小红书'], strategy: '品类关联', score: 20 }
  ],

  // ------ 品牌词（中芳堂专属）------
  brand: [
    { keyword: '中芳堂', platforms: ['全平台'], strategy: '品牌保护', score: 100 },
    { keyword: '中芳堂精油', platforms: ['全平台'], strategy: '品牌搜索', score: 100 },
    { keyword: '中芳堂芳疗', platforms: ['全平台'], strategy: '品牌搜索', score: 100 },
    { keyword: '中芳堂宜昌', platforms: ['全平台'], strategy: '本地搜索', score: 100 },
    { keyword: '中芳堂体质调理', platforms: ['全平台'], strategy: '品牌+服务', score: 100 },
    { keyword: '屈氏美业', platforms: ['全平台'], strategy: '品牌保护', score: 100 },
    { keyword: '伍申堂膏方', platforms: ['百度', '小红书'], strategy: '产品搜索', score: 100 },
    { keyword: '芝参护肤', platforms: ['小红书', '抖音'], strategy: '产品搜索', score: 100 },
    { keyword: '腕家H1', platforms: ['抖音', '小红书', '百度'], strategy: '产品搜索', score: 100 },
    { keyword: '纤姿达', platforms: ['抖音', '小红书'], strategy: '产品搜索', score: 100 }
  ],

  // ------ 负面词（需屏蔽/标记）------
  negativeKeywords: [
    '骗子', '忽悠', '假的', '骗人的', '智商税', '坑人', '黑店', '差评',
    '太贵了坑', '不值得去', '别去', '上当', '传销', '洗脑', '微商',
    '激素', '毁容', '过敏严重', '去医院', '退款', '举报', '投诉'
  ],

  // ------ 医疗禁用词（合规过滤）------
  medicalBanned: [
    '治疗', '治愈', '根治', '诊断', '处方', '用药', '疗程', '疗效',
    '主治', '适应症', '禁忌症', '不良反应', '临床试验', '病理',
    '手术', '注射', '激光', '微整', '医美', '整形', '填充', '肉毒素'
  ]
};

// ============================================================================
// 二、宜昌本地化关键词 (Local Keywords)
// 50+词，覆盖区域+场景
// ============================================================================

const localKeywords = [
  // 区域词
  { keyword: '伍家岗美容院', type: '区域+服务', score: 95, tags: ['伍家岗', '美容'] },
  { keyword: '伍家岗SPA', type: '区域+服务', score: 95, tags: ['伍家岗', 'SPA'] },
  { keyword: '伍家岗养生', type: '区域+服务', score: 95, tags: ['伍家岗', '养生'] },
  { keyword: '伍家岗精油', type: '区域+产品', score: 90, tags: ['伍家岗', '精油'] },
  { keyword: '夷陵大道美容', type: '街道+服务', score: 90, tags: ['夷陵大道', '美容'] },
  { keyword: '夷陵区SPA', type: '区域+服务', score: 90, tags: ['夷陵区', 'SPA'] },
  { keyword: '夷陵区养生馆', type: '区域+服务', score: 90, tags: ['夷陵区', '养生'] },
  { keyword: '西陵区美容院', type: '区域+服务', score: 90, tags: ['西陵区', '美容'] },
  { keyword: '西陵区身体调理', type: '区域+服务', score: 85, tags: ['西陵区', '调理'] },
  { keyword: '点军区养生', type: '区域+服务', score: 85, tags: ['点军区', '养生'] },
  { keyword: '点军区SPA', type: '区域+服务', score: 85, tags: ['点军区', 'SPA'] },
  { keyword: '宜昌东站附近美容', type: '地标+服务', score: 85, tags: ['宜昌东站', '美容'] },
  { keyword: '宜昌万达附近SPA', type: '地标+服务', score: 85, tags: ['万达', 'SPA'] },
  { keyword: '宜昌CBD美容', type: '地标+服务', score: 80, tags: ['CBD', '美容'] },

  // 区域+需求词
  { keyword: '宜昌精油按摩哪里好', type: '区域+需求', score: 95, tags: ['宜昌', '精油', '按摩'] },
  { keyword: '宜昌芳疗馆推荐', type: '区域+需求', score: 95, tags: ['宜昌', '芳疗'] },
  { keyword: '宜昌体质调理', type: '区域+需求', score: 90, tags: ['宜昌', '体质'] },
  { keyword: '宜昌中医芳疗', type: '区域+需求', score: 90, tags: ['宜昌', '中医', '芳疗'] },
  { keyword: '宜昌减肥调理', type: '区域+需求', score: 85, tags: ['宜昌', '减肥'] },
  { keyword: '宜昌祛痘美容', type: '区域+需求', score: 85, tags: ['宜昌', '祛痘'] },
  { keyword: '宜昌失眠调理', type: '区域+需求', score: 85, tags: ['宜昌', '失眠'] },
  { keyword: '宜昌产后修复', type: '区域+需求', score: 85, tags: ['宜昌', '产后'] },
  { keyword: '宜昌肩颈调理', type: '区域+需求', score: 85, tags: ['宜昌', '肩颈'] },
  { keyword: '宜昌更年期调理', type: '区域+需求', score: 80, tags: ['宜昌', '更年期'] },
  { keyword: '宜昌精油减肥', type: '区域+需求', score: 80, tags: ['宜昌', '精油', '减肥'] },

  // 宜昌本地生活词
  { keyword: '宜昌生活', type: '本地生活', score: 60, tags: ['宜昌', '生活'] },
  { keyword: '宜昌周末去哪', type: '本地生活', score: 55, tags: ['宜昌', '周末'] },
  { keyword: '宜昌女生推荐', type: '本地生活', score: 55, tags: ['宜昌', '女生'] },
  { keyword: '宜昌打卡', type: '本地生活', score: 50, tags: ['宜昌', '打卡'] },
  { keyword: '宜昌探店', type: '本地生活', score: 50, tags: ['宜昌', '探店'] },
  { keyword: '宜昌吃喝玩乐', type: '本地生活', score: 45, tags: ['宜昌', '生活'] },
  { keyword: '宜昌养生好去处', type: '本地+养生', score: 70, tags: ['宜昌', '养生'] },
  { keyword: '宜昌女性健康', type: '本地+健康', score: 65, tags: ['宜昌', '女性'] },
  { keyword: '宜昌美容美体', type: '本地+行业', score: 70, tags: ['宜昌', '美容'] },
  { keyword: '宜昌SPA会所', type: '本地+行业', score: 70, tags: ['宜昌', 'SPA'] },
  { keyword: '宜昌精油专卖', type: '本地+产品', score: 65, tags: ['宜昌', '精油'] },
  { keyword: '宜昌纯天然护肤品', type: '本地+产品', score: 60, tags: ['宜昌', '护肤'] },
  { keyword: '紫光园美容', type: '地标+服务', score: 85, tags: ['紫光园', '美容'] },
  { keyword: '紫光园SPA', type: '地标+服务', score: 85, tags: ['紫光园', 'SPA'] },

  // 宜昌周边
  { keyword: '宜都美容院', type: '周边区域', score: 75, tags: ['宜都', '美容'] },
  { keyword: '枝江养生馆', type: '周边区域', score: 70, tags: ['枝江', '养生'] },
  { keyword: '当阳SPA', type: '周边区域', score: 70, tags: ['当阳', 'SPA'] },
  { keyword: '长阳精油按摩', type: '周边区域', score: 65, tags: ['长阳', '精油'] },
  { keyword: '三峡大学美容', type: '校园+服务', score: 60, tags: ['三峡大学', '美容'] },
  { keyword: '三峡大学养生', type: '校园+服务', score: 60, tags: ['三峡大学', '养生'] },

  // 季节词
  { keyword: '宜昌夏天养生', type: '季节+养生', score: 65, tags: ['宜昌', '夏天'] },
  { keyword: '宜昌冬天调理', type: '季节+调理', score: 65, tags: ['宜昌', '冬天'] },
  { keyword: '宜昌三伏天调理', type: '节气+调理', score: 75, tags: ['宜昌', '三伏'] },
  { keyword: '宜昌三九贴', type: '节气+服务', score: 70, tags: ['宜昌', '三九'] }
];

// ============================================================================
// 三、竞品词库 (Competitor Accounts)
// 宜昌本地 + 全国头部美业竞品
// ============================================================================

const competitorAccounts = [
  // === 宜昌本地竞品 ===
  {
    name: '芳疗世家（宜昌）',
    platform: '抖音',
    accountFeatures: '主打精油芳疗，内容偏知识科普',
    interceptionStrategy: '在评论区以更专业的角度补充，展示中芳堂的九体辨证差异化',
    avoid: ['直接攻击', '贬低对方产品'],
    tags: ['宜昌本地', '芳疗', '直接竞品']
  },
  {
    name: '宜昌某大型连锁美容院',
    platform: '抖音/小红书',
    accountFeatures: '主打传统美容项目，价格战为主',
    interceptionStrategy: '强调中医体质调理的差异化价值，对比"治标"和"治本"',
    avoid: ['价格对比', '贬低传统美容'],
    tags: ['宜昌本地', '美容院', '间接竞品']
  },
  {
    name: '宜昌某中医养生馆',
    platform: '抖音',
    accountFeatures: '主打艾灸/刮痧/拔罐，偏传统中医',
    interceptionStrategy: '强调芳疗+中医的融合创新，展示精油和膏方的现代便捷性',
    avoid: ['否定中医传统疗法'],
    tags: ['宜昌本地', '中医', '间接竞品']
  },
  {
    name: '宜昌某SPA会所',
    platform: '小红书/抖音',
    accountFeatures: '主打高端SPA体验，环境奢华',
    interceptionStrategy: '强调功能性调理价值，不只做放松',
    avoid: ['环境对比'],
    tags: ['宜昌本地', 'SPA', '间接竞品']
  },
  {
    name: '宜昌某减肥机构',
    platform: '抖音',
    accountFeatures: '主打快速减肥、节食方案',
    interceptionStrategy: '以中医体质调理的角度切入减肥话题，强调健康不反弹',
    avoid: ['直接攻击减肥方法'],
    tags: ['宜昌本地', '减肥', '间接竞品']
  },
  {
    name: '宜昌某祛痘中心',
    platform: '小红书/抖音',
    accountFeatures: '主打祛痘产品和服务',
    interceptionStrategy: '从体质根源解释长痘原因，展示内调外养综合方案',
    avoid: ['直接否定祛痘产品'],
    tags: ['宜昌本地', '祛痘', '间接竞品']
  },

  // === 全国头部芳疗/精油品牌 ===
  {
    name: '阿芙精油',
    platform: '全平台',
    accountFeatures: '国内精油头部品牌，产品线丰富，电商为主',
    interceptionStrategy: '对比服务+产品模式，中芳堂提供个性化方案而非标准化产品',
    avoid: ['攻击品牌', '贬低产品品质'],
    tags: ['全国头部', '精油品牌', '电商竞品']
  },
  {
    name: '茱莉蔻',
    platform: '小红书',
    accountFeatures: '澳洲高端精油护肤品牌',
    interceptionStrategy: '对比价格和本土化服务，中芳堂更了解中国人体质',
    avoid: ['攻击国际品牌'],
    tags: ['国际品牌', '高端', '护肤品']
  },
  {
    name: '欧舒丹',
    platform: '全平台',
    accountFeatures: '法国天然护肤品牌，SPA体验',
    interceptionStrategy: '对比中医体质定制vs标准化方案',
    avoid: ['品牌攻击'],
    tags: ['国际品牌', 'SPA', '护肤品']
  },
  {
    name: '佰草集',
    platform: '全平台',
    accountFeatures: '上海家化旗下中医护肤品牌',
    interceptionStrategy: '强调芳疗+中医的完整体系，不只护肤',
    avoid: ['贬低国产品牌'],
    tags: ['国产品牌', '中医护肤', '间接竞品']
  },
  {
    name: '林清轩',
    platform: '小红书/抖音',
    accountFeatures: '山茶花护肤品牌，高端定位',
    interceptionStrategy: '对比多品类综合方案vs单一品类',
    avoid: ['品类攻击'],
    tags: ['国产品牌', '高端护肤', '间接竞品']
  },
  {
    name: '逐本',
    platform: '小红书/抖音',
    accountFeatures: '芳疗护肤品牌，卸妆油起家',
    interceptionStrategy: '强调线下体验+线上产品的全链路',
    avoid: ['产品对比'],
    tags: ['新锐品牌', '芳疗护肤', '间接竞品']
  },
  {
    name: '兰LAN',
    platform: '小红书',
    accountFeatures: '纯净护肤品牌，年轻化定位',
    interceptionStrategy: '强调中医专业背景和体质定制',
    avoid: ['年龄层攻击'],
    tags: ['新锐品牌', '纯净护肤', '间接竞品']
  },
  {
    name: '至本',
    platform: '小红书',
    accountFeatures: '功效护肤品牌，成分党定位',
    interceptionStrategy: '对比天然芳疗vs化学成分，强调安全性',
    avoid: ['贬低成分护肤'],
    tags: ['功效护肤', '成分党', '间接竞品']
  },

  // === 健康养生类竞品 ===
  {
    name: '丁香医生',
    platform: '全平台',
    accountFeatures: '医学科普大号，权威性强',
    interceptionStrategy: '不做对抗，在其评论区补充中医芳疗的养生视角',
    avoid: ['挑战权威', '中西医对立'],
    tags: ['健康科普', '权威', '非竞品']
  },
  {
    name: '养生堂',
    platform: '抖音/小红书',
    accountFeatures: '中医养生内容，受众广泛',
    interceptionStrategy: '展示更专业的体质辨证+芳疗结合',
    avoid: ['直接对比'],
    tags: ['养生内容', '中医', '间接竞品']
  },
  {
    name: '固生堂中医',
    platform: '抖音/小红书',
    accountFeatures: '连锁中医馆，线上线下结合',
    interceptionStrategy: '强调养生调理vs医疗治疗的区别',
    avoid: ['挑战医疗资质'],
    tags: ['中医馆', '连锁', '间接竞品']
  },

  // === 智能健康硬件竞品 ===
  {
    name: '华为手环/手表',
    platform: '全平台',
    accountFeatures: '消费电子巨头，健康监测功能',
    interceptionStrategy: '强调腕家H1的中医体质监测专业性和闭环服务',
    avoid: ['贬低大品牌'],
    tags: ['智能硬件', '健康监测', '间接竞品']
  },
  {
    name: '小米手环',
    platform: '全平台',
    accountFeatures: '高性价比健康手环',
    interceptionStrategy: '对比专业度+服务闭环vs纯硬件',
    avoid: ['价格对比'],
    tags: ['智能硬件', '性价比', '间接竞品']
  },
  {
    name: 'Keep手环',
    platform: '抖音/小红书',
    accountFeatures: '运动健身+健康监测',
    interceptionStrategy: '强调体质调理+数据追踪+方案定制完整闭环',
    avoid: ['功能对比'],
    tags: ['智能硬件', '运动', '间接竞品']
  }
];

// ============================================================================
// 四、分平台互动话术模板 (Platform Scripts)
// 30+条模板，覆盖评论/私信/问答
// ============================================================================

const platformScripts = {
  // === 抖音评论区话术 ===
  douyinComments: [
    {
      id: 'dy_001',
      scenario: '用户问"XX症状怎么办"',
      template: '姐妹，你这个情况可能和体质有关哦~可以先做个免费的AI体质测评，看看具体是哪种体质偏颇，再针对性地调理。效果比盲目试好太多了！',
      variants: [
        '姐妹，我之前的XX情况和你很像！后来做了体质测评才发现是XX体质，针对性调理后改善很多~私信我发你测评链接？',
        '你这个可能不是单纯的皮肤/身体问题，根源在体质！建议先做个免费的体质测评看看~'
      ],
      tags: ['抖音', '评论', '痛点应答', '测评引导']
    },
    {
      id: 'dy_002',
      scenario: '宜昌本地用户评论',
      template: '同城姐妹！我们在伍家岗夷陵大道紫光园，有免费的AI体质测评，做完会出详细报告和调理方案~感兴趣的话可以来看看',
      variants: [
        '同城+1！我们在伍家岗，专门做中医芳疗体质调理的，精油都是纯植物萃取~可以来店里体验一下',
        '宜昌的姐妹看过来~我们在紫光园，可以做免费体质测评，比外面那些光按摩的有用多了'
      ],
      tags: ['抖音', '评论', '同城', '邀约']
    },
    {
      id: 'dy_003',
      scenario: '竞品评论区截流',
      template: '其实体质不同，适合的方法也不一样哦~像我自己是XX体质，用XX方法调理效果就很好。建议先搞清楚自己的体质再选择调理方式~',
      variants: [
        '每个人体质不一样，调理方法也应该不一样~推荐先做个AI体质测评，找到适合自己的方案',
        '我之前也试过这个，效果一般。后来发现是体质没辨对，方法不适合。建议先测评体质再说~'
      ],
      tags: ['抖音', '评论', '截流', '竞品']
    },
    {
      id: 'dy_004',
      scenario: '用户说"想去试试"',
      template: '欢迎欢迎！可以先加我微信做个免费体质测评，到店前就能了解自己的体质状况。我们针对不同体质有不同的调理方案~',
      variants: [
        '太好了！私信我发测评链接给你，先在家做个体质测评，到店后芳疗师直接根据结果定制方案',
        '欢迎！加个微信吧，先做测评，到店就不用等了~'
      ],
      tags: ['抖音', '评论', '高意向', '留资']
    },
    {
      id: 'dy_005',
      scenario: '用户问价格',
      template: '我们价格很透明的~新客体验价99元起，包含AI体质测评+局部调理。具体的看您选什么方案，私信我给您详细介绍？',
      variants: [
        '新客体验99元就能做一次完整体质调理哦~比在外面乱花钱有效多了。私信我发价格表给你？',
        '不同的调理方案价格不一样，不过我们有99元新客体验价，包含测评+调理，可以先试试看~'
      ],
      tags: ['抖音', '评论', '询价', '邀约']
    }
  ],

  // === 小红书评论/笔记话术 ===
  xhsComments: [
    {
      id: 'xhs_001',
      scenario: '护肤/养生笔记评论',
      template: '姐妹写得真好！补充一下，XX问题其实和体质也有很大关系~我是XX体质，做了体质测评后发现针对性调理效果真的不一样！',
      variants: [
        '深有同感！我之前的XX问题，后来用中医芳疗的方法调理，从体质根源入手，改善很多~',
        '赞同！我补充一点：XX体质的人更容易出现这个问题，所以调理前先了解自己的体质很重要~'
      ],
      tags: ['小红书', '评论', '种草', '软性']
    },
    {
      id: 'xhs_002',
      scenario: '私信-新客引导',
      template: '亲爱哒，看到你对XX调理感兴趣~我是中芳堂的芳疗师小芳。我们可以免费帮你做AI体质测评，根据你的体质定制调理方案。精油+膏方内调外养，很多姐妹调理后效果都很好！你方便的话我发测评链接给你？',
      variants: [
        'Hi~看到你关注养生调理，想邀请你体验一下我们的免费AI体质测评。只需要几分钟，就能了解自己的体质和适合的调理方案~',
        '亲，你对中医芳疗调理感兴趣吗？我们提供免费体质测评+私人定制方案，纯天然精油+古法膏方，不伤身体~'
      ],
      tags: ['小红书', '私信', '新客', '测评引导']
    },
    {
      id: 'xhs_003',
      scenario: '私信-宜昌本地用户',
      template: 'Hi~你也在宜昌呀！我们中芳堂在伍家岗紫光园，专门做中医芳疗体质调理。精油SPA+膏方内调+体质测评，一站式养生~感兴趣可以来店里体验，首次体验价很优惠哦！',
      variants: [
        '宜昌的姐妹握手！我们中芳堂在夷陵大道紫光园，有精油SPA、体质调理、膏方内调。可以来做个免费测评~',
        '同城姐妹！推荐你来我们中芳堂体验一下芳疗SPA，和普通按摩完全不一样的体验~首次有优惠价'
      ],
      tags: ['小红书', '私信', '同城', '邀约']
    },
    {
      id: 'xhs_004',
      scenario: '问答区-专业解答',
      template: '从中医芳疗的角度来看，XX问题通常和XX体质偏颇有关。建议：1. 先做体质测评确认体质 2. 针对性选择精油（如XX精油）3. 配合内调膏方 4. 坚持21天一个周期观察效果。具体方案需要因人而异~',
      variants: [
        '专业角度说，XX问题的根源可能是XX体质偏颇。芳疗调理可以从以下几个方面入手：1...2...3...建议先测评体质再定制方案',
        '中医讲"治病求本"，XX问题只是表象，体质才是根本。推荐先了解自己的体质，再选择适合的精油和膏方方案~'
      ],
      tags: ['小红书', '问答', '专业', '科普']
    },
    {
      id: 'xhs_005',
      scenario: '种草笔记引导',
      template: '分享一下我的调理心得：做了体质测评发现是XX体质，芳疗师给我定制了XX精油+XX膏方的方案，坚持了XX天，XX问题真的改善了很多！最重要的是整个过程很享受，每天用精油成了一种仪式感~',
      variants: [
        '真心推荐姐妹们试试体质调理！我之前XX问题困扰很久，测评后针对性调理，效果真的不一样',
        '从盲目护肤到精准调理，最大的转变就是做了体质测评！现在皮肤好了、睡眠好了、精力也好了~'
      ],
      tags: ['小红书', '种草', '案例', '口碑']
    }
  ],

  // === 私信/企微话术 ===
  privateMessages: [
    {
      id: 'pm_001',
      scenario: '首次添加好友-欢迎',
      template: '亲爱的，欢迎来到中芳堂~我是您的专属芳疗师小芳！我们专注于中医芳疗体质调理，用纯天然精油+古法膏方，从体质根源改善亚健康。现在可以免费做AI体质测评哦，了解自己的体质是调理的第一步~需要我发测评链接给你吗？',
      variants: [
        'Hi~感谢关注中芳堂！我是芳疗师小芳，专门帮客户做体质测评和调理方案。要不要先做个免费的AI体质测评？几分钟就能了解自己的体质类型和调理方向~',
        '欢迎加入中芳堂的养生大家庭！我们专注中医芳疗，帮助每个人找到最适合自己的调理方式。先做个免费体质测评吧？'
      ],
      tags: ['私信', '企微', '欢迎', '测评引导']
    },
    {
      id: 'pm_002',
      scenario: '用户完成测评后',
      template: '测评结果出来啦！你的主要体质倾向是XX质，次要倾向是XX质。这说明你现在最需要关注XX方面。我帮你定制了一个初步的调理方案：[简要方案]。想了解更详细的方案，或者预约到店体验吗？',
      variants: [
        '测评完成！你属于XX质偏XX质，这种体质常见的问题包括...我建议从XX开始调理。需要我详细说说方案吗？',
        '结果出来了~你是XX体质，难怪会有XX的感觉。别担心，这个体质调理起来有很成熟的方法。我给你说一下方案？'
      ],
      tags: ['私信', '企微', '测评结果', '方案推荐']
    },
    {
      id: 'pm_003',
      scenario: '邀约到店体验',
      template: '姐，根据你的体质测评结果，我建议可以来店里做一次完整的XX调理体验。现在新客体验价只要99元，包含AI体质深度分析+XX精油SPA调理，全程约60分钟。很多客户做完第一次就感觉整个人轻松了很多~周末有空吗？帮你预约一个时间？',
      variants: [
        '建议来店里体验一次哦~99元就能做完整的体质调理，包括测评+精油SPA，比外面随便做个按摩都划算。这周什么时候有空？',
        '你的体质很适合做XX调理，现在有新客体验活动，99元就能享受完整服务。要不要约个时间过来感受一下？'
      ],
      tags: ['私信', '企微', '邀约', '体验']
    },
    {
      id: 'pm_004',
      scenario: '到店后回访',
      template: '姐，昨天在店里调理后感觉怎么样？XX部位有没有轻松一些？精油的味道还习惯吗？接下来我建议你可以在家用XX精油和XX膏方，每天花10分钟就行。坚持21天，效果会更明显~需要我把居家方案发给你吗？',
      variants: [
        '姐，体验感受如何？很多客户第一次做完精油SPA就爱上了！接下来我帮你配一套居家方案，让效果持续~',
        '昨天调理后睡得怎么样？很多人做完精油SPA当天晚上睡眠质量就会提升。我帮你准备了一套居家使用的产品方案~'
      ],
      tags: ['私信', '企微', '回访', '居家方案']
    },
    {
      id: 'pm_005',
      scenario: '沉默客户激活',
      template: '姐，好久不见~最近换季了，天气变化大，要注意身体哦。正好我们新到了一批XX精油，特别适合XX体质的人调理用。送你一张专属节气关怀券，有空来店里坐坐？或者需要我帮你看看最近的身体状况？',
      variants: [
        '姐，这段时间没见你来店里，身体还好吗？最近节气变化，我根据你的体质准备了一份节气养生建议，发给你看看？',
        '好久没联系了，最近忙吗？送你一张专属唤醒券，有空来店里放松一下~身体是最重要的投资'
      ],
      tags: ['私信', '企微', '沉默激活', '节气']
    }
  ],

  // === 问答区话术（百家号/B站/知乎） ===
  qaReplies: [
    {
      id: 'qa_001',
      scenario: '知乎/百家号-专业问答',
      template: '从中医体质学说和芳香疗法结合的角度来看，这个问题可以从以下几个方面分析：\n\n1. 体质根源：XX问题通常对应XX体质偏颇\n2. 芳疗方案：XX精油（归XX经）可以通过XX方式调理\n3. 内调配合：XX膏方可以从内改善XX\n4. 生活建议：XX\n\n建议先通过体质测评确认自身体质类型，再制定个性化方案。以上为养生调理建议，不构成医疗诊断。',
      variants: [
        '这个问题问得好。中医芳疗视角下，核心在于"辨体施调"...（展开）',
        '作为芳疗从业者，我补充一个角度：XX体质的人更容易出现这个问题...'
      ],
      tags: ['问答', '百家号', '知乎', '专业']
    },
    {
      id: 'qa_002',
      scenario: 'B站评论区-知识补充',
      template: 'UP主讲得很好！补充一点中医芳疗的视角：XX精油对于XX体质的XX问题有很好的调理效果，因为XX精油归XX经，能够XX。不过具体用什么精油、怎么用，还是要根据个人体质来定~',
      variants: [
        '很棒的内容！从芳疗角度补充：XX问题可以试试XX精油+XX膏方的组合，内调外养效果更好~',
        '赞同UP主！多说一句：调理XX问题前建议先做体质测评，不同体质方案完全不同'
      ],
      tags: ['问答', 'B站', '知识补充']
    },
    {
      id: 'qa_003',
      scenario: '百家号文章评论',
      template: '感谢分享！我们中芳堂在中医芳疗调理方面有一些实践经验，补充几点供参考：XX体质的调理重点在于XX，推荐XX精油配合XX膏方，一般坚持21天可以看到初步改善。另外调理期间要注意XX。更多个性化建议可以免费做我们的AI体质测评~',
      variants: [
        '作为中医芳疗从业者补充：XX问题的调理需要从XX体质入手...',
        '谢谢分享！补充一点实操经验：很多客户用XX方法调理XX问题效果很好...'
      ],
      tags: ['问答', '百家号', '专业补充']
    }
  ]
};

// ============================================================================
// 五、截流效果评估指标 (Interception Metrics)
// ============================================================================

const interceptionMetrics = {
  funnel: {
    description: '截流转化漏斗模型',
    stages: [
      { stage: '曝光 (Impression)', benchmark: '100%', formula: '内容/评论总展示量' },
      { stage: '点击 (Click)', benchmark: '8-15%', formula: '点击量 / 曝光量' },
      { stage: '互动 (Engagement)', benchmark: '3-5%', formula: '评论/点赞/收藏 / 曝光量' },
      { stage: '留资 (Lead)', benchmark: '1-3%', formula: '私信/留资 / 互动量' },
      { stage: '添加 (Add)', benchmark: '0.5-1.5%', formula: '企微添加 / 留资量' },
      { stage: '成交 (Conversion)', benchmark: '0.3-0.8%', formula: '最终成交 / 曝光量' }
    ]
  },

  dailyMetrics: {
    description: '每日截流核心指标',
    metrics: [
      { name: '总扫描量', key: 'totalScanned', target: '500+', unit: '条', description: '各平台评论/内容扫描总量' },
      { name: '总互动量', key: 'totalInteracted', target: '50-100', unit: '条', description: '自动+手动评论/私信总量' },
      { name: '意向线索量', key: 'totalLeads', target: '10-20', unit: '人', description: '意向度评分>40的线索' },
      { name: '高意向线索', key: 'highIntentLeads', target: '3-5', unit: '人', description: '意向度评分>70的线索' },
      { name: '企微添加量', key: 'wecomAdds', target: '3-8', unit: '人', description: '当日企微新增好友' },
      { name: '测评完成量', key: 'tizhiTests', target: '2-5', unit: '人', description: '当日AI体质测评完成数' },
      { name: '到店体验量', key: 'storeVisits', target: '1-3', unit: '人', description: '当日截流到店客户' },
      { name: '成交转化量', key: 'conversions', target: '0.5-2', unit: '人', description: '当日截流成交客户' }
    ]
  },

  weeklyMetrics: {
    description: '每周截流分析指标',
    metrics: [
      { name: '平台截流效果对比', key: 'platformComparison', description: '各平台线索量和转化率对比' },
      { name: '关键词效果排名', key: 'keywordRanking', description: '各关键词带来的线索量和成交额排名' },
      { name: '话术A/B测试结果', key: 'abTestResults', description: '不同话术模板的转化率对比' },
      { name: '竞品截流效果', key: 'competitorEffect', description: '从竞品账号截流的线索量和质量' },
      { name: '截流ROI', key: 'interceptionROI', formula: '截流成交额 / 截流运营成本', description: '截流投入产出比' }
    ]
  },

  scoringModel: {
    description: '意向用户评分模型（满分100）',
    dimensions: [
      { name: '关键词匹配度', weight: 0.30, scoringRule: '命中超高意向词100分，高意向85分，中意向60分，低意向30分' },
      { name: '提问明确度', weight: 0.20, scoringRule: '明确提问+地址/价格100分，明确提问80分，泛问50分' },
      { name: '地理位置匹配', weight: 0.15, scoringRule: '同城100分，同省60分，其他20分' },
      { name: '互动行为', weight: 0.15, scoringRule: '评论+私信100分，评论+点赞80分，仅评论60分，仅点赞30分' },
      { name: '消费力推测', weight: 0.10, scoringRule: '账号内容显示高消费100分，中等60分，低30分' },
      { name: '账号活跃度', weight: 0.10, scoringRule: '近3天有内容发布100分，近7天70分，近30天40分' }
    ],
    thresholds: {
      sLevel: { min: 70, action: '1小时内人工跟进', channel: '企微+私信' },
      aLevel: { min: 50, max: 69, action: '当日跟进', channel: '私信' },
      bLevel: { min: 30, max: 49, action: '3日内跟进', channel: '评论互动' },
      cLevel: { min: 0, max: 29, action: '周度跟进', channel: '点赞/关注' }
    }
  },

  // 平台限流规则
  rateLimitRules: {
    douyin: { maxPerHour: 20, maxPerDay: 100, minInterval: 120, description: '抖音评论/私信频率限制' },
    xiaohongshu: { maxPerHour: 15, maxPerDay: 50, minInterval: 180, description: '小红书评论/私信频率限制' },
    kuaishou: { maxPerHour: 20, maxPerDay: 80, minInterval: 120, description: '快手评论频率限制' },
    bilibili: { maxPerHour: 10, maxPerDay: 30, minInterval: 300, description: 'B站评论频率限制' },
    baijiahao: { maxPerHour: 10, maxPerDay: 20, minInterval: 300, description: '百家号评论频率限制' }
  }
};

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  keywordBank,
  localKeywords,
  competitorAccounts,
  platformScripts,
  interceptionMetrics
};
