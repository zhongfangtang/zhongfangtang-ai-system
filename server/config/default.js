/**
 * 中芳堂AI系统 - 全局配置
 *
 * 所有敏感值通过环境变量注入，此处提供默认值占位。
 * 生产环境务必通过 .env 或容器环境变量覆盖。
 *
 * @module config/default
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env') });

const config = {
  /** 运行环境 */
  env: process.env.NODE_ENV || 'development',

  /** 服务器配置 */
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    host: process.env.HOST || '0.0.0.0',
  },

  /** MongoDB 数据库 */
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zhongfangtang',
    options: {
      user: process.env.MONGODB_USER || '',
      pass: process.env.MONGODB_PASS || '',
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  /** Redis (Bull 队列) */
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  /** JWT 认证 */
  jwt: {
    secret: process.env.JWT_SECRET || 'zhongfangtang-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  /** AI 模型配置（低成本/免费优先：OpenAI 兼容格式） */
  ai: {
    provider: process.env.AI_MODEL_PROVIDER || 'openai-compatible',
    apiKey: process.env.AI_MODEL_API_KEY || '',
    apiSecret: process.env.AI_MODEL_API_SECRET || '',
    // 默认硅基流动 SiliconFlow（有免费模型）/ DeepSeek（¥1/百万token）。两者均 OpenAI 兼容
    endpoint: process.env.AI_MODEL_ENDPOINT || 'https://api.siliconflow.cn/v1',
    /** 模型列表（免费/低成本推荐见 .env.example） */
    models: {
      text: process.env.AI_MODEL_TEXT || 'Qwen2.5-7B-Instruct',
      image: process.env.AI_MODEL_IMAGE || '',
      embedding: process.env.AI_MODEL_EMBEDDING || '',
    },
    /** 请求配置 */
    request: {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
    },
  },

  /** 各平台API配置 */
  platforms: {
    /** 抖音开放平台 */
    douyin: {
      appId: process.env.DOUYIN_APP_ID || '',
      appSecret: process.env.DOUYIN_APP_SECRET || '',
      redirectUri: process.env.DOUYIN_REDIRECT_URI || '',
      accessToken: process.env.DOUYIN_ACCESS_TOKEN || '',
      apiBase: 'https://open.douyin.com',
      /** 发布限制：半自动模式 */
      publishMode: 'semi-auto',
      dailyLimit: 5,
      rateLimit: { maxRequests: 10, perSeconds: 60 },
    },

    /** 小红书开放平台 */
    xiaohongshu: {
      appId: process.env.XIAOHONGSHU_APP_ID || '',
      appSecret: process.env.XIAOHONGSHU_APP_SECRET || '',
      redirectUri: process.env.XIAOHONGSHU_REDIRECT_URI || '',
      apiBase: 'https://open-api.xiaohongshu.com',
      publishMode: 'semi-auto',
      dailyLimit: 3,
      rateLimit: { maxRequests: 5, perSeconds: 60 },
    },

    /** 微信视频号 */
    weixin: {
      appId: process.env.WEIXIN_APP_ID || '',
      appSecret: process.env.WEIXIN_APP_SECRET || '',
      token: process.env.WEIXIN_TOKEN || '',
      aesKey: process.env.WEIXIN_AES_KEY || '',
      apiBase: 'https://api.weixin.qq.com',
      /** 发布限制：全自动模式 */
      publishMode: 'full-auto',
      dailyLimit: 3,
      rateLimit: { maxRequests: 20, perSeconds: 60 },
    },

    /** 快手开放平台 */
    kuaishou: {
      appId: process.env.KUAISHOU_APP_ID || '',
      appSecret: process.env.KUAISHOU_APP_SECRET || '',
      redirectUri: process.env.KUAISHOU_REDIRECT_URI || '',
      apiBase: 'https://open.kuaishou.com',
      publishMode: 'semi-auto',
      dailyLimit: 3,
      rateLimit: { maxRequests: 10, perSeconds: 60 },
    },

    /** B站开放平台 */
    bilibili: {
      appId: process.env.BILIBILI_APP_ID || '',
      appSecret: process.env.BILIBILI_APP_SECRET || '',
      redirectUri: process.env.BILIBILI_REDIRECT_URI || '',
      accessKey: process.env.BILIBILI_ACCESS_KEY || '',
      refreshToken: process.env.BILIBILI_REFRESH_TOKEN || '',
      apiBase: 'https://api.bilibili.com',
      publishMode: 'full-auto',
      dailyLimit: 5,
      rateLimit: { maxRequests: 15, perSeconds: 60 },
    },

    /** 百家号 */
    baijiahao: {
      appId: process.env.BAIJIAHAO_APP_ID || '',
      appSecret: process.env.BAIJIAHAO_APP_SECRET || '',
      cookie: process.env.BAIJIAHAO_COOKIE || '',
      apiBase: 'https://baijiahao.baidu.com',
      publishMode: 'full-auto',
      dailyLimit: 10,
      rateLimit: { maxRequests: 10, perSeconds: 60 },
    },
  },

  /** 企业微信配置 */
  wework: {
    corpId: process.env.WEWORK_CORP_ID || '',
    corpSecret: process.env.WEWORK_CORP_SECRET || '',
    agentId: process.env.WEWORK_AGENT_ID || '',
    token: process.env.WEWORK_TOKEN || '',
    aesKey: process.env.WEWORK_AES_KEY || '',
    callbackUrl: process.env.WEWORK_CALLBACK_URL || '',
    apiBase: 'https://qyapi.weixin.qq.com/cgi-bin',
  },

  /** 微信小程序 */
  miniprogram: {
    appId: process.env.MINIPROGRAM_APP_ID || '',
    appSecret: process.env.MINIPROGRAM_APP_SECRET || '',
    apiBase: 'https://api.weixin.qq.com',
  },

  /** Web3 链上存证（默认 Sepolia 测试网，免费） */
  web3: {
    enabled: process.env.WEB3_ENABLED === 'true',
    network: process.env.WEB3_NETWORK || 'sepolia',
    chainId: parseInt(process.env.WEB3_CHAIN_ID, 10) || 11155111,
    rpcUrl: process.env.WEB3_RPC_URL || '',
    contractAddress: process.env.WEB3_CONTRACT_ADDRESS || '',
    privateKey: process.env.WEB3_PRIVATE_KEY || '',
  },

  /** 美业 ERP 深度对接（有赞美业/美团收银/客如云等） */
  erp: {
    enabled: process.env.ERP_ENABLED === 'true',
    provider: process.env.ERP_PROVIDER || 'generic', // youzan | meituan | keruyun | generic
    apiBase: process.env.ERP_API_BASE || '',
    apiKey: process.env.ERP_API_KEY || '',
    apiSecret: process.env.ERP_API_SECRET || '',
    shopId: process.env.ERP_SHOP_ID || '',
  },

  /** 腕家 H1 健康手表数据同步 */
  wanjiH1: {
    enabled: process.env.WANJIA_H1_ENABLED === 'true',
    apiBase: process.env.WANJIA_H1_API_BASE || 'https://api.wanjia-health.com/v1',
    appKey: process.env.WANJIA_H1_APP_KEY || '',
    appSecret: process.env.WANJIA_H1_APP_SECRET || '',
  },

  /** 门店信息 */
  store: {
    name: process.env.STORE_NAME || '中芳堂中医芳香疗法',
    address: process.env.STORE_ADDRESS || '湖北省宜昌市',
    phone: process.env.STORE_PHONE || '',
    /** 门店GPS坐标（宜昌市） */
    latitude: parseFloat(process.env.STORE_LAT) || 30.69,
    longitude: parseFloat(process.env.STORE_LNG) || 111.29,
    /** LBS精准定位半径(km) */
    lbsRadius: 50,
  },

  /** 文件上传 */
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/quicktime'],
  },

  /** 内容审核 */
  contentAudit: {
    enabled: process.env.CONTENT_AUDIT_ENABLED !== 'false',
    sensitiveWordsFile: process.env.SENSITIVE_WORDS_FILE || './config/sensitive-words.txt',
  },

  /** 截流引擎配置 */
  interception: {
    /** 互动频率控制：每次互动最小间隔(ms) */
    minInteractionInterval: 30000,
    /** 每小时最大互动次数 */
    maxInteractionsPerHour: 20,
    /** 同城定位半径(km) */
    lbsRadius: 50,
  },

  /** 私域转化配置 */
  privateDomain: {
    /** 客户分层阈值 */
    tiers: {
      A: { name: '高价值客户', minSpend: 5000, revisitDays: 14 },
      B: { name: '潜力客户', minSpend: 1000, revisitDays: 30 },
      C: { name: '普通客户', minSpend: 0, revisitDays: 60 },
      D: { name: '沉默客户', minSpend: 0, revisitDays: 999 },
    },
    /** 沉默客户定义：超过N天未消费 */
    silenceThresholdDays: 90,
    /** 复购提醒：消费后N天 */
    repurchaseReminderDays: [21, 28, 35],
  },

  /** 日志 */
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  /** Cron 定时任务配置 */
  cron: {
    /** 内容定时发布 (每天多个时段) */
    publish: '0 9,12,15,18,21 * * *',
    /** 截流监控 (每5分钟) */
    interception: '*/5 * * * *',
    /** 数据报表生成 (每天凌晨2点) */
    report: '0 2 * * *',
    /** 沉默客户激活检查 (每周一上午10点) */
    reactivation: '0 10 * * 1',
  },

  /** AI智能体配置 */
  agents: {
    /** 是否启用AI智能体编排 */
    enabled: true,
    /** 体质辨证师配置 */
    tizhi: {
      enabled: true,
      // 默认跟随全局文本模型（硅基流动 Qwen2.5-7B，免费可用），可用 env 覆盖
      model: process.env.AGENT_TIZHI_MODEL || process.env.AI_MODEL_TEXT || 'Qwen/Qwen2.5-7B-Instruct',
    },
    /** 内容总监配置 */
    content: {
      enabled: true,
      /** 每日生成内容计划 */
      dailyPlan: {
        douyin: 3,
        xiaohongshu: 2,
        weixin: 1,
        kuaishou: 1,
        bilibili: 1,
        baijiahao: 1,
      },
      cron: '0 7 * * *',
    },
    /** 截流获客官配置 */
    interception: {
      enabled: true,
      cron: '*/15 * * * *',
      /** 监控同行账号列表（宜昌/全国中医芳疗/美容/美体/养生） */
      competitors: [
        '宜昌美容', '宜昌养生', '宜昌推拿', '中医芳疗', '精油按摩',
        '宜昌SPA', '湖北美容', '中医美容', '美体塑形', '养生馆',
      ],
    },
    /** 私域管家配置 */
    followup: {
      enabled: true,
      cron: '0 */4 * * *',
    },
    /** BI分析师配置 */
    analytics: {
      enabled: true,
      cron: '0 6 * * *',
    },
    /** 视频工厂配置 */
    video: {
      enabled: true,
      cron: '0 8 * * *',
    },
    /** 搜索占位官配置 */
    geo: {
      enabled: true,
      cron: '0 6 * * *',
    },
    /** ERP管家配置 */
    erp: {
      enabled: true,
      cron: '0 3 * * *',
    },
    /** 分销管家配置 */
    distribution: {
      enabled: true,
      cron: '0 1 * * *',
    },
  },

  /** 分销链动2+1配置 */
  distribution: {
    enabled: true,
    /** 佣金比例配置 */
    commissionRates: {
      level1: 0.15,   // 直推佣金比例
      level2: 0.05,   // 间推佣金比例
    },
    /** 链动规则：每个分销员最多拿2级佣金 */
    maxLevels: 2,
    /** 出局规则：推荐满2人后，第3人开始上级出局 */
    exitRule: {
      directRequired: 2,   // 直推满2人
      placeTo: 'grandparent', // 第3人及以后放爷爷节点下面
    },
    /** 最低提现金额 */
    minWithdraw: 100,
  },

  /** 积分系统配置 */
  points: {
    enabled: true,
    /** 消费积分比例：每消费1元得1积分 */
    earnRate: 1,
    /** 积分兑换比例：100积分=1元 */
    redeemRate: 100,
    /** 美业币与积分关系：10积分=1美业币 */
    beautycoinRate: 10,
    /** 签到积分 */
    signInPoints: 5,
    /** 推荐新客户积分 */
    referralPoints: 50,
    /** 积分有效期(天) */
    expireDays: 365,
  },

  /** 金融创新配置 */
  finance: {
    enabled: true,
    /** 分期付款默认配置 */
    installment: {
      enabled: true,
      periods: [3, 6, 12],   // 可选期数
      rate: 0.008,           // 月费率
    },
    /** 先享后付配置 */
    bnpl: {
      enabled: true,
      graceDays: 30,         // 免息天数
      penaltyRate: 0.0005,   // 逾期日罚息
    },
    /** 异业联盟配置 */
    alliance: {
      enabled: true,
      partners: ['insurance', 'mobile', 'travel'],
    },
  },

  /** 视频处理配置 */
  video: {
    enabled: true,
    /** FFmpeg路径 */
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    /** 默认视频模板 */
    templates: {
      xiaohongshu: { duration: 60, ratio: '3:4', music: '舒缓' },
      douyin: { duration: 30, ratio: '9:16', music: '动感' },
      bilibili: { duration: 180, ratio: '16:9', music: '知识' },
    },
    /** TTS配音语言 */
    ttsLang: 'zh-CN',
  },

  /** 预测分析配置 */
  prediction: {
    enabled: true,
    /** 流失预测阈值 */
    churn: {
      silenceDays: 60,        // 超过60天未活跃判定为流失风险
      minInteractions: 3,     // 最少互动次数
    },
    /** 销售预测 */
    sales: {
      historyDays: 90,        // 历史数据天数
      forecastDays: 30,       // 预测天数
    },
  },
};

export default config;
