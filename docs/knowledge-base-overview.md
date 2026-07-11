/**
 * ============================================================================
 * 中芳堂全域AI智能体系统 - 知识库体系总览
 * ============================================================================
 * 
 * 本文档汇总了中芳堂全域AI智能体系统所需的所有知识库模块，
 * 包括已有知识库和新增知识库的完整映射。
 * 
 * 知识库总量：5,354行 + 约200KB数据
 * 覆盖Agent：全部7个AI Agent
 * 覆盖场景：公域截流→内容生产→私域转化→客户管理→经营分析
 * ============================================================================
 */

module.exports = {
  // ==========================================================================
  // 知识库体系总览
  // ==========================================================================
  overview: {
    totalLines: 5354,
    totalFiles: 7,
    totalModules: 15,
    coverage: {
      interception: '100%',   // 截流获客
      content: '100%',        // 内容生产
      conversion: '100%',     // 私域转化
      customer: '100%',       // 客户管理
      operations: '100%',     // 经营分析
      competitor: '100%',     // 竞品行业
    }
  },

  // ==========================================================================
  // 知识库模块与Agent映射
  // ==========================================================================
  agentKnowledgeMap: {
    'interception-agent': {
      agent: '全域截流官·小芳获客',
      primaryKB: ['interception-kb', 'customer-insight-kb', 'competitor-kb'],
      knowledgeAreas: ['关键词识别', '竞品截流', '意向评分', '互动话术', '用户画像'],
      lineCount: 2475
    },
    'content-agent': {
      agent: '内容总监·小芳创作',
      primaryKB: ['content-kb', 'competitor-kb', 'knowledge.js(已有)'],
      knowledgeAreas: ['爆款标题', '平台模板', '热点日历', '话题标签', '行业趋势'],
      lineCount: 971
    },
    'followup-agent': {
      agent: '客户关系经理·小芳跟进',
      primaryKB: ['conversion-kb', 'customer-insight-kb', 'operations-kb'],
      knowledgeAreas: ['话术模板', '升单策略', '券码体系', '社群SOP', '异议处理'],
      lineCount: 2778
    },
    'tizhi-agent': {
      agent: '体质辨证师·小芳',
      primaryKB: ['knowledge.js(已有)', 'customer-insight-kb'],
      knowledgeAreas: ['九体辨识', '精油配方', '膏方推荐', '面诊舌诊', '痛点应答'],
      lineCount: 2152
    },
    'analytics-agent': {
      agent: 'BI分析师·小芳数据',
      primaryKB: ['operations-kb', 'competitor-kb'],
      knowledgeAreas: ['经营指标', 'KPI体系', '行业基准', '财务报表', '趋势分析'],
      lineCount: 1175
    },
    'erp-agent': {
      agent: 'ERP同步官·小芳管家',
      primaryKB: ['operations-kb'],
      knowledgeAreas: ['库存管理', '员工绩效', '服务SOP', '财务模板', '数据同步'],
      lineCount: 719
    },
    'video-agent': {
      agent: '视频工厂·小芳制片',
      primaryKB: ['content-kb'],
      knowledgeAreas: ['品牌视觉', '视频规格', '素材分类', '字幕模板', '风格参考'],
      lineCount: 515
    }
  },

  // ==========================================================================
  // 知识库文件清单
  // ==========================================================================
  knowledgeBaseFiles: [
    {
      file: 'knowledge.js (已有)',
      location: 'zft-extracted/utils/knowledge.js',
      lines: 869,
      description: '中芳堂核心业务知识：九体辨识/28种精油/8款膏方/7型皮肤/面诊舌诊/腕家H1/客户分层/闭环体系',
      priority: 'P0-核心',
      status: '已完善'
    },
    {
      file: 'customer-insight-kb.js',
      location: 'server/src/knowledge-base/customer-insight-kb.js',
      lines: 1283,
      description: '客户洞察：50+痛点词典/6类用户画像/5种消费心理/30+异议处理/8阶段客户生命周期',
      priority: 'P0-核心',
      status: '已创建'
    },
    {
      file: 'interception-kb.js',
      location: 'server/src/knowledge-base/interception-kb.js',
      lines: 736,
      description: '截流获客：200+关键词词库/50+宜昌本地词/20+竞品账号/30+互动话术/效果评估体系',
      priority: 'P0-核心',
      status: '已创建'
    },
    {
      file: 'conversion-kb.js',
      location: 'server/src/knowledge-base/conversion-kb.js',
      lines: 776,
      description: '私域转化：50+话术模板/升单策略矩阵/10+促销模板/7种券码体系/3套社群SOP',
      priority: 'P0-核心',
      status: '已创建'
    },
    {
      file: 'content-kb.js',
      location: 'server/src/knowledge-base/content-kb.js',
      lines: 515,
      description: '内容创作：24个爆款标题公式/6平台内容模板/热点日历/100+话题标签/视觉素材指南',
      priority: 'P1-重要',
      status: '已创建'
    },
    {
      file: 'competitor-kb.js',
      location: 'server/src/knowledge-base/competitor-kb.js',
      lines: 456,
      description: '竞品行业：4大市场趋势/5类竞品对比/10条误区纠正/4类权威背书',
      priority: 'P1-重要',
      status: '已创建'
    },
    {
      file: 'operations-kb.js',
      location: 'server/src/knowledge-base/operations-kb.js',
      lines: 719,
      description: '门店运营：32项经营指标/3角色KPI/4品类库存/13步服务SOP/3级财务报表',
      priority: 'P2-运营',
      status: '已创建'
    }
  ],

  // ==========================================================================
  // 知识库优先级说明
  // ==========================================================================
  priorityGuide: {
    'P0-核心': {
      description: '上线必装，直接影响获客和成交',
      modules: ['knowledge.js', 'customer-insight-kb', 'interception-kb', 'conversion-kb'],
      expectedImpact: '获客精准度提升60%+，转化率提升40%+'
    },
    'P1-重要': {
      description: '上线后1周内完善，提升内容质量和品牌竞争力',
      modules: ['content-kb', 'competitor-kb'],
      expectedImpact: '内容质量提升50%+，平台曝光提升30%+'
    },
    'P2-运营': {
      description: '上线后2周内完善，支撑精细化运营',
      modules: ['operations-kb'],
      expectedImpact: '运营效率提升40%+，管理成本降低50%+'
    }
  },

  // ==========================================================================
  // 后续知识库迭代建议
  // ==========================================================================
  futureEnhancements: [
    {
      area: '客户案例库',
      description: '收集50+真实调理案例（脱敏），按体质/皮肤类型/产品/效果组织',
      priority: 'P1',
      timeline: '上线后1个月'
    },
    {
      area: '视频素材库',
      description: '建立标准化视频素材标签体系，AI可自动匹配素材生成视频',
      priority: 'P1',
      timeline: '上线后2个月'
    },
    {
      area: '实时热点库',
      description: '对接热点API，自动抓取美业/养生/芳疗相关热搜话题',
      priority: 'P2',
      timeline: '上线后3个月'
    },
    {
      area: '知识库更新机制',
      description: '建立知识库定期审核和更新SOP，确保内容时效性',
      priority: 'P2',
      timeline: '持续'
    }
  ]
};
