/**
 * ============================================================================
 * 中芳堂全域AI智能体系统 - 门店运营知识库 (Operations KB)
 * ============================================================================
 *
 * 用途：为BI分析Agent（analytics-agent）和ERP同步Agent（erp-agent）提供
 * 门店经营指标、员工绩效、库存管理、服务质量、财务报表等结构化知识。
 *
 * 使用方式：
 *   const { businessMetrics, staffPerformance, inventoryRules,
 *           serviceQuality, financialReports } = require('./operations-kb');
 *
 * 适用Agent：
 *   - analytics-agent（BI分析师·小芳数据）
 *   - erp-agent（ERP同步官·小芳管家）
 *
 * 最后更新：2026-07-11
 * ============================================================================
 */

// ============================================================================
// 一、门店经营指标体系 (Business Metrics)
// 30+指标的定义和计算方式
// ============================================================================

const businessMetrics = {
  // 客流量指标
  trafficMetrics: [
    {
      id: 'm_001', name: '到店客流', key: 'storeVisitors',
      definition: '统计周期内实际到店的客户人次',
      formula: 'SUM(每日到店人次)',
      benchmark: '日均8-15人次',
      alertThreshold: '日均<5人次触发预警',
      dataSource: '门店预约系统+签到记录',
      tags: ['客流', '核心指标']
    },
    {
      id: 'm_002', name: '新客占比', key: 'newCustomerRatio',
      definition: '新客到店人数 / 总到店人数',
      formula: '新客到店数 / 总到店数 × 100%',
      benchmark: '30-50%',
      alertThreshold: '<20%说明获客能力不足',
      dataSource: 'CRM客户标签',
      tags: ['新客', '结构指标']
    },
    {
      id: 'm_003', name: '老客复购到店率', key: 'returnRate',
      definition: '老客复购到店人数 / 历史消费客户总数',
      formula: '复购到店老客数 / 历史客户总数 × 100%',
      benchmark: '月均40-60%',
      alertThreshold: '<30%说明客户留存差',
      dataSource: 'CRM消费记录',
      tags: ['老客', '留存']
    },
    {
      id: 'm_004', name: '预约到店率', key: 'bookingShowRate',
      definition: '实际到店人数 / 预约人数',
      formula: '实际到店 / 预约总数 × 100%',
      benchmark: '75-85%',
      alertThreshold: '<60%需优化预约提醒',
      dataSource: '预约系统',
      tags: ['预约', '执行']
    },
    {
      id: 'm_005', name: '线上引流到店占比', key: 'onlineTrafficRatio',
      definition: '线上渠道（抖音/小红书/小程序等）引流到店客户占比',
      formula: '线上渠道到店数 / 总到店数 × 100%',
      benchmark: '40-60%（AI系统上线后目标）',
      alertThreshold: '<30%需加强线上运营',
      dataSource: '客户来源标签',
      tags: ['线上', '渠道']
    }
  ],

  // 转化指标
  conversionMetrics: [
    {
      id: 'm_006', name: '体验转化率', key: 'trialConversionRate',
      definition: '体验后成交客户数 / 到店体验客户数',
      formula: '体验后成交数 / 体验客户数 × 100%',
      benchmark: '40-60%',
      alertThreshold: '<30%需优化体验服务和跟进',
      dataSource: 'CRM+收银系统',
      tags: ['转化', '体验']
    },
    {
      id: 'm_007', name: '测评转化率', key: 'assessmentConversionRate',
      definition: '完成测评后成交客户数 / 完成测评客户数',
      formula: '测评后成交数 / 测评完成数 × 100%',
      benchmark: '25-40%',
      alertThreshold: '<15%需优化测评后跟进',
      dataSource: '小程序+CRM',
      tags: ['转化', '测评']
    },
    {
      id: 'm_008', name: '私域留资率', key: 'leadCaptureRate',
      definition: '公域触达后添加企微/留资的比例',
      formula: '留资数 / 公域触达数 × 100%',
      benchmark: '3-8%',
      alertThreshold: '<2%需优化截流话术',
      dataSource: '截流引擎+企微',
      tags: ['转化', '截流']
    },
    {
      id: 'm_009', name: '券码核销率', key: 'couponRedemptionRate',
      definition: '已核销券码数 / 已发放券码数',
      formula: '核销券数 / 发放券数 × 100%',
      benchmark: '30-50%',
      alertThreshold: '<20%需优化券码策略',
      dataSource: '券码系统',
      tags: ['转化', '券码']
    },
    {
      id: 'm_010', name: '整体成交转化率', key: 'overallConversionRate',
      definition: '成交客户数 / 全部线索数',
      formula: '成交数 / 线索总数 × 100%',
      benchmark: '3-8%（公域→成交全链路）',
      alertThreshold: '<2%需全面优化转化链路',
      dataSource: '全链路数据',
      tags: ['转化', '全链路']
    }
  ],

  // 客单价指标
  ticketMetrics: [
    {
      id: 'm_011', name: '平均客单价', key: 'avgTicket',
      definition: '统计周期内总营收 / 成交客户数',
      formula: '总营收 / 成交客户数',
      benchmark: '新客300-500元，老客800-1500元',
      alertThreshold: '新客<200元或老客<500元',
      dataSource: '收银系统',
      tags: ['客单价', '核心指标']
    },
    {
      id: 'm_012', name: '连带率', key: 'attachmentRate',
      definition: '客户单次消费包含的产品/服务数量',
      formula: '销售总件数 / 成交单数',
      benchmark: '2.0-3.0',
      alertThreshold: '<1.5需加强交叉销售',
      dataSource: '收银系统',
      tags: ['客单价', '连带']
    },
    {
      id: 'm_013', name: '疗程卡渗透率', key: 'packagePenetrationRate',
      definition: '购买疗程卡/季卡/年卡的客户占比',
      formula: '购卡客户数 / 成交客户总数 × 100%',
      benchmark: '30-50%',
      alertThreshold: '<20%需优化疗程卡推荐',
      dataSource: 'CRM+收银',
      tags: ['客单价', '疗程卡']
    },
    {
      id: 'm_014', name: '产品零售占比', key: 'retailProductRatio',
      definition: '产品零售（精油/膏方/纯露/护肤品等）占营收比例',
      formula: '产品零售额 / 总营收 × 100%',
      benchmark: '30-50%',
      alertThreshold: '<20%说明居家产品渗透不足',
      dataSource: '收银系统',
      tags: ['客单价', '产品']
    }
  ],

  // 复购指标
  repurchaseMetrics: [
    {
      id: 'm_015', name: '复购率', key: 'repurchaseRate',
      definition: '统计周期内有复购行为的客户占比',
      formula: '复购客户数 / 历史成交客户总数 × 100%',
      benchmark: '月均30-50%',
      alertThreshold: '<20%说明客户粘性差',
      dataSource: 'CRM消费记录',
      tags: ['复购', '留存']
    },
    {
      id: 'm_016', name: '复购周期', key: 'repurchaseCycle',
      definition: '客户两次消费之间的平均间隔天数',
      formula: 'AVG(每次消费间隔天数)',
      benchmark: '21-45天',
      alertThreshold: '>60天需加强复购提醒',
      dataSource: 'CRM消费记录',
      tags: ['复购', '周期']
    },
    {
      id: 'm_017', name: '耗卡率', key: 'cardUsageRate',
      definition: '疗程卡已消费次数 / 疗程卡总次数',
      formula: '已耗次数 / 总次数 × 100%',
      benchmark: '月耗卡率60-80%',
      alertThreshold: '<40%说明客户到店频率低',
      dataSource: 'CRM+收银',
      tags: ['复购', '耗卡']
    },
    {
      id: 'm_018', name: '客户流失率', key: 'churnRate',
      definition: '90天无互动无消费的客户占比',
      formula: '流失客户数 / 历史客户总数 × 100%',
      benchmark: '月均5-10%',
      alertThreshold: '>15%触发流失预警',
      dataSource: 'CRM',
      tags: ['流失', '预警']
    },
    {
      id: 'm_019', name: '客户生命周期价值', key: 'clv',
      definition: '单个客户从首次消费到流失期间贡献的总收入',
      formula: 'AVG(客单价 × 消费次数 × 留存时间)',
      benchmark: 'A类>20000元, B类>8000元, C类>5000元, D类>1500元',
      alertThreshold: '整体CLV下降>20%',
      dataSource: 'CRM全量数据',
      tags: ['CLV', '客户价值']
    }
  ],

  // 效率指标
  efficiencyMetrics: [
    {
      id: 'm_020', name: '坪效', key: 'revenuePerSquareMeter',
      definition: '每平方米营业面积产生的月营收',
      formula: '月营收 / 营业面积（㎡）',
      benchmark: '美业平均300-500元/㎡/月',
      alertThreshold: '<200元/㎡/月',
      dataSource: '收银+门店面积',
      tags: ['效率', '坪效']
    },
    {
      id: 'm_021', name: '人效', key: 'revenuePerStaff',
      definition: '每位调理师/员工产生的月营收',
      formula: '月营收 / 员工人数',
      benchmark: '调理师月均15000-30000元',
      alertThreshold: '<10000元',
      dataSource: '收银+员工数据',
      tags: ['效率', '人效']
    },
    {
      id: 'm_022', name: '翻台率', key: 'bedTurnoverRate',
      definition: '每个调理床位日均服务人次',
      formula: '日均服务总人次 / 床位数',
      benchmark: '1.5-2.5次/床/天',
      alertThreshold: '<1.0次/床/天',
      dataSource: '预约系统',
      tags: ['效率', '床位']
    },
    {
      id: 'm_023', name: '预约满客率', key: 'bookingFullRate',
      definition: '可预约时段中已被预约的比例',
      formula: '已预约时段 / 可预约总时段 × 100%',
      benchmark: '周末>90%, 工作日>60%',
      alertThreshold: '工作日<40%',
      dataSource: '预约系统',
      tags: ['效率', '预约']
    }
  ],

  // 财务指标
  financialMetrics: [
    {
      id: 'm_024', name: '月度营收', key: 'monthlyRevenue',
      definition: '月度所有业务收入总和',
      formula: 'SUM(服务收入 + 产品销售收入 + 会员卡收入)',
      benchmark: '目标8-15万/月',
      alertThreshold: '<5万/月触发经营预警',
      dataSource: '收银系统',
      tags: ['财务', '营收']
    },
    {
      id: 'm_025', name: '毛利率', key: 'grossMargin',
      definition: '（营收 - 产品成本）/ 营收',
      formula: '(营收 - 产品成本) / 营收 × 100%',
      benchmark: '服务65-75%, 产品40-60%',
      alertThreshold: '服务<55%或产品<35%',
      dataSource: '收银+ERP',
      tags: ['财务', '利润']
    },
    {
      id: 'm_026', name: '净利润率', key: 'netMargin',
      definition: '（营收 - 全部成本）/ 营收',
      formula: '(营收 - 全部成本) / 营收 × 100%',
      benchmark: '20-35%',
      alertThreshold: '<15%',
      dataSource: 'ERP',
      tags: ['财务', '利润']
    },
    {
      id: 'm_027', name: 'ROI（营销投入回报）', key: 'marketingROI',
      definition: '营销带来的增量营收 / 营销投入',
      formula: '(营销增量营收 - 营销成本) / 营销成本 × 100%',
      benchmark: '>300%',
      alertThreshold: '<100%',
      dataSource: '全链路数据',
      tags: ['财务', 'ROI']
    },
    {
      id: 'm_028', name: '会员储值余额', key: 'memberBalance',
      definition: '所有会员卡储值余额总和',
      formula: 'SUM(会员卡余额)',
      benchmark: '目标20-50万',
      alertThreshold: '<10万说明锁客不足',
      dataSource: 'CRM+ERP',
      tags: ['财务', '储值']
    },
    {
      id: 'm_029', name: '应收账款周转', key: 'receivableTurnover',
      definition: '疗程卡未耗金额 / 月均消耗金额',
      formula: '未耗金额 / 月均耗卡金额',
      benchmark: '<3个月',
      alertThreshold: '>6个月说明耗卡率过低',
      dataSource: 'CRM+收银',
      tags: ['财务', '应收']
    }
  ],

  // 客户满意度
  satisfactionMetrics: [
    {
      id: 'm_030', name: '客户满意度评分', key: 'satisfactionScore',
      definition: '客户到店后满意度评分的平均值',
      formula: 'AVG(满意度评分)',
      benchmark: '4.5/5分以上',
      alertThreshold: '<4.0分',
      dataSource: '回访问卷',
      tags: ['满意度', '服务']
    },
    {
      id: 'm_031', name: 'NPS净推荐值', key: 'nps',
      definition: '客户愿意推荐中芳堂的程度',
      formula: '(推荐者% - 贬损者%)',
      benchmark: '>50',
      alertThreshold: '<30',
      dataSource: '客户调研',
      tags: ['满意度', '推荐']
    },
    {
      id: 'm_032', name: '投诉率', key: 'complaintRate',
      definition: '投诉客户数 / 服务客户总数',
      formula: '投诉数 / 服务总数 × 100%',
      benchmark: '<2%',
      alertThreshold: '>5%触发服务整改',
      dataSource: 'CRM投诉记录',
      tags: ['满意度', '投诉']
    }
  ]
};

// ============================================================================
// 二、员工绩效考核模型 (Staff Performance)
// ============================================================================

const staffPerformance = {
  therapist: {
    role: '调理师/芳疗师',
    kpiSystem: [
      { kpi: '月度服务人次', weight: 25, target: '60-80人次/月', scoring: '达标100分，每±10%±10分' },
      { kpi: '客户满意度', weight: 25, target: '≥4.5分', scoring: '4.5分=100分，每±0.1±10分' },
      { kpi: '老客复购率', weight: 20, target: '≥40%', scoring: '40%=100分，每±5%±10分' },
      { kpi: '产品连带销售', weight: 15, target: '月均5000元', scoring: '5000=100分，每±10%±10分' },
      { kpi: '耗卡率', weight: 10, target: '≥70%', scoring: '70%=100分，每±5%±10分' },
      { kpi: '专业技能考核', weight: 5, target: '季度考核≥90分', scoring: '90=100分，每±5±10分' }
    ],
    scoreRanks: [
      { rank: 'S（卓越）', range: '≥95分', bonus: '绩效系数1.3', reward: '月度优秀员工+额外奖金' },
      { rank: 'A（优秀）', range: '85-94分', bonus: '绩效系数1.1', reward: '月度表扬' },
      { rank: 'B（良好）', range: '70-84分', bonus: '绩效系数1.0', reward: '正常发放' },
      { rank: 'C（待改进）', range: '60-69分', bonus: '绩效系数0.8', reward: '制定改进计划' },
      { rank: 'D（不合格）', range: '<60分', bonus: '绩效系数0.5', reward: '面谈+培训/调整' }
    ],
    tags: ['调理师', 'KPI', '绩效']
  },

  consultant: {
    role: '顾问/销售',
    kpiSystem: [
      { kpi: '月度销售额', weight: 35, target: '月均30000-50000元', scoring: '达标100分，按比例' },
      { kpi: '新客转化率', weight: 25, target: '≥40%', scoring: '40%=100分，每±5%±10分' },
      { kpi: '客单价', weight: 15, target: '≥800元', scoring: '800=100分，每±100±10分' },
      { kpi: '老客复购跟进率', weight: 10, target: '≥80%', scoring: '80%=100分' },
      { kpi: '客户满意度', weight: 10, target: '≥4.5分', scoring: '同调理师' },
      { kpi: 'CRM记录完整度', weight: 5, target: '100%', scoring: '缺1条扣5分' }
    ],
    tags: ['顾问', 'KPI', '销售']
  },

  manager: {
    role: '店长',
    kpiSystem: [
      { kpi: '月度营收达成率', weight: 30, target: '≥100%', scoring: '达标100分' },
      { kpi: '月度净利润', weight: 25, target: '月均目标利润', scoring: '按达成率' },
      { kpi: '团队人效', weight: 15, target: '≥15000元/人/月', scoring: '达标100分' },
      { kpi: '客户满意度', weight: 10, target: '≥4.5分', scoring: '同调理师' },
      { kpi: '员工留存率', weight: 10, target: '≥85%/年', scoring: '85%=100分' },
      { kpi: '库存周转天数', weight: 5, target: '≤60天', scoring: '60天=100分' },
      { kpi: '安全合规', weight: 5, target: '零事故', scoring: '有事故0分' }
    ],
    tags: ['店长', 'KPI', '管理']
  }
};

// ============================================================================
// 三、库存管理规则 (Inventory Rules)
// ============================================================================

const inventoryRules = {
  products: {
    essentialOil: {
      name: '精油系列',
      categories: ['九体辨识复方精油', '28种单方精油', '纯露系列'],
      alertThresholds: {
        lowStock: '库存<30天销量时触发补货预警',
        criticalStock: '库存<15天销量时触发紧急补货',
        overstock: '库存>90天销量时触发促销建议'
      },
      shelfLife: '未开封3年，开封后6-12个月（柑橘类6个月）',
      storageCondition: '避光、阴凉、密封，温度15-25°C',
      replenishmentCycle: '常规30天，热门单品15天',
      tags: ['精油', '库存']
    },
    pasteFormula: {
      name: '膏方系列',
      categories: ['伍申堂八款膏方'],
      alertThresholds: {
        lowStock: '库存<20天销量时触发补货',
        criticalStock: '库存<10天销量时触发紧急补货',
        overstock: '库存>60天销量时触发促销'
      },
      shelfLife: '未开封18个月，开封后冷藏3个月内用完',
      storageCondition: '阴凉干燥，开封后冷藏（0-8°C）',
      replenishmentCycle: '常规30天',
      tags: ['膏方', '库存']
    },
    skincare: {
      name: '芝参护肤系列',
      categories: ['洁面', '精华', '面膜', '防晒', '面霜'],
      alertThresholds: {
        lowStock: '库存<25天销量时触发补货',
        criticalStock: '库存<10天销量时触发紧急补货',
        overstock: '库存>75天销量时触发促销'
      },
      shelfLife: '未开封3年，开封后6-12个月',
      storageCondition: '常温避光',
      replenishmentCycle: '常规30天',
      tags: ['护肤', '库存']
    },
    wristWatch: {
      name: '腕家H1健康手表',
      categories: ['智能硬件'],
      alertThresholds: {
        lowStock: '库存<10台时触发补货',
        criticalStock: '库存<3台时触发紧急补货'
      },
      shelfLife: '无特殊效期，注意配件（表带）库存',
      storageCondition: '常温干燥',
      replenishmentCycle: '常规30天',
      tags: ['腕家H1', '库存']
    }
  },

  inventoryKPI: [
    { kpi: '库存周转天数', target: '<60天', formula: '平均库存金额 / 日均销售成本', alert: '>90天触发预警' },
    { kpi: '缺货率', target: '<5%', formula: '缺货SKU数 / 总SKU数 × 100%', alert: '>10%需优化采购' },
    { kpi: '滞销占比', target: '<15%', formula: '>90天未动销SKU数 / 总SKU数', alert: '>20%触发促销' },
    { kpi: '效期预警率', target: '<10%', formula: '临期（<3个月）产品占比', alert: '>15%需促销处理' },
    { kpi: '盘点准确率', target: '>98%', formula: '盘点一致SKU数 / 总SKU数', alert: '<95%需整改' }
  ],

  replenishmentRules: {
    regularReplenishment: '每月1日和15日例行补货',
    emergencyReplenishment: '库存低于临界值时立即补货',
    seasonalAdjustment: '换季前30天调整补货量（春夏+30%祛湿类，秋冬+50%温补类）',
    newProductLaunch: '新品上市前45天首批备货，前15天二次补货',
    promotionPreparation: '大促前30天按预估销量1.5倍备货'
  },

  expiryManagement: {
    alertStages: [
      { stage: '6个月到期', action: '标记为临期关注，正常销售' },
      { stage: '3个月到期', action: '触发促销建议，优先推荐' },
      { stage: '1个月到期', action: '紧急处理：买赠/折扣/员工福利' },
      { stage: '已过期', action: '立即下架，登记报废' }
    ],
    tags: ['效期', '管理']
  }
};

// ============================================================================
// 四、服务质量管理 (Service Quality)
// ============================================================================

const serviceQuality = {
  serviceSOP: {
    preService: [
      { step: 1, action: '预约确认', detail: '提前1天电话/微信确认预约时间和服务项目', responsible: '前台/顾问' },
      { step: 2, action: '环境准备', detail: '调理房间清洁、香薰开启、音乐播放、温度调节（24-26°C）', responsible: '调理师' },
      { step: 3, action: '物料准备', detail: '根据客户体质准备精油、毛巾、一次性用品', responsible: '调理师' },
      { step: 4, action: '客户接待', detail: '门口迎接、引导入座、奉养生茶、了解当日身体状态', responsible: '顾问/调理师' }
    ],
    inService: [
      { step: 5, action: '体质复核', detail: '查看客户体质档案，确认今日调理重点', responsible: '调理师' },
      { step: 6, action: '精油调配', detail: '当着客户面调配精油，讲解配方功效', responsible: '调理师' },
      { step: 7, action: '调理服务', detail: '按标准流程进行精油SPA调理（60-90分钟），过程中关注客户感受', responsible: '调理师' },
      { step: 8, action: '数据记录', detail: '调理前后使用腕家H1记录关键数据对比', responsible: '调理师' }
    ],
    postService: [
      { step: 9, action: '效果反馈', detail: '询问客户调理感受，展示腕家H1数据变化', responsible: '调理师' },
      { step: 10, action: '方案推荐', detail: '根据调理情况推荐居家产品和下次调理计划', responsible: '顾问/调理师' },
      { step: 11, action: '预约下次', detail: '引导预约下次到店时间', responsible: '顾问' },
      { step: 12, action: '送客', detail: '送至门口，赠送养生茶包小礼品', responsible: '调理师' },
      { step: 13, action: '记录归档', detail: '当日完成CRM服务记录，包括调理内容、客户反馈、推荐产品', responsible: '调理师' }
    ],
    tags: ['SOP', '服务流程']
  },

  satisfactionEvaluation: {
    dimensions: [
      { dimension: '环境舒适度', weight: 15, items: ['门店整洁度', '调理房间氛围', '香氛/音乐/温度'] },
      { dimension: '服务态度', weight: 20, items: ['接待热情度', '沟通耐心度', '关怀细致度'] },
      { dimension: '专业技能', weight: 30, items: ['体质分析准确度', '精油调配专业度', '按摩手法舒适度'] },
      { dimension: '调理效果', weight: 25, items: ['即时放松感', '数据改善（腕家H1）', '问题改善程度'] },
      { dimension: '性价比', weight: 10, items: ['价格合理度', '方案推荐适度', '无过度推销'] }
    ],
    scoreCalculation: '各项加权平均，满分5分',
    feedbackCollection: '到店后24小时自动发送满意度问卷（企微+小程序）',
    tags: ['满意度', '评价']
  },

  complaintHandling: {
    process: [
      { step: 1, action: '接收投诉', timeline: '即时', detail: '任何渠道收到的投诉立即记录到CRM投诉模块' },
      { step: 2, action: '分级响应', timeline: '30分钟内', detail: '普通投诉（服务态度/等待时间等）→店长处理；严重投诉（过敏/受伤/退款）→立即上报屈兵' },
      { step: 3, action: '客户安抚', timeline: '1小时内', detail: '主动联系客户致歉，了解详细情况，表达重视' },
      { step: 4, action: '调查处理', timeline: '24小时内', detail: '核实情况，制定解决方案（退款/补偿/重新服务等）' },
      { step: 5, action: '方案沟通', timeline: '24小时内', detail: '与客户沟通解决方案，达成一致' },
      { step: 6, action: '执行闭环', timeline: '48小时内', detail: '执行解决方案，客户确认满意后关闭投诉' },
      { step: 7, action: '复盘改进', timeline: '72小时内', detail: '分析投诉原因，制定改进措施，更新SOP' }
    ],
    severityLevels: [
      { level: '轻微', examples: '等待时间稍长、服务态度一般', response: '店长致歉+小礼品补偿' },
      { level: '中等', examples: '调理效果不满意、推荐过度', response: '店长致歉+免费重做/部分退款' },
      { level: '严重', examples: '皮肤过敏、身体不适、财产损失', response: '立即上报屈兵+全额退款+赔偿+陪同就医' },
      { level: '危机', examples: '媒体曝光、监管部门投诉', response: '立即上报屈兵+法务介入+公关处理' }
    ],
    tags: ['投诉', '处理']
  }
};

// ============================================================================
// 五、财务报表模板 (Financial Reports)
// ============================================================================

const financialReports = {
  dailyRevenueReport: {
    name: '日营收报表',
    frequency: '每日生成（次日8:00）',
    dataStructure: {
      header: {
        date: '报表日期',
        weather: '天气（影响客流参考）',
        dayOfWeek: '星期几',
        specialEvent: '是否节假日/活动日'
      },
      revenue: {
        serviceRevenue: { definition: '服务项目收入', items: ['体质调理', '精油SPA', '面部护理', '经络疏通', '局部调理', '其他服务'] },
        productRevenue: { definition: '产品销售收入', items: ['精油产品', '膏方产品', '纯露产品', '芝参护肤', '纤姿达', '腕家H1', '其他产品'] },
        cardRevenue: { definition: '会员卡/疗程卡收入', items: ['季卡', '年卡', '储值卡充值', '疗程卡'] },
        totalRevenue: { definition: '当日总收入', formula: '服务收入 + 产品收入 + 会员卡收入' }
      },
      traffic: {
        totalVisitors: '当日到店总人次',
        newCustomers: '当日新客数',
        returnCustomers: '当日老客数',
        onlineTraffic: '线上引流到店数',
        bookingCount: '预约数',
        showCount: '实际到店数',
        noShowCount: '爽约数'
      },
      conversion: {
        newCustomerTrials: '新客体验数',
        newCustomerConversions: '新客成交数',
        newConversionRate: '新客转化率',
        productSalesCount: '产品销售单数',
        cardSalesCount: '会员卡销售数'
      },
      staff: {
        workingTherapists: '当班调理师',
        servicesPerTherapist: '人均服务人次',
        revenuePerTherapist: '人均产出'
      },
      summary: {
        dailyTarget: '日营收目标',
        achievementRate: '达成率',
        monthToDateRevenue: '月累计营收',
        monthAchievementRate: '月达成率'
      }
    },
    generationRule: '每日凌晨自动汇总前一日数据，推送至店长企微',
    tags: ['日报', '营收']
  },

  monthlyAnalysisReport: {
    name: '月经营分析报告',
    frequency: '每月1日生成上月报告',
    dataStructure: {
      executiveSummary: {
        monthlyRevenue: '月度总营收',
        revenueGrowth: '环比/同比增长率',
        netProfit: '月度净利润',
        keyHighlights: '本月核心亮点（3-5条）',
        keyIssues: '本月核心问题（3-5条）'
      },
      revenueBreakdown: {
        byCategory: '按品类拆分（服务/产品/会员卡）',
        byProduct: '按产品排名TOP10',
        byService: '按服务项目排名',
        byCustomerTier: '按客户分层（ABCD类）贡献'
      },
      customerAnalysis: {
        totalCustomers: '月服务客户总数',
        newCustomers: '月新增客户',
        churnedCustomers: '月流失客户',
        avgTicket: '月均客单价',
        repurchaseRate: '月复购率',
        clvTrend: '客户生命周期价值趋势'
      },
      channelAnalysis: {
        onlineChannels: '各线上渠道（抖音/小红书/视频号等）引流和转化数据',
        offlineChannels: '自然到店/老带新/路过等渠道数据',
        roiByChannel: '各渠道ROI排名'
      },
      productAnalysis: {
        topSelling: '畅销产品TOP10',
        slowMoving: '滞销产品列表',
        inventoryStatus: '库存健康度分析',
        newProductPerformance: '新品表现'
      },
      staffPerformance: {
        therapistRanking: '调理师绩效排名',
        consultantRanking: '顾问绩效排名',
        overallEfficiency: '团队人效/坪效分析'
      },
      financialSummary: {
        pnl: '月度损益表',
        cashflow: '现金流概况',
        budgetComparison: '预算vs实际对比',
        nextMonthForecast: '下月预测'
      },
      strategyRecommendations: {
        marketing: '营销策略建议',
        product: '产品策略建议',
        service: '服务优化建议',
        customer: '客户运营建议'
      }
    },
    generationRule: '每月1日8:00自动生成，推送至屈兵企微',
    tags: ['月报', '经营分析']
  },

  quarterlyReviewReport: {
    name: '季度总结报告',
    frequency: '每季度结束后5个工作日内',
    dataStructure: {
      quarterOverview: {
        totalRevenue: '季度总营收',
        quarterlyGrowth: '季度环比增长',
        annualProgress: '年度目标完成进度',
        keyAchievements: '季度核心成就'
      },
      trendAnalysis: {
        revenueTrend: '季度内月度营收趋势',
        customerTrend: '客户增长/流失趋势',
        productTrend: '品类销售趋势',
        costTrend: '成本变化趋势'
      },
      strategicReview: {
        strategyExecution: '季度策略执行情况',
        successCases: '成功案例总结',
        failureAnalysis: '失败/不足分析',
        adjustmentPlan: '下季度调整计划'
      },
      teamReview: {
        topPerformers: '优秀员工表彰',
        trainingNeeds: '培训需求分析',
        hiringPlan: '人员招聘/调整计划'
      },
      nextQuarterPlan: {
        revenueTarget: '下季度营收目标',
        keyInitiatives: '核心举措（3-5项）',
        resourceNeeds: '资源需求',
        riskAssessment: '风险评估'
      }
    },
    generationRule: '季末5个工作日内生成，推送至屈兵企微',
    tags: ['季报', '总结']
  },

  reportGenerationConfig: {
    autoGeneration: true,
    deliveryChannels: ['企微消息', 'BI中台展示'],
    alertConditions: [
      '日营收低于目标70%',
      '月营收低于目标80%',
      '客单价下降>20%',
      '流失率上升>50%',
      '投诉量月增>3起',
      '库存积压>90天'
    ],
    dataRetention: '日报保留12个月，月报保留36个月，季报永久保留',
    tags: ['报表', '配置']
  }
};

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  businessMetrics,
  staffPerformance,
  inventoryRules,
  serviceQuality,
  financialReports
};
