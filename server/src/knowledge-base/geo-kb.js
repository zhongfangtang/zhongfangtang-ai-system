/**
 * GEO搜索占位知识库 - 中芳堂全域AI智能体
 *
 * 包含GEO搜索占位所需的核心知识：
 * - 各平台搜索规则
 * - 200+关键词矩阵
 * - 结构化内容模板
 * - Schema.org标记规范
 * - 30+条GEO优化规则
 * - 搜索意图分类器
 *
 * @module geo-kb
 * @version 2.0.0
 * @since 2026-07
 */

const BRAND = '中芳堂';
const BRAND_FULL = '中芳堂中医芳香疗法美容美体养生机构';
const CITY = '宜昌';
const PROVINCE = '湖北';

module.exports = {
  meta: {
    brand: BRAND,
    brandFull: BRAND_FULL,
    city: CITY,
    province: PROVINCE,
    version: '2.0.0',
    lastUpdated: '2026-07-11',
    description: `${BRAND}GEO搜索占位知识库，覆盖百度/抖音/小红书/微信搜一搜/B站五大平台`,
  },

  // ============================================================
  // 一、GEO平台规则
  // ============================================================
  platformRules: {
    baidu: {
      name: '百度AI搜索',
      domain: 'baidu.com',
      algorithm: '百度AI大模型 + 文心一言',
      preferences: ['结构化数据', '权威性内容', '时效性内容', 'HTTPS网站', '移动端适配'],
      penalties: ['关键词堆砌', '隐藏文字', '低质量外链', '内容重复', '页面加载慢(>3秒)'],
      contentTypeWeights: {
        faq: 0.9,        // FAQ内容权重高
        howto: 0.85,     // 教程内容权重高
        guide: 0.8,      // 指南类内容
        listicle: 0.7,   // 列表类内容
        article: 0.75,   // 普通文章
        comparison: 0.65, // 对比类内容
      },
      rankingFactors: [
        { factor: '内容质量', weight: 0.25, description: '原创度、深度、实用性' },
        { factor: '结构化标记', weight: 0.15, description: 'Schema.org JSON-LD标记' },
        { factor: '网站权威度', weight: 0.15, description: '域名年龄、外链质量、备案信息' },
        { factor: '用户体验', weight: 0.15, description: '加载速度、移动适配、交互设计' },
        { factor: '关键词匹配', weight: 0.12, description: '标题、摘要、正文关键词布局' },
        { factor: '时效性', weight: 0.10, description: '内容更新频率、发布时间' },
        { factor: '社交信号', weight: 0.08, description: '分享数、评论数、收藏数' },
      ],
      aiSearchOptimization: {
        titlePattern: '{核心关键词}_{地域}_{品牌} - {修饰语}',
        descriptionPattern: '{品牌}专业提供{核心关键词}服务，位于{地域}。{特色卖点1}、{特色卖点2}，{行动号召}。',
        preferredContentLength: '1500-3000字',
        preferredStructures: ['FAQ', 'HowTo', 'Article'],
        schemaTypes: ['FAQPage', 'HowTo', 'Article', 'LocalBusiness', 'BreadcrumbList'],
      },
      apiEndpoints: {
        search: 'https://www.baidu.com/s',
        indexSubmit: 'https://ziyuan.baidu.com/linksubmit/url',
      },
    },

    douyin: {
      name: '抖音搜索',
      domain: 'douyin.com',
      algorithm: '抖音推荐算法 + 搜索匹配',
      preferences: ['短视频内容', '直播内容', 'POI(地理位置)', '话题标签(#)', '高互动率'],
      penalties: ['搬运内容', '低质量视频', '虚假宣传', '违规营销', '刷量行为'],
      contentTypeWeights: {
        video: 1.0,       // 短视频权重最高
        live: 0.95,       // 直播内容
        short_video: 0.9, // 短视频(15-60秒)
        image_text: 0.6,  // 图文内容
      },
      rankingFactors: [
        { factor: '视频完播率', weight: 0.25, description: '用户观看完整视频的比例' },
        { factor: '互动率', weight: 0.20, description: '点赞、评论、分享、收藏' },
        { factor: 'POI相关性', weight: 0.15, description: '地理位置标签匹配度' },
        { factor: '话题标签匹配', weight: 0.12, description: '#话题标签与搜索词相关性' },
        { factor: '账号权重', weight: 0.10, description: '企业号认证、粉丝数、历史表现' },
        { factor: '发布时间', weight: 0.10, description: '内容新鲜度' },
        { factor: '视频质量', weight: 0.08, description: '清晰度、音质、剪辑质量' },
      ],
      aiSearchOptimization: {
        titlePattern: '{痛点场景}？{解决方案} #{核心关键词} #{地域}',
        descriptionPattern: '{情感表达}！在{地域}发现{核心关键词}好去处 #{品牌}',
        preferredContentLength: '视频15-60秒，文案50-100字',
        preferredStructures: ['短视频', '直播切片', '探店打卡'],
        schemaTypes: ['POI', '话题标签', '@品牌号'],
      },
      apiEndpoints: {
        search: 'https://www.douyin.com/search',
        poiSubmit: 'https://www.douyin.com/poi',
      },
    },

    xiaohongshu: {
      name: '小红书搜索',
      domain: 'xiaohongshu.com',
      algorithm: '小红书推荐算法 + 搜索匹配',
      preferences: ['笔记内容', '合集功能', '真实体验分享', '高质量图片', '话题标签'],
      penalties: ['硬广告', '虚假测评', '低质图片', '内容搬运', '引导站外交易'],
      contentTypeWeights: {
        note: 0.9,        // 笔记内容
        collection: 0.85, // 合集内容
        video: 0.8,       // 视频笔记
        live: 0.7,        // 直播内容
      },
      rankingFactors: [
        { factor: '互动量', weight: 0.25, description: '点赞、收藏、评论' },
        { factor: '内容质量', weight: 0.20, description: '原创度、实用价值、图片质量' },
        { factor: '话题匹配', weight: 0.15, description: '话题标签相关性' },
        { factor: '账号权重', weight: 0.15, description: '认证状态、粉丝数、历史互动' },
        { factor: '发布时间', weight: 0.10, description: '内容新鲜度' },
        { factor: '搜索词匹配', weight: 0.10, description: '标题和正文关键词匹配' },
        { factor: '地理位置', weight: 0.05, description: '本地搜索加权' },
      ],
      aiSearchOptimization: {
        titlePattern: '{情感词}！在{地域}发现了{核心关键词}宝藏店铺',
        descriptionPattern: '【个人体验】{核心关键词}真实感受分享 #{话题1} #{话题2}',
        preferredContentLength: '800-1500字笔记',
        preferredStructures: ['体验笔记', '测评合集', '攻略指南', '对比评测'],
        schemaTypes: ['话题标签', '合集', '店铺标签'],
      },
      apiEndpoints: {
        search: 'https://www.xiaohongshu.com/search_result',
      },
    },

    weixin: {
      name: '微信搜一搜',
      domain: 'weixin.qq.com',
      algorithm: '微信搜索算法 + 社交关系权重',
      preferences: ['公众号内容', '视频号内容', '小程序服务', '社交分享', '品牌官方区'],
      penalties: ['诱导分享', '标题党', '虚假信息', '违规营销', '低质量内容'],
      contentTypeWeights: {
        official_account: 0.9, // 公众号文章
        video_channel: 0.85,   // 视频号内容
        mini_program: 0.8,     // 小程序服务
        moments: 0.6,          // 朋友圈内容
      },
      rankingFactors: [
        { factor: '公众号质量', weight: 0.20, description: '认证状态、原创度、粉丝活跃度' },
        { factor: '社交传播', weight: 0.18, description: '分享数、在看数、阅读量' },
        { factor: '内容相关性', weight: 0.18, description: '标题和正文与搜索词匹配' },
        { factor: '品牌官方区', weight: 0.15, description: '是否开通品牌官方区' },
        { factor: '小程序关联', weight: 0.12, description: '是否关联小程序服务' },
        { factor: '发布时间', weight: 0.10, description: '内容新鲜度' },
        { factor: '互动质量', weight: 0.07, description: '评论质量、点赞数' },
      ],
      aiSearchOptimization: {
        titlePattern: '{数字}个{核心关键词}方法，第{数字}个最有效！',
        descriptionPattern: '{品牌}为您分享{核心关键词}的专业知识，{地域}本地{品牌}，{行动号召}',
        preferredContentLength: '1000-2000字',
        preferredStructures: ['公众号文章', '视频号内容', '小程序页面'],
        schemaTypes: ['公众号', '视频号', '小程序'],
      },
      apiEndpoints: {
        search: 'https://weixin.sogou.com/weixin',
      },
    },

    bilibili: {
      name: 'B站搜索',
      domain: 'bilibili.com',
      algorithm: 'B站推荐算法 + 搜索匹配',
      preferences: ['长视频内容', '专栏文章', '教程科普', '原创内容', '弹幕互动'],
      penalties: ['搬运内容', '低创视频', '标题党', '违规内容', '刷量行为'],
      contentTypeWeights: {
        video: 0.9,       // 视频内容
        column: 0.85,     // 专栏文章
        live: 0.7,        // 直播内容
        dynamic: 0.5,     // 动态内容
      },
      rankingFactors: [
        { factor: '内容质量', weight: 0.22, description: '原创度、深度、制作水平' },
        { factor: '互动数据', weight: 0.20, description: '播放量、弹幕、投币、收藏' },
        { factor: 'UP主影响力', weight: 0.18, description: '粉丝数、历史作品质量' },
        { factor: '搜索匹配', weight: 0.15, description: '标题、标签、简介关键词匹配' },
        { factor: '分区匹配', weight: 0.10, description: '内容分区与搜索意图匹配' },
        { factor: '发布时间', weight: 0.10, description: '内容新鲜度' },
        { factor: '完播率', weight: 0.05, description: '用户观看完整度' },
      ],
      aiSearchOptimization: {
        titlePattern: '【科普】{核心关键词}到底是什么？{地域}专业{品牌}告诉你',
        descriptionPattern: '{品牌}为您科普{核心关键词}，{地域}本地专业{品牌}，{特色介绍}',
        preferredContentLength: '视频3-15分钟，专栏1500-3000字',
        preferredStructures: ['教程视频', '科普专栏', '体��Vlog', '知识分享'],
        schemaTypes: ['分区标签', '合集', '专栏'],
      },
      apiEndpoints: {
        search: 'https://search.bilibili.com/all',
      },
    },
  },

  // ============================================================
  // 二、关键词矩阵（200+词）
  // ============================================================
  keywordMatrix: {
    // ----- 核心品牌词 (20+) -----
    core: [
      { keyword: BRAND, volume: 3200, competition: 0.15, type: 'brand', priority: 100 },
      { keyword: `${BRAND}美容`, volume: 1800, competition: 0.25, type: 'brand+service', priority: 95 },
      { keyword: `${BRAND}养生`, volume: 1200, competition: 0.20, type: 'brand+service', priority: 90 },
      { keyword: `${BRAND}${CITY}`, volume: 2800, competition: 0.10, type: 'brand+local', priority: 98 },
      { keyword: BRAND_FULL, volume: 800, competition: 0.05, type: 'brand_full', priority: 85 },
      { keyword: '中医芳香疗法', volume: 4500, competition: 0.35, type: 'category', priority: 88 },
      { keyword: '精油芳疗美容', volume: 3200, competition: 0.40, type: 'category', priority: 82 },
      { keyword: '体质调理养生', volume: 2800, competition: 0.30, type: 'category', priority: 85 },
      { keyword: '中医经络美容', volume: 2200, competition: 0.35, type: 'category', priority: 80 },
      { keyword: '中药熏蒸养生', volume: 1500, competition: 0.20, type: 'category', priority: 78 },
      { keyword: '草本精油护理', volume: 1800, competition: 0.30, type: 'category', priority: 76 },
      { keyword: '中医面部护理', volume: 2600, competition: 0.35, type: 'category', priority: 82 },
      { keyword: '艾灸养生馆', volume: 5500, competition: 0.50, type: 'category', priority: 75 },
      { keyword: '经络疏通调理', volume: 3200, competition: 0.40, type: 'category', priority: 80 },
      { keyword: '中药面膜美容', volume: 2100, competition: 0.35, type: 'category', priority: 78 },
      { keyword: '中医体质辨识', volume: 1800, competition: 0.25, type: 'category', priority: 82 },
      { keyword: '芳香精油按摩', volume: 4500, competition: 0.45, type: 'category', priority: 78 },
      { keyword: '中医美容院', volume: 6800, competition: 0.55, type: 'category', priority: 72 },
      { keyword: '草本养颜护理', volume: 1600, competition: 0.30, type: 'category', priority: 76 },
      { keyword: `${BRAND}精油`, volume: 1200, competition: 0.10, type: 'brand+product', priority: 90 },
      { keyword: `${BRAND}预约`, volume: 800, competition: 0.05, type: 'brand+action', priority: 92 },
      { keyword: `${BRAND}价格`, volume: 600, competition: 0.05, type: 'brand+action', priority: 88 },
    ],

    // ----- 长尾需求词 (50+) -----
    longTail: [
      { keyword: '精油祛痘效果好吗', volume: 1200, competition: 0.55, priority: 70 },
      { keyword: '中医调理内分泌失调', volume: 1800, competition: 0.45, priority: 75 },
      { keyword: '精油按摩减肥瘦身', volume: 2200, competition: 0.50, priority: 72 },
      { keyword: '中医体质调理需要多久', volume: 900, competition: 0.35, priority: 78 },
      { keyword: '精油芳疗改善睡眠', volume: 1600, competition: 0.50, priority: 72 },
      { keyword: '中医经络疏通的好处', volume: 1500, competition: 0.40, priority: 76 },
      { keyword: '精油缓解肩颈酸痛', volume: 1800, competition: 0.50, priority: 72 },
      { keyword: '中药熏蒸排毒效果', volume: 800, competition: 0.30, priority: 78 },
      { keyword: '精油调理月经不调', volume: 1400, competition: 0.50, priority: 70 },
      { keyword: '中医面部提拉紧致', volume: 1200, competition: 0.40, priority: 76 },
      { keyword: '精油美白淡斑方法', volume: 1800, competition: 0.55, priority: 68 },
      { keyword: '中医艾灸祛寒湿', volume: 1600, competition: 0.40, priority: 76 },
      { keyword: '精油头皮护理防脱', volume: 1000, competition: 0.40, priority: 72 },
      { keyword: '中医调理脾胃虚弱', volume: 1200, competition: 0.35, priority: 78 },
      { keyword: '精油缓解焦虑压力', volume: 1500, competition: 0.55, priority: 68 },
      { keyword: '中医体质养生方法', volume: 2000, competition: 0.50, priority: 72 },
      { keyword: '精油淋巴排毒按摩', volume: 800, competition: 0.35, priority: 76 },
      { keyword: '中医拔罐刮痧好处', volume: 2200, competition: 0.45, priority: 74 },
      { keyword: '精油香薰助眠配方', volume: 1800, competition: 0.55, priority: 68 },
      { keyword: '中医调理亚健康状态', volume: 1600, competition: 0.40, priority: 76 },
      { keyword: '精油淡化妊娠纹', volume: 900, competition: 0.40, priority: 72 },
      { keyword: '中医穴位按摩养生', volume: 2500, competition: 0.45, priority: 74 },
      { keyword: '精油缓解痛经方法', volume: 1200, competition: 0.50, priority: 70 },
      { keyword: '中医调理气血不足', volume: 1400, competition: 0.40, priority: 76 },
      { keyword: '精油提升免疫力', volume: 800, competition: 0.40, priority: 72 },
      { keyword: '中医产后恢复调理', volume: 1100, competition: 0.40, priority: 74 },
      { keyword: '精油改善皮肤暗沉', volume: 1600, competition: 0.55, priority: 68 },
      { keyword: '中医调理更年期', volume: 1000, competition: 0.35, priority: 78 },
      { keyword: '精油抗衰老紧致肌肤', volume: 2200, competition: 0.55, priority: 68 },
      { keyword: '中医调理湿气重', volume: 2800, competition: 0.50, priority: 72 },
      { keyword: '精油舒缓眼部疲劳', volume: 800, competition: 0.35, priority: 76 },
      { keyword: '中医体质辩证调理', volume: 1200, competition: 0.35, priority: 78 },
      { keyword: '精油去黑头收缩毛孔', volume: 1800, competition: 0.55, priority: 68 },
      { keyword: '中医调理失眠多梦', volume: 1600, competition: 0.40, priority: 76 },
      { keyword: '精油淡化痘印痘疤', volume: 1400, competition: 0.55, priority: 68 },
      { keyword: '中医调理便秘腹胀', volume: 800, competition: 0.35, priority: 76 },
      { keyword: '精油舒缓肌肉酸痛', volume: 1500, competition: 0.50, priority: 70 },
      { keyword: '中医火罐刮痧调理', volume: 1200, competition: 0.40, priority: 74 },
      { keyword: '精油芳疗入门指南', volume: 1000, competition: 0.40, priority: 74 },
      { keyword: '中医调理宫寒不孕', volume: 800, competition: 0.30, priority: 78 },
      { keyword: '精油按摩手法教程', volume: 2200, competition: 0.45, priority: 74 },
      { keyword: '中医体质自测方法', volume: 1600, competition: 0.35, priority: 80 },
      { keyword: '精油香薰配方大全', volume: 2000, competition: 0.50, priority: 70 },
      { keyword: '中医经络养生之道', volume: 1800, competition: 0.40, priority: 76 },
      { keyword: '精油调理油性肌肤', volume: 1000, competition: 0.40, priority: 72 },
      { keyword: '中医调理脾虚湿盛', volume: 800, competition: 0.30, priority: 78 },
      { keyword: '精油晒后修复方法', volume: 1200, competition: 0.40, priority: 74 },
      { keyword: '中医调理肝火旺盛', volume: 900, competition: 0.30, priority: 78 },
      { keyword: '精油敏感肌护理', volume: 1400, competition: 0.45, priority: 72 },
      { keyword: '中医九种体质辨别', volume: 1800, competition: 0.35, priority: 80 },
      { keyword: '精油调配入门教程', volume: 800, competition: 0.35, priority: 74 },
      { keyword: '中医四季养生方法', volume: 1500, competition: 0.40, priority: 76 },
    ],

    // ----- 问题搜索词 (40+) -----
    question: [
      { keyword: `${CITY}哪家美容院好`, volume: 3200, competition: 0.60, priority: 72 },
      { keyword: '中医精油芳疗有用吗', volume: 1800, competition: 0.55, priority: 70 },
      { keyword: '精油按摩能减肥吗', volume: 2200, competition: 0.55, priority: 68 },
      { keyword: '体质调理真的有效吗', volume: 1600, competition: 0.50, priority: 72 },
      { keyword: `${BRAND}怎么样`, volume: 1200, competition: 0.15, priority: 92 },
      { keyword: `${CITY}哪里可以做中医美容`, volume: 1500, competition: 0.40, priority: 78 },
      { keyword: '精油芳疗多少钱一次', volume: 1800, competition: 0.55, priority: 68 },
      { keyword: '中医调理和西医美容哪个好', volume: 1000, competition: 0.40, priority: 74 },
      { keyword: '精油按摩要注意什么', volume: 1400, competition: 0.50, priority: 70 },
      { keyword: '怎么判断自己是什么体质', volume: 2800, competition: 0.45, priority: 76 },
      { keyword: `${BRAND}靠谱吗`, volume: 800, competition: 0.10, priority: 90 },
      { keyword: `${CITY}美容养生哪里性价比高`, volume: 1000, competition: 0.45, priority: 74 },
      { keyword: '精油对皮肤有什么好处', volume: 2200, competition: 0.55, priority: 68 },
      { keyword: '中医调理需要多长时间', volume: 1200, competition: 0.40, priority: 76 },
      { keyword: '精油按摩和普通按摩有什么区别', volume: 1000, competition: 0.40, priority: 74 },
      { keyword: `${CITY}中医美容哪家专业`, volume: 1500, competition: 0.50, priority: 74 },
      { keyword: '精油芳疗适合什么人群', volume: 800, competition: 0.40, priority: 72 },
      { keyword: '中医体质调理会反弹吗', volume: 800, competition: 0.35, priority: 76 },
      { keyword: `${BRAND}价格贵吗`, volume: 600, competition: 0.10, priority: 88 },
      { keyword: `${CITY}精油按摩推荐`, volume: 1000, competition: 0.40, priority: 76 },
      { keyword: '中医经络疏通疼吗', volume: 800, competition: 0.35, priority: 76 },
      { keyword: '精油香薰对睡眠有帮助吗', volume: 1600, competition: 0.50, priority: 70 },
      { keyword: '中医美容和普通美容有什么区别', volume: 1800, competition: 0.45, priority: 74 },
      { keyword: `${BRAND}有哪些服务项目`, volume: 600, competition: 0.10, priority: 88 },
      { keyword: `${CITY}哪里可以体质检测`, volume: 800, competition: 0.35, priority: 78 },
      { keyword: '精油能改善皮肤松弛吗', volume: 1200, competition: 0.45, priority: 72 },
      { keyword: '中医调理对痛经有效吗', volume: 1400, competition: 0.45, priority: 74 },
      { keyword: `${BRAND}的技师专业吗`, volume: 500, competition: 0.10, priority: 86 },
      { keyword: `${CITY}精油SPA哪家好`, volume: 1200, competition: 0.45, priority: 74 },
      { keyword: '中医艾灸有什么禁忌', volume: 1000, competition: 0.35, priority: 78 },
      { keyword: '精油芳疗有副作用吗', volume: 1600, competition: 0.50, priority: 70 },
      { keyword: `${BRAND}可以刷医保吗`, volume: 300, competition: 0.05, priority: 84 },
      { keyword: `${CITY}哪里可以做中药熏蒸`, volume: 600, competition: 0.30, priority: 78 },
      { keyword: '中医调理内分泌有效吗', volume: 1200, competition: 0.45, priority: 74 },
      { keyword: '精油按摩多久做一次', volume: 1800, competition: 0.45, priority: 74 },
      { keyword: `${BRAND}营业时间是几点`, volume: 400, competition: 0.05, priority: 86 },
      { keyword: `${CITY}中医美容培训`, volume: 800, competition: 0.40, priority: 72 },
      { keyword: '精油芳疗和中医的关系', volume: 600, competition: 0.35, priority: 76 },
      { keyword: `${BRAND}的客户评价怎么样`, volume: 500, competition: 0.10, priority: 88 },
      { keyword: `${CITY}减肥瘦身哪里好`, volume: 2200, competition: 0.55, priority: 68 },
    ],

    // ----- 宜昌地域词 (50+) -----
    local: [
      { keyword: `${CITY}美容院`, volume: 4500, competition: 0.55, priority: 78 },
      { keyword: `${CITY}中医养生`, volume: 3200, competition: 0.40, priority: 82 },
      { keyword: `${CITY}精油芳疗`, volume: 1200, competition: 0.25, priority: 86 },
      { keyword: `${CITY}SPA会所`, volume: 3800, competition: 0.55, priority: 74 },
      { keyword: `${CITY}美容养生馆`, volume: 2800, competition: 0.50, priority: 76 },
      { keyword: `${CITY}经络疏通`, volume: 1500, competition: 0.35, priority: 82 },
      { keyword: `${CITY}艾灸馆`, volume: 1800, competition: 0.40, priority: 78 },
      { keyword: `${CITY}减肥中心`, volume: 3500, competition: 0.55, priority: 72 },
      { keyword: `${CITY}面部护理`, volume: 2200, competition: 0.45, priority: 76 },
      { keyword: `${CITY}体质调理`, volume: 1000, competition: 0.25, priority: 86 },
      { keyword: `${CITY}中医美容`, volume: 1800, competition: 0.40, priority: 80 },
      { keyword: `${CITY}精油按摩`, volume: 1500, competition: 0.40, priority: 78 },
      { keyword: `${CITY}刮痧拔罐`, volume: 1600, competition: 0.40, priority: 78 },
      { keyword: `${CITY}中药熏蒸`, volume: 600, competition: 0.20, priority: 84 },
      { keyword: `${CITY}产后恢复`, volume: 1200, competition: 0.40, priority: 76 },
      { keyword: `${CITY}祛痘中心`, volume: 1400, competition: 0.45, priority: 74 },
      { keyword: `${CITY}肩颈调理`, volume: 1800, competition: 0.45, priority: 76 },
      { keyword: `${CITY}女性养生`, volume: 1200, competition: 0.40, priority: 78 },
      { keyword: `${CITY}亚健康调理`, volume: 800, competition: 0.25, priority: 84 },
      { keyword: `${CITY}高端美容`, volume: 1500, competition: 0.45, priority: 74 },
      { keyword: `${CITY}芳香疗法`, volume: 500, competition: 0.20, priority: 84 },
      { keyword: `${CITY}中医推拿`, volume: 2800, competition: 0.50, priority: 74 },
      { keyword: `${CITY}排毒养颜`, volume: 1600, competition: 0.45, priority: 74 },
      { keyword: `${CITY}卵巢保养`, volume: 1000, competition: 0.40, priority: 74 },
      { keyword: `${CITY}中医馆推荐`, volume: 1800, competition: 0.45, priority: 76 },
      { keyword: '西陵区美容院', volume: 800, competition: 0.35, priority: 78 },
      { keyword: '伍家岗区美容养生', volume: 600, competition: 0.30, priority: 80 },
      { keyword: '夷陵区SPA', volume: 500, competition: 0.30, priority: 80 },
      { keyword: '点军区美容院', volume: 300, competition: 0.20, priority: 82 },
      { keyword: '猇亭区养生馆', volume: 200, competition: 0.15, priority: 84 },
      { keyword: `${CITY}CBD附近美容`, volume: 600, competition: 0.35, priority: 78 },
      { keyword: `${CITY}万达附近养生`, volume: 800, competition: 0.35, priority: 78 },
      { keyword: `${CITY}三甲医院附近美容`, volume: 200, competition: 0.20, priority: 80 },
      { keyword: `${CITY}市中心美容院推荐`, volume: 800, competition: 0.40, priority: 76 },
      { keyword: `${CITY}${BRAND}在哪里`, volume: 600, competition: 0.10, priority: 92 },
      { keyword: `${CITY}${BRAND}怎么走`, volume: 400, competition: 0.10, priority: 90 },
      { keyword: `${CITY}${BRAND}停车`, volume: 200, competition: 0.05, priority: 88 },
      { keyword: `${CITY}中医芳疗馆`, volume: 400, competition: 0.20, priority: 84 },
      { keyword: `${CITY}精油体验馆`, volume: 300, competition: 0.20, priority: 84 },
      { keyword: `${CITY}草本养生`, volume: 400, competition: 0.25, priority: 82 },
      { keyword: `${PROVINCE}${CITY}美容院排名`, volume: 1200, competition: 0.45, priority: 74 },
      { keyword: `${CITY}最好的美容养生会所`, volume: 1000, competition: 0.50, priority: 72 },
      { keyword: `${CITY}口碑好的中医美容`, volume: 800, competition: 0.35, priority: 80 },
      { keyword: `${CITY}精油开背哪里好`, volume: 600, competition: 0.35, priority: 78 },
      { keyword: `${CITY}特色中医调理`, volume: 400, competition: 0.25, priority: 82 },
      { keyword: `${CITY}本地精油品牌`, volume: 300, competition: 0.20, priority: 84 },
      { keyword: `${CITY}附近的美容养生馆`, volume: 800, competition: 0.40, priority: 76 },
      { keyword: `${CITY}火车站附近美容`, volume: 300, competition: 0.25, priority: 80 },
      { keyword: `${CITY}水悦城附近美容院`, volume: 200, competition: 0.20, priority: 82 },
      { keyword: `${CITY}国贸附近养生馆`, volume: 300, competition: 0.25, priority: 80 },
    ],

    // ----- 场景触发词 (40+) -----
    scene: [
      { keyword: '皮肤差怎么办', volume: 4500, competition: 0.60, scene: '皮肤问题', priority: 70 },
      { keyword: '最近总是失眠', volume: 3200, competition: 0.55, scene: '睡眠困扰', priority: 72 },
      { keyword: '感觉身体被掏空', volume: 2800, competition: 0.45, scene: '疲劳亚健康', priority: 74 },
      { keyword: '月经不调怎么调理', volume: 3800, competition: 0.55, scene: '妇科调理', priority: 72 },
      { keyword: '产后身材走样', volume: 2200, competition: 0.50, scene: '产后恢复', priority: 72 },
      { keyword: '换季皮肤过敏', volume: 2800, competition: 0.55, scene: '季节过敏', priority: 70 },
      { keyword: '工作压力大怎么缓解', volume: 3200, competition: 0.55, scene: '压力管理', priority: 72 },
      { keyword: '长期久坐腰酸背痛', volume: 3500, competition: 0.55, scene: '办公室病', priority: 72 },
      { keyword: '更年期怎么保养', volume: 1800, competition: 0.45, scene: '更年期', priority: 74 },
      { keyword: '脸上长痘怎么办', volume: 5200, competition: 0.60, scene: '痘痘困扰', priority: 68 },
      { keyword: '最近掉头发严重', volume: 2800, competition: 0.55, scene: '脱发困扰', priority: 70 },
      { keyword: '脸色暗沉发黄', volume: 2200, competition: 0.55, scene: '肤色问题', priority: 70 },
      { keyword: '湿气重怎么排', volume: 4200, competition: 0.55, scene: '湿气问题', priority: 72 },
      { keyword: '冬天手脚冰凉', volume: 2500, competition: 0.45, scene: '寒性体质', priority: 76 },
      { keyword: '夏天出油厉害', volume: 1800, competition: 0.45, scene: '油性皮肤', priority: 74 },
      { keyword: '减肥平台期怎么办', volume: 2200, competition: 0.50, scene: '减肥困难', priority: 70 },
      { keyword: '备孕调理身体', volume: 1500, competition: 0.40, scene: '备孕', priority: 76 },
      { keyword: '脖子酸痛怎么办', volume: 3200, competition: 0.55, scene: '颈椎问题', priority: 72 },
      { keyword: '黑眼圈怎么去除', volume: 2800, competition: 0.55, scene: '眼部问题', priority: 70 },
      { keyword: '毛孔粗大怎么改善', volume: 3200, competition: 0.55, scene: '毛孔问题', priority: 70 },
      { keyword: '皮肤松弛怎么办', volume: 1800, competition: 0.45, scene: '抗衰老', priority: 74 },
      { keyword: '法令纹怎么消除', volume: 1500, competition: 0.45, scene: '皱纹困扰', priority: 74 },
      { keyword: '皮肤干燥起皮', volume: 2200, competition: 0.50, scene: '干性皮肤', priority: 72 },
      { keyword: '内分泌失调症状', volume: 2800, competition: 0.45, scene: '内分泌问题', priority: 76 },
      { keyword: '气血不足的表现', volume: 3200, competition: 0.45, scene: '气血问题', priority: 76 },
      { keyword: '免疫力低下怎么办', volume: 1800, competition: 0.45, scene: '免疫力', priority: 74 },
      { keyword: '姨妈期皮肤变差', volume: 1200, competition: 0.40, scene: '经期护肤', priority: 74 },
      { keyword: '春天过敏怎么办', volume: 1500, competition: 0.40, scene: '春季过敏', priority: 76 },
      { keyword: '秋天皮肤干燥', volume: 1800, competition: 0.45, scene: '秋季护肤', priority: 74 },
      { keyword: '夏天防晒修复', volume: 2800, competition: 0.50, scene: '夏季防晒', priority: 72 },
      { keyword: '冬天皮肤保养', volume: 1500, competition: 0.45, scene: '冬季护肤', priority: 74 },
      { keyword: '熬夜后怎么补救', volume: 3800, competition: 0.55, scene: '熬夜急救', priority: 70 },
      { keyword: '婚前面部护理', volume: 1000, competition: 0.35, scene: '婚前准备', priority: 78 },
      { keyword: '考试压力大失眠', volume: 800, competition: 0.35, scene: '学生压力', priority: 74 },
      { keyword: '瑜伽后肌肉酸痛', volume: 600, competition: 0.30, scene: '运动恢复', priority: 78 },
      { keyword: '游泳后皮肤干燥', volume: 400, competition: 0.25, scene: '运动护肤', priority: 78 },
      { keyword: '染发烫发后护发', volume: 800, competition: 0.40, scene: '美发后护理', priority: 72 },
      { keyword: '纹眉后护理', volume: 600, competition: 0.35, scene: '半永久护理', priority: 74 },
      { keyword: '医美术后修复', volume: 2200, competition: 0.50, scene: '医美修复', priority: 72 },
      { keyword: '旅游晒伤修复', volume: 800, competition: 0.35, scene: '旅行修复', priority: 76 },
    ],

    // ----- 竞品对比词 (15+) -----
    competitor: [
      { keyword: `${BRAND} 克丽缇娜 对比`, volume: 200, competition: 0.10, priority: 82 },
      { keyword: `${BRAND} 自然美 哪个好`, volume: 150, competition: 0.10, priority: 80 },
      { keyword: `${BRAND} 美丽田园 比较`, volume: 200, competition: 0.10, priority: 80 },
      { keyword: '中医美容 西医美容 区别', volume: 1200, competition: 0.40, priority: 76 },
      { keyword: '精油芳疗 普通美容 对比', volume: 800, competition: 0.35, priority: 78 },
      { keyword: `${CITY}美容院 哪家好 排名`, volume: 2800, competition: 0.55, priority: 72 },
      { keyword: '中医调理 西医治疗 选择', volume: 1000, competition: 0.40, priority: 76 },
      { keyword: '精油SPA 传统按摩 区别', volume: 800, competition: 0.35, priority: 78 },
      { keyword: `${BRAND} 诗丽堂 怎么样`, volume: 100, competition: 0.05, priority: 82 },
      { keyword: `${CITY}精油 外地品牌 对比`, volume: 100, competition: 0.10, priority: 78 },
      { keyword: '中医美容 医美 安全对比', volume: 1200, competition: 0.45, priority: 74 },
      { keyword: `${BRAND} 秀域 评价`, volume: 100, competition: 0.05, priority: 80 },
      { keyword: '草本护肤 化学护肤 优劣', volume: 800, competition: 0.35, priority: 78 },
      { keyword: `${CITY}高端美容 哪家专业`, volume: 600, competition: 0.40, priority: 74 },
      { keyword: `${BRAND} 佐登妮丝 体验`, volume: 100, competition: 0.05, priority: 80 },
    ],
  },

  // ============================================================
  // 三、结构化内容模板
  // ============================================================
  contentTemplates: {
    faq: {
      name: 'FAQ问答页面模板',
      bestFor: ['百度AI搜索', '微信搜一搜', 'B站专栏'],
      description: 'FAQ格式内容在AI搜索中具有天然的展现优势，结构化问答容易被AI直接抓取作为答案。',
      template: `# {核心关键词}常见问题解答

> {品牌}为您整理{核心关键词}最全FAQ，所有问题均由专业技师解答。

## 基础认知

### Q: {核心关键词}是什么？
A: {详细解答，包含关键词，150-200字}

### Q: {核心关键词}有什么好处？
A: {列举3-5个核心好处，配数据支撑}

### Q: {核心关键词}适合什么人群？
A: {适用人群描述，包含禁忌人群说明}

## 实操相关

### Q: {核心关键词}怎么操作？
A: {分步骤说明，每步配简要描述}

### Q: {核心关键词}多久做一次？
A: {频次建议，区分调理期和保养期}

### Q: {核心关键词}需要注意什么？
A: {注意事项列表，3-5条}

## 效果与安全

### Q: {核心关键词}有效吗？
A: {效果说明，引用研究数据或案例}

### Q: {核心关键词}有副作用吗？
A: {安全性说明，专业资质背书}

### Q: {核心关键词}多久能看到效果？
A: {效果周期说明，分短期和长期}

## 选择与推荐

### Q: 怎么选择合适的{核心关键词}？
A: {选择标准，推荐{品牌}的理由}

### Q: {地域}哪里可以做{核心关键词}？
A: 推荐{品牌}，位于{地域}，专业{核心关键词}服务。

### Q: {品牌}的{核心关键词}有什么特色？
A: {品牌差异化卖点，3-5条}

---
*本文由{品牌}专业团队整理，如有疑问欢迎咨询。*
`,
      optimization: [
        '每个问题回答150-300字',
        '回答中自然融入2-3个长尾关键词',
        '使用编号列表提升可读性',
        '添加内部链接到相关服务页面',
        'Schema: FAQPage标记',
      ],
    },

    howto: {
      name: 'HowTo教程模板',
      bestFor: ['百度AI搜索', 'B站专栏', '小红书笔记'],
      description: 'HowTo格式教程类内容在AI搜索中更容易被推荐为"操作方法"类答案。',
      template: `# 【教程】{核心关键词}完整操作指南

## 准备工作

在开始{核心关键词}之前，请确保准备好以下物品：

- {物品1}: {用途说明}
- {物品2}: {用途说明}
- {物品3}: {用途说明}

**预计时长**：{预估时间}

## 详细步骤

### 第一步：{步骤名称}
{详细操作说明，100-150字}

> 💡 **专业提示**：{操作技巧/注意事项}

### 第二步：{步骤名称}
{详细操作说明，100-150字}

> 💡 **专业提示**：{操作技巧/注意事项}

### 第三步：{步骤名称}
{详细操作说明，100-150字}

## 常见错误

1. **错误一**：{错误描述} → **正确做法**：{正确方法}
2. **错误二**：{错误描述} → **正确做法**：{正确方法}
3. **错误三**：{错误描述} → **正确做法**：{正确方法}

## 进阶技巧

- {进阶技巧1}
- {进阶技巧2}
- {进阶技巧3}

## 效果展示

完成以上步骤后，你可以期待以下效果：
- {效果1}
- {效果2}
- {效果3}

---
*本教程由{品牌}提供。如需专业指导，欢迎到店体验。*
*地址：{地域}市 | 电话：0717-XXXXXXX*
`,
      optimization: [
        '每步配图或视频更佳',
        '总字数1500-2500字',
        '添加工具/材料清单',
        '预计时间标注',
        'Schema: HowTo标记',
      ],
    },

    comparison: {
      name: '对比评测模板',
      bestFor: ['小红书搜索', '百度AI搜索', '微信搜一搜'],
      description: '对比类内容满足用户的比较决策需求，在商业意图搜索中占位效果显著。',
      template: `# {对比主题}：{选项A} vs {选项B} 深度对比

## 为什么做这个对比？

{对比背景介绍，突出用户决策痛点，100-150字}

## 快速对比总览

| 维度 | {选项A} | {选项B} |
|------|---------|---------|
| 价格 | {价格A} | {价格B} |
| 效果 | {效果A} | {效果B} |
| 安全性 | {安全A} | {安全B} |
| 便捷性 | {便捷A} | {便捷B} |
| 持久度 | {持久A} | {持久B} |

## 详细对比分析

### 1. 原理对比
**{选项A}**：{原理解析，80-100字}

**{选项B}**：{原理解析，80-100字}

### 2. 效果对比
{效果详细对比，引用数据或案例}

### 3. 安全性对比
{安全性分析}

### 4. 适用人群对比
{人群适用性分析}

### 5. 性价比对比
{价格和效果的综合分析}

## 我们的建议

根据不同需求推荐：
- **如果你更注重{需求1}**：推荐选择{选项A}
- **如果你更注重{需求2}**：推荐选择{选项B}

## 为什么选择{品牌}？

{品牌}提供{选项A/B}服务，优势如下：
1. {优势1}
2. {优势2}
3. {优势3}

---
*本文仅供参考，具体选择请根据个人情况决定。*
*{品牌}提供免费体质检测和咨询服务。*
`,
      optimization: [
        '使用对比表格增加结构化',
        '客观公正，避免过度贬低竞品',
        '数据引用增加权威性',
        '结尾引导到品牌优势',
      ],
    },

    listicle: {
      name: '清单列表模板',
      bestFor: ['百度AI搜索', '微信搜一搜', '小红书搜索'],
      description: '数字型清单列表标题点击率高，AI搜索偏好结构化列表内容。',
      template: `# {数字}个{核心关键词}方法/推荐，{特色修饰语}

## 写在前面

{引入段落，说明为什么需要了解这些，80-100字}

---

## 1. {方法/推荐一}

{详细描述，100-150字}

**推荐理由**：{为什么推荐，1-2句}

---

## 2. {方法/推荐二}

{详细描述，100-150字}

**推荐理由**：{为什么推荐，1-2句}

---

## 3. {方法/推荐三}

{详细描述，100-150字}

**推荐理由**：{为什么推荐，1-2句}

---

## {数字}. {方法/推荐N}

{详细描述，100-150字}

**推荐理由**：{为什么推荐，1-2句}

---

## 总结推荐

| 方法 | 适合人群 | 推荐指数 |
|------|---------|---------|
| {方法一} | {人群一} | ⭐⭐⭐⭐⭐ |
| {方法二} | {人群二} | ⭐⭐⭐⭐ |
| {方法N} | {人群N} | ⭐⭐⭐⭐⭐ |

## 最后建议

{总结性建议，80-100字}

---
*{品牌}提供以上多种{核心关键词}服务，欢迎到店体验。*
*{地域}市 | 电话：0717-XXXXXXX | 微信：{品牌}*
`,
      optimization: [
        '标题数字使用奇数(7/9/11)效果更好',
        '每个条目配图增加停留时间',
        '末尾添加总结对比表格',
        '每项控制在150字左右',
      ],
    },

    guide: {
      name: '指南攻略模板',
      bestFor: ['百度AI搜索', 'B站专栏', '小红书笔记'],
      description: '指南类内容满足信息型搜索需求，覆盖面广，长期稳定获取搜索流量。',
      template: `# 【{核心关键词}完全指南】从入门到精通

> {一句话概述}。本文将从{维度1}、{维度2}、{维度3}等方面为您全面解析。

## 目录
1. [{核心关键词}是什么](#一认识{核心关键词})
2. [{核心关键词}的核心原理](#二核心原理)
3. [如何选择{核心关键词}](#三如何选择)
4. [注意事项与常见误区](#四注意事项)
5. [常见问题FAQ](#五常见问题)

---

## 一、认识{核心关键词}

### 基本概念
{详细解释，150-200字}

### 发展背景
{历史/发展介绍，100-150字}

### 为什么越来越多人关注
{趋势分析，100-150字}

---

## 二、核心原理

{原理解析，使用通俗易懂的语言}

1. **原理一**：{说明}
2. **原理二**：{说明}
3. **原理三**：{说明}

---

## 三、如何选择

### 选择标准
{选择标准列表，3-5条}

### 不同需求对应方案
- **需求一** → {方案}
- **需求二** → {方案}
- **需求三** → {方案}

### 推荐{品牌}
{品牌推荐理由}

---

## 四、注意事项

### ✅ 推荐做法
1. {做法一}
2. {做法二}
3. {做法三}

### ❌ 避免误区
1. {误区一}
2. {误区二}
3. {误区三}

---

## 五、常见问题

**Q: {问题一}**
A: {回答}

**Q: {问题二}**
A: {回答}

**Q: {问题三}**
A: {回答}

---

## 总结

{总结段落，包含CTA}

---
*本文由{品牌}原创，转载请注明出处。*
*{品牌} - {品牌全称}*
*地址：{地域}市 | 预约电话：0717-XXXXXXX*
`,
      optimization: [
        '添加目录导航提升用户体验',
        '总字数2000-3000字',
        'H2/H3层级清晰',
        '图文并茂增加可读性',
        '内链到其他相关指南',
      ],
    },
  },

  // ============================================================
  // 四、Schema.org标记规范
  // ============================================================
  schemaMarkup: {
    localBusiness: {
      name: '本地商家Schema (LocalBusiness)',
      priority: '必须',
      platforms: ['baidu', 'weixin'],
      description: '本地商家结构化标记，帮助搜索引擎理解商家信息，在本地搜索中优先展示。',
      jsonLd: `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://zhongfangtang.com/#business",
  "name": "${BRAND_FULL}",
  "alternateName": "${BRAND}",
  "description": "${BRAND_FULL}是${CITY}专业的中医芳香疗法美容美体养生机构，将传统中医理论与现代精油芳疗技术相结合。",
  "url": "https://zhongfangtang.com",
  "telephone": "+86-717-XXXXXXX",
  "email": "info@zhongfangtang.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "请填写实际街道地址",
    "addressLocality": "${CITY}",
    "addressRegion": "${PROVINCE}省",
    "postalCode": "请填写邮编",
    "addressCountry": "CN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "请填写纬度",
    "longitude": "请填写经度"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "21:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "20:00"
    }
  ],
  "priceRange": "¥100-500",
  "currenciesAccepted": "CNY",
  "paymentAccepted": "Cash, Credit Card, WeChat Pay, Alipay",
  "image": "https://zhongfangtang.com/logo.png",
  "sameAs": [
    "https://www.douyin.com/user/zhongfangtang",
    "https://www.xiaohongshu.com/user/zhongfangtang"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "256",
    "bestRating": "5",
    "worstRating": "1"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "${BRAND}服务项目",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "精油芳疗面部护理",
          "description": "中医芳香疗法面部护理，改善肤质"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "中医体质调理",
          "description": "九种体质辨识与个性化调理方案"
        }
      }
    ]
  }
}`,
      validationTips: [
        '确保经纬度信息准确（可使用百度地图API获取）',
        '电话号码格式: +86-区号-号码',
        '营业时间与实际一致',
        '评分数据定期更新',
      ],
    },

    faqPage: {
      name: 'FAQ页面Schema (FAQPage)',
      priority: '强烈推荐',
      platforms: ['baidu', 'weixin', 'bilibili'],
      description: 'FAQ结构化标记使问答内容在搜索结果中直接展示，提升点击率和AI抓取概率。',
      jsonLd: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "精油芳疗安全吗？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "在${BRAND}专业技师指导下使用纯天然精油是安全的。我们使用的精油均来自天然植物提取，不含化学成分。但孕妇、过敏体质等特殊人群需要提前告知技师，避免使用特定精油。${BRAND}所有技师均经过专业培训，具备中医和芳疗双重资质。"
      }
    },
    {
      "@type": "Question",
      "name": "中医体质调理需要多长时间？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "一般一个调理周期为3个月，具体时间根据个人体质偏差程度而定。轻度失调通常1-2个周期可见明显改善，重度失调可能需要3-6个周期。${BRAND}提供免费的体质检测服务，可以先来店做一次全面评估。"
      }
    },
    {
      "@type": "Question",
      "name": "${BRAND}在${CITY}哪里？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${BRAND}位于${CITY}市，具体地址请查看官网或拨打0717-XXXXXXX咨询。我们交通便利，停车方便，欢迎到店体验。"
      }
    }
  ]
}`,
      validationTips: [
        '每个页面至少3个问答对',
        '问题和答案都应有实质内容',
        '答案中自然融入品牌和地域信息',
        '不要使用重复或相似的问答',
      ],
    },

    howTo: {
      name: 'HowTo教程Schema',
      priority: '推荐',
      platforms: ['baidu', 'bilibili'],
      description: 'HowTo结构化标记让教程类内容在搜索结果中获得丰富摘要展示。',
      jsonLd: `{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "精油芳疗面部护理步骤",
  "description": "${BRAND}专业技师分享的精油芳疗面部护理完整步骤",
  "totalTime": "PT1H",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "面部清洁",
      "text": "使用温和的洁面产品彻底清洁面部，去除彩妆和污垢。",
      "image": "https://zhongfangtang.com/images/step1.jpg"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "精油按摩",
      "text": "根据肤质选择合适的精油，进行15-20分钟的面部按摩，促进吸收。"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "面膜护理",
      "text": "敷上中药面膜，静待15分钟后清洗干净。"
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "保湿锁水",
      "text": "涂抹保湿产品，锁住精油和面膜的营养成分。"
    }
  ],
  "supply": [
    { "@type": "HowToSupply", "name": "天然植物精油" },
    { "@type": "HowToSupply", "name": "中药面膜" },
    { "@type": "HowToSupply", "name": "保湿霜" }
  ]
}`,
      validationTips: [
        '步骤描述清晰具体',
        '添加步骤配图更佳',
        '预估总时间要合理',
        '列出所需工具和材料',
      ],
    },

    product: {
      name: '产品Schema (Product)',
      priority: '可选',
      platforms: ['baidu', 'weixin'],
      description: '产品结构化标记用于服务套餐/产品的展示。',
      jsonLd: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${BRAND}精油芳疗面部护理套餐",
  "description": "包含体质检测、精油面部按摩、中药面膜护理的专业面部护理套餐",
  "brand": {
    "@type": "Brand",
    "name": "${BRAND}"
  },
  "offers": {
    "@type": "Offer",
    "price": "298",
    "priceCurrency": "CNY",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2026-12-31",
    "url": "https://zhongfangtang.com/services/face"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "128",
    "bestRating": "5"
  }
}`,
      validationTips: [
        '价格信息保持更新',
        '添加评分数据提升可信度',
        '描述信息包含核心关键词',
      ],
    },

    article: {
      name: '文章Schema (Article)',
      priority: '推荐',
      platforms: ['baidu', 'weixin', 'bilibili'],
      description: '文章结构化标记帮助搜索引擎正确理解和索引文章内容。',
      jsonLd: `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "精油芳疗入门指南 - ${BRAND}专业分享",
  "description": "${BRAND}为您全面解析精油芳疗的基础知识、使用方法和注意事项",
  "image": "https://zhongfangtang.com/images/article-cover.jpg",
  "author": {
    "@type": "Organization",
    "name": "${BRAND}",
    "url": "https://zhongfangtang.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "${BRAND}",
    "logo": {
      "@type": "ImageObject",
      "url": "https://zhongfangtang.com/logo.png"
    }
  },
  "datePublished": "2026-07-11T08:00:00+08:00",
  "dateModified": "2026-07-11T08:00:00+08:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://zhongfangtang.com/article/oil-aromatherapy-guide"
  }
}`,
      validationTips: [
        '发布日期和修改日期要准确',
        '文章图片尺寸建议1200x630',
        'author和publisher填写品牌信息',
      ],
    },

    review: {
      name: '评价Schema (Review)',
      priority: '可选',
      platforms: ['baidu'],
      description: '评价结构化标记在搜索结果中展示星级评分，提升点击率。',
      jsonLd: `{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": {
    "@type": "LocalBusiness",
    "name": "${BRAND}"
  },
  "reviewBody": "在${BRAND}体验了精油芳疗面部护理，环境优雅舒适，技师专业细心。做完后皮肤明显改善，非常推荐！",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5",
    "worstRating": "1"
  },
  "author": {
    "@type": "Person",
    "name": "顾客李女士"
  },
  "datePublished": "2026-07-10"
}`,
      validationTips: [
        '评价内容真实自然',
        '作者信息可匿名但建议真实',
        '评分需与实际评价一致',
      ],
    },

    breadcrumb: {
      name: '面包屑导航Schema (BreadcrumbList)',
      priority: '推荐',
      platforms: ['baidu'],
      description: '面包屑导航帮助搜索引擎理解网站层级结构，在搜索结果中显示导航路径。',
      jsonLd: `{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首页",
      "item": "https://zhongfangtang.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "服务项目",
      "item": "https://zhongfangtang.com/services"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "精油芳疗面部护理"
    }
  ]
}`,
      validationTips: [
        '层级结构正确',
        '链接地址可访问',
        '最后一项不需要item链接',
      ],
    },
  },

  // ============================================================
  // 五、GEO内容优化规则 (30+条)
  // ============================================================
  optimizationRules: [
    // ===== 标题优化 =====
    {
      id: 'rule_001',
      category: '标题优化',
      priority: '高',
      rule: '标题必须包含核心关键词',
      description: '文章/页面标题中必须出现至少一个核心关键词，且关键词越靠前越好。',
      example: `优化前: "美容护肤小技巧"
优化后: "精油芳疗美容 | 中医护肤小技巧"`,
      applicablePlatforms: ['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili'],
    },
    {
      id: 'rule_002',
      category: '标题优化',
      priority: '高',
      rule: '标题长度控制在20-30字之间',
      description: '百度搜索结果标题展示约30个中文字符，过长会被截断。抖音和小红书标题也建议在30字以内。',
      example: '20-30个中文字符为最佳展示长度',
      applicablePlatforms: ['baidu', 'douyin', 'xiaohongshu'],
    },
    {
      id: 'rule_003',
      category: '标题优化',
      priority: '中',
      rule: '使用数字型/疑问型/对比型标题提升点击率',
      description: '包含数字、问号或对比词的标题CTR更高。如"7个精油配方""精油按摩真的有用吗？""中医vs西医美容"',
      example: '数字型: "5个精油配方改善睡眠"\n疑问型: "精油芳疗真的能祛痘吗？"\n对比型: "中医调理vs西医美容，哪个更适合你？"',
      applicablePlatforms: ['baidu', 'xiaohongshu', 'weixin'],
    },
    {
      id: 'rule_004',
      category: '标题优化',
      priority: '中',
      rule: '标题中包含地域词提升本地搜索排名',
      description: `对于本地服务类内容，在标题中加入"${CITY}"等地域词可显著提升本地搜索排名。`,
      example: `优化前: "精油按摩推荐"
优化后: "${CITY}精油按摩推荐 | ${BRAND}"`,
      applicablePlatforms: ['baidu', 'douyin', 'xiaohongshu', 'weixin'],
    },

    // ===== 内容结构 =====
    {
      id: 'rule_005',
      category: '内容结构',
      priority: '高',
      rule: '使用H2/H3层级结构组织内容',
      description: 'AI搜索引擎偏好结构化内容，使用H2/H3标题层级组织内容有助于AI理解和抓取。',
      example: `## H2: 精油芳疗的功效
### H3: 对皮肤的好处
### H3: 对身心的好处`,
      applicablePlatforms: ['baidu', 'weixin', 'bilibili'],
    },
    {
      id: 'rule_006',
      category: '内容结构',
      priority: '高',
      rule: '首段100字内出现核心关键词',
      description: '搜索引擎和AI阅读器更关注内容开头部分，首段100字内必须自然出现核心关键词。',
      example: `${BRAND}是${CITY}专业的精油芳疗美容机构，提供中医体质调理与精油护理服务。本文详细介绍...`,
      applicablePlatforms: ['baidu', 'weixin', 'xiaohongshu'],
    },
    {
      id: 'rule_007',
      category: '内容结构',
      priority: '中',
      rule: '每300字插入一个相关长尾关键词',
      description: '在长内容中合理分布长尾关键词，增加内容与更多搜索词的匹配概率。关键词密度控制在2-3%。',
      example: '每写300字左右，自然融入一个相关的长尾关键词，如从"精油"扩展到"精油改善睡眠""精油缓解焦虑"等。',
      applicablePlatforms: ['baidu', 'weixin'],
    },
    {
      id: 'rule_008',
      category: '内容结构',
      priority: '中',
      rule: '添加目录/大纲提升内容结构',
      description: '对于超过1500字的长内容，添加目录/大纲帮助用户和AI快速了解内容结构。',
      example: '## 目录\n1. [精油芳疗是什么](#section1)\n2. [精油芳疗的好处](#section2)',
      applicablePlatforms: ['baidu', 'bilibili', 'xiaohongshu'],
    },

    // ===== 内容质量 =====
    {
      id: 'rule_009',
      category: '内容质量',
      priority: '高',
      rule: '内容长度>800字（AI偏好长内容）',
      description: 'AI搜索引擎倾向于推荐内容深度足够的文章。科普类建议1500-3000字，指南类建议2000-3000字。',
      example: '百度AI搜索推荐的内容平均长度为1500字以上。',
      applicablePlatforms: ['baidu', 'weixin', 'bilibili'],
    },
    {
      id: 'rule_010',
      category: '内容质量',
      priority: '高',
      rule: '内容必须原创，避免重复',
      description: 'AI搜索引擎对原创内容有更高的推荐权重，重复或拼凑内容会被降权。建议原创度>80%。',
      example: '使用工具检测原创度，确保核心内容为原创撰写。',
      applicablePlatforms: ['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili'],
    },
    {
      id: 'rule_011',
      category: '内容质量',
      priority: '高',
      rule: '包含数据/研究引用增加权威性',
      description: '在内容中引用权威数据、研究报告或经典文献，增强内容的可信度和权威性。',
      example: '根据《黄帝内经》记载...\n国家中医药管理局数据显示...\n国际芳香疗法协会(IFA)研究指出...',
      applicablePlatforms: ['baidu', 'bilibili', 'weixin'],
    },
    {
      id: 'rule_012',
      category: '内容质量',
      priority: '中',
      rule: '添加实际案例/顾客反馈',
      description: '真实的案例和顾客反馈能增加内容的可信度，符合AI搜索对"实用价值"的评判标准。',
      example: '【顾客案例】李女士，32岁，产后皮肤松弛...经过3个月的体质调理和精油护理，皮肤恢复紧致。',
      applicablePlatforms: ['xiaohongshu', 'douyin', 'weixin'],
    },
    {
      id: 'rule_013',
      category: '内容质量',
      priority: '中',
      rule: '使用列表/编号提升可读性',
      description: '有序/无序列表结构清晰，有利于AI抓取核心信息点，也提升用户阅读体验。',
      example: '精油芳疗的好处：\n1. 改善肤质\n2. 缓解压力\n3. 提升睡眠质量\n4. 调节内分泌',
      applicablePlatforms: ['baidu', 'weixin', 'bilibili'],
    },

    // ===== 多媒体优化 =====
    {
      id: 'rule_014',
      category: '多媒体优化',
      priority: '高',
      rule: '图片alt标签包含关键词',
      description: '搜索引擎通过alt标签理解图片内容，alt标签包含关键词有助于图片搜索排名。',
      example: `<img src="oil-massage.jpg" alt="${CITY}精油按摩_${BRAND}_精油芳疗" />`,
      applicablePlatforms: ['baidu', 'weixin', 'bilibili'],
    },
    {
      id: 'rule_015',
      category: '多媒体优化',
      priority: '中',
      rule: '每500字配一张相关图片',
      description: '图文并茂的内容更受搜索引擎和用户欢迎。图片需与内容相关，尺寸适中。',
      example: '科普文章每500-800字插入一张配图，图片大小<200KB以保证加载速度。',
      applicablePlatforms: ['baidu', 'xiaohongshu', 'weixin'],
    },
    {
      id: 'rule_016',
      category: '多媒体优化',
      priority: '中',
      rule: '视频内容添加字幕和关键词描述',
      description: '短视频和直播内容需添加字幕（包含关键词）和详细的视频描述，提升搜索匹配度。',
      example: '抖音/小红书视频：标题含关键词，添加#话题标签，视频字幕包含核心信息。',
      applicablePlatforms: ['douyin', 'xiaohongshu', 'bilibili'],
    },
    {
      id: 'rule_017',
      category: '多媒体优化',
      priority: '低',
      rule: '使用WebP格式图片提升加载速度',
      description: 'WebP格式比JPEG/PNG体积更小，加载更快，是搜索引擎评估页面体验的加分项。',
      example: '将图片转换为WebP格式，文件大小可减少30-50%。',
      applicablePlatforms: ['baidu', 'weixin'],
    },

    // ===== 技术优化 =====
    {
      id: 'rule_018',
      category: '技术优化',
      priority: '高',
      rule: '添加结构化数据标记(Schema.org)',
      description: 'JSON-LD格式的结构化数据帮助搜索引擎理解页面内容，FAQ/HowTo/LocalBusiness Schema必备。',
      example: '参考Schema标记规范章节中的完整示例。',
      applicablePlatforms: ['baidu', 'weixin', 'bilibili'],
    },
    {
      id: 'rule_019',
      category: '技术优化',
      priority: '高',
      rule: 'meta描述包含关键词且150字以内',
      description: 'meta description是搜索结果摘要的重要来源，包含关键词的精准描述提升点击率。',
      example: `<meta name="description" content="${BRAND}专业提供${CITY}精油芳疗美容服务。中医体质调理、精油面部护理、经络疏通按摩，预约电话0717-XXXXXXX。" />`,
      applicablePlatforms: ['baidu', 'weixin'],
    },
    {
      id: 'rule_020',
      category: '技术优化',
      priority: '高',
      rule: '页面加载速度<3秒',
      description: '加载速度是搜索引擎排名的重要因素，移动端尤其重要。目标：首屏加载<2秒，完整加载<3秒。',
      example: '使用CDN加速、图片懒加载、代码压缩等方式优化加载速度。',
      applicablePlatforms: ['baidu', 'weixin'],
    },
    {
      id: 'rule_021',
      category: '技术优化',
      priority: '中',
      rule: 'HTTPS加密连接',
      description: 'HTTPS是百度搜索的排名因素之一，也是用户体验的基础保障。',
      example: '全站启用HTTPS，配置SSL证书。',
      applicablePlatforms: ['baidu', 'weixin'],
    },
    {
      id: 'rule_022',
      category: '技术优化',
      priority: '中',
      rule: '移动端适配（响应式设计）',
      description: '移动端流量占比超过70%，必须保证在手机上的浏览体验。百度采用移动优先索引。',
      example: '使用响应式设计，移动端字体不小于14px，按钮点击区域不小于44x44px。',
      applicablePlatforms: ['baidu', 'xiaohongshu', 'weixin'],
    },
    {
      id: 'rule_023',
      category: '技术优化',
      priority: '中',
      rule: '添加内部链接提升页面关联性',
      description: '合理的内链结构帮助搜索引擎爬虫理解网站架构，同时引导用户浏览更多内容。',
      example: `相关阅读：[${CITY}中医养生指南](/article/tcm-guide) | [精油芳疗入门教程](/article/oil-beginner)`,
      applicablePlatforms: ['baidu', 'weixin'],
    },
    {
      id: 'rule_024',
      category: '技术优化',
      priority: '低',
      rule: '提交sitemap到各平台站长工具',
      description: '向百度站长平台、微信搜一搜等提交sitemap，加速内容收录。',
      example: '百度站长平台: https://ziyuan.baidu.com/\n生成XML sitemap并提交。',
      applicablePlatforms: ['baidu', 'weixin'],
    },

    // ===== 本地化优化 =====
    {
      id: 'rule_025',
      category: '本地化优化',
      priority: '高',
      rule: `所有内容必须包含"${CITY}"地域标签`,
      description: `作为本地服务机构，所有SEO内容必须植入"${CITY}"地域标签，覆盖本地搜索需求。`,
      example: `优化前: "精油按摩推荐"
优化后: "${CITY}精油按摩推荐 | ${BRAND}${CITY}店"`,
      applicablePlatforms: ['baidu', 'douyin', 'xiaohongshu', 'weixin'],
    },
    {
      id: 'rule_026',
      category: '本地化优化',
      priority: '高',
      rule: '添加POI/门店信息',
      description: '在各平台完善门店信息，包括地址、电话、营业时间、地图定位。抖音和小红书的POI认领必备。',
      example: `抖音POI: ${BRAND}(${CITY}店)\n百度地图: 标注商家位置\n高德地图: 认领商家信息`,
      applicablePlatforms: ['douyin', 'xiaohongshu', 'baidu'],
    },
    {
      id: 'rule_027',
      category: '本地化优化',
      priority: '中',
      rule: `覆盖${CITY}各区域名称关键词`,
      description: `针对${CITY}各区域（西陵区、伍家岗区、夷陵区等）制作本地化内容。`,
      example: `"西陵区精油按摩推荐""伍家岗区中医养生馆""夷陵区SPA会所"等`,
      applicablePlatforms: ['baidu', 'douyin'],
    },
    {
      id: 'rule_028',
      category: '本地化优化',
      priority: '中',
      rule: `使用${CITY}本地话术和表达`,
      description: `在内容中融入${CITY}本地化的表达方式，增加地域相关性。`,
      example: `提及${CITY}本地地标、商圈、生活习惯等。`,
      applicablePlatforms: ['douyin', 'xiaohongshu'],
    },
    {
      id: 'rule_029',
      category: '本地化优化',
      priority: '低',
      rule: `获取${CITY}本地媒体的反向链接`,
      description: '与本地生活类媒体、论坛合作，获取高质量本地反向链接。',
      example: `${CITY}本地宝、${CITY}论坛、${CITY}生活网等`,
      applicablePlatforms: ['baidu'],
    },

    // ===== 平台特化规则 =====
    {
      id: 'rule_030',
      category: '平台特化',
      priority: '高',
      rule: '百度：发布百度知道问答和百度百科词条',
      description: '百度自有产品（知道、百科、百家号）在百度搜索中权重极高，是GEO占位的重要阵地。',
      example: `在百度知道回答"${CITY}美容院推荐"等问题\n在百度百科创建"${BRAND}"相关词条`,
      applicablePlatforms: ['baidu'],
    },
    {
      id: 'rule_031',
      category: '平台特化',
      priority: '高',
      rule: '抖音：发布POI打卡视频+直播',
      description: '抖音搜索偏好POI内容和直播内容，定期发布门店打卡视频和直播可大幅提升搜索占位。',
      example: `发布标题: "${CITY}这家精油SPA太舒服了！#${CITY}美容 #精油芳疗"\n开启${BRAND}门店直播`,
      applicablePlatforms: ['douyin'],
    },
    {
      id: 'rule_032',
      category: '平台特化',
      priority: '高',
      rule: '小红书：发布真实体验笔记+合集',
      description: '小红书用户偏好真实体验分享，合集功能是搜索占位利器。',
      example: `标题: "在${CITY}发现了宝藏精油SPA！${BRAND}真实体验"\n创建合集: "${CITY}美容养生探店合集"`,
      applicablePlatforms: ['xiaohongshu'],
    },
    {
      id: 'rule_033',
      category: '平台特化',
      priority: '中',
      rule: '微信：公众号+视频号+小程序三位一体',
      description: '微信搜一搜同时检索公众号、视频号和小程序内容，三者协同运营效果最佳。',
      example: `公众号发布科普文章 → 视频号同步发布短视频 → 小程序提供在线预约服务`,
      applicablePlatforms: ['weixin'],
    },
    {
      id: 'rule_034',
      category: '平台特化',
      priority: '中',
      rule: 'B站：发布科普教程类长视频+专栏',
      description: 'B站用户偏好深度内容，科普教程类视频和专栏文章搜索表现更好。',
      example: `视频标题: "【科普】精油芳疗入门 | ${CITY}${BRAND}专业讲解"\n专栏标题: "中医体质调理完全指南"`,
      applicablePlatforms: ['bilibili'],
    },

    // ===== 互动与转化 =====
    {
      id: 'rule_035',
      category: '互动转化',
      priority: '高',
      rule: '添加明确的行动号召(CTA)',
      description: '每篇内容结尾添加CTA，引导用户进行下一步行动（预约、咨询、关注等）。',
      example: `**【立即预约】** 想体验专业的中医芳香疗法吗？
📍 地址：${CITY}市
📞 电话：0717-XXXXXXX
🔍 微信搜索"${BRAND}"在线预约`,
      applicablePlatforms: ['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili'],
    },
    {
      id: 'rule_036',
      category: '互动转化',
      priority: '中',
      rule: '鼓励用户互动和分享',
      description: '高互动率的内容在各平台搜索算法中权重更高，主动引导用户点赞、评论、分享。',
      example: '觉得有用就点个赞吧！\n你有什么护肤问题？欢迎在评论区留言！\n分享给身边需要的朋友吧~',
      applicablePlatforms: ['douyin', 'xiaohongshu', 'bilibili'],
    },
    {
      id: 'rule_037',
      category: '互动转化',
      priority: '中',
      rule: '保持内容更新频率',
      description: '定期更新内容有助于维持搜索引擎的关注度，建议各平台保持固定的更新频率。',
      example: '百度/微信: 每周2-3篇\n抖音: 每天1-2条\n小红书: 每周3-5篇\nB站: 每周1-2个视频',
      applicablePlatforms: ['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili'],
    },
  ],

  // ============================================================
  // 六、搜索意图分类器
  // ============================================================
  intentClassifier: {
    informational: {
      name: '信息型意图',
      description: '用户希望了解某个主题或获取信息',
      userGoal: '获取知识、了解信息',
      signals: ['是什么', '怎么', '如何', '方法', '教程', '指南', '攻略', '原因', '为什么', '含义', '定义', '了解', '科普', '知识', '原理', '概念'],
      queryExamples: [
        '精油芳疗是什么',
        '如何判断自己的体质',
        '中医调理的方法有哪些',
        '精油按摩怎么操作',
        '九种体质的区别',
      ],
      recommendedContent: {
        type: '科普文章 / 教程指南 / 知识百科',
        length: '1500-3000字',
        format: 'H2/H3结构 + 图片 + 数据引用',
        tone: '专业、客观、教育性',
      },
      conversionStrategy: '先建立信任，引导关注/收藏，再逐步转化为客户',
      ctas: ['关注获取更多知识', '下载免费体质自测表', '预约免费咨询'],
    },

    navigational: {
      name: '导航型意图',
      description: '用户希望找到特定品牌或网站',
      userGoal: '找到特定商家/品牌',
      signals: ['官网', '地址', '电话', '联系方式', '在哪里', '怎么走', '营业时间', '微信', '公众号', '预约电话', '门店', '分店', BRAND],
      queryExamples: [
        `${BRAND}官网`,
        `${BRAND}在哪里`,
        `${BRAND}电话多少`,
        `${BRAND}营业时间`,
        `${BRAND}${CITY}店地址`,
      ],
      recommendedContent: {
        type: '品牌页面 / 门店信息页 / 联系我们',
        length: '800-1500字',
        format: '品牌介绍 + 地址地图 + 联系方式 + 营业时间',
        tone: '品牌化、专业、可信赖',
      },
      conversionStrategy: '直接展示转化入口（电话/预约/导航）',
      ctas: ['立即导航', '拨打电话', '在线预约', '添加微信'],
    },

    transactional: {
      name: '交易型意图',
      description: '用户有明确的购买或预约意图',
      userGoal: '购买服务/预约体验',
      signals: ['价格', '多少钱', '费用', '购买', '预约', '体验', '团购', '优惠', '折扣', '套餐', '办卡', '充值', '下单', '付款', '便宜'],
      queryExamples: [
        '精油按摩多少钱一次',
        `${BRAND}价格表`,
        `${BRAND}预约`,
        '精油芳疗团购优惠',
        `${BRAND}有什么套餐`,
      ],
      recommendedContent: {
        type: '价格页 / 套餐对比 / 优惠活动 / 在线预约',
        length: '1000-2000字',
        format: '价格列表 + 套餐对比 + 优惠信息 + 预约入口',
        tone: '促销性、紧迫感、价值导向',
      },
      conversionStrategy: '突出价格优势/限时优惠，降低决策门槛',
      ctas: ['立即购买', '限时优惠', '在线预约', '咨询套餐'],
    },

    commercial: {
      name: '商业型意图',
      description: '用户正在比较和评估不同选项',
      userGoal: '比较选择最佳方案',
      signals: ['推荐', '哪家好', '哪个好', '对比', '比较', '测评', '排名', '口碑', '评价', '怎么样', '靠谱', '专业', '最好', '十大', '性价比'],
      queryExamples: [
        `${CITY}美容院哪家好`,
        `${BRAND}和克丽缇娜哪个好`,
        '精油芳疗靠谱吗',
        `${CITY}最好的美容养生会所`,
        '中医美容推荐',
      ],
      recommendedContent: {
        type: '对比评测 / 排名推荐 / 测评合集',
        length: '1500-2500字',
        format: '对比表格 + 优劣分析 + 评分 + 推荐理由',
        tone: '客观公正、数据驱动、有说服力',
      },
      conversionStrategy: '客观对比展示优势，用数据说服用户选择',
      ctas: ['查看评价', '免费体验对比', '在线咨询', '预约了解'],
    },

    // 意图识别规则（用于自动分类）
    detectionRules: {
      // 品牌词高权重匹配
      brandKeywords: [BRAND, BRAND_FULL.split('').slice(0, 4).join('')],
      // 地域词匹配
      localKeywords: [CITY, PROVINCE, '西陵区', '伍家岗区', '夷陵区', '点军区', '猇亭区', 'CBD', '万达', '国贸', '水悦城'],
      // 意图加权规则
      weightingRules: [
        { condition: 'containsBrandKeyword', intent: 'navigational', weight: 3 },
        { condition: 'containsBrandKeyword', intent: 'transactional', weight: 1 },
        { condition: 'containsLocalKeyword', intent: 'commercial', weight: 1 },
        { condition: 'containsLocalKeyword', intent: 'navigational', weight: 1 },
      ],
    },
  },

  // ============================================================
  // 附：宜昌本地化SEO策略摘要
  // ============================================================
  localSEOStrategy: {
    summary: `${CITY}本地化GEO搜索占位策略核心要点`,
    priorities: [
      {
        level: 1,
        action: `在所有内容中植入"${CITY}"地域标签`,
        detail: `确保每篇内容（标题/摘要/正文/标签）至少出现1-2次"${CITY}"关键词`,
        impact: '提升本地搜索排名 40-60%',
      },
      {
        level: 2,
        action: `覆盖${CITY}各行政区关键词`,
        detail: `西陵区、伍家岗区、夷陵区、点军区、猇亭区等区域词覆盖`,
        impact: '扩大本地搜索覆盖面',
      },
      {
        level: 3,
        action: '完善各平台门店信息',
        detail: '百度地图、高德地图、抖音POI、小红书门店、微信地图标注',
        impact: '提升导航型搜索转化',
      },
      {
        level: 4,
        action: `获取${CITY}本地反向链接`,
        detail: '与本地生活平台、论坛、公众号合作获取链接',
        impact: '提升网站权威度',
      },
      {
        level: 5,
        action: `${CITY}本地内容矩阵搭建`,
        detail: `"${CITY}美容""${CITY}养生""${CITY}SPA"等核心本地词全覆盖`,
        impact: '建立本地搜索护城河',
      },
    ],
    localLandmarks: [
      { name: 'CBD商圈', type: '商圈', keywords: ['CBD附近美容', 'CBD养生馆'] },
      { name: '万达广场', type: '商圈', keywords: ['万达附近SPA', '万达美容院'] },
      { name: '国贸大厦', type: '商圈', keywords: ['国贸附近美容', '国贸养生'] },
      { name: '水悦城', type: '商圈', keywords: ['水悦城附近美容', '水悦城SPA'] },
      { name: '三峡大学', type: '高校', keywords: ['三峡大学附近美容', '学生党护肤'] },
      { name: '宜昌东站', type: '交通', keywords: ['火车站附近美容', '出差护肤'] },
    ],
    competitors: [
      { name: '克丽缇娜', type: '连锁美容', location: '宜昌多店', strategy: '突出中医特色差异化' },
      { name: '自然美', type: '连锁美容', location: '宜昌多店', strategy: '对比展示精油芳疗优势' },
      { name: '美丽田园', type: '高端美容', location: '宜昌多店', strategy: '强调中医调理的标本兼治' },
      { name: '秀域', type: '科技美容', location: '宜昌多店', strategy: '突出天然草本的安全性' },
    ],
  },
};
