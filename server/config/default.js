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
};

export default config;
