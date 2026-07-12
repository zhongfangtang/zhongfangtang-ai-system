/**
 * 数据服务层 - DatabaseService
 *
 * MongoDB/Mongoose 连接管理和所有数据模型定义。
 *
 * @module services/DatabaseService
 */

import mongoose from 'mongoose';
import config from '../../config/default.js';
import logger from '../utils/logger.js';

// ==================== 数据库连接 ====================

/**
 * 连接 MongoDB 数据库
 *
 * @returns {Promise<void>}
 */
export async function connectDatabase() {
  try {
    await mongoose.connect(config.database.uri, {
      maxPoolSize: config.database.options.maxPoolSize,
      serverSelectionTimeoutMS: config.database.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.database.options.socketTimeoutMS,
      ...(config.database.options.user ? {
        user: config.database.options.user,
        pass: config.database.options.pass,
      } : {}),
    });

    logger.info('MongoDB 连接成功', { module: 'database' });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB 连接错误', { module: 'database', error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 连接断开', { module: 'database' });
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB 重新连接', { module: 'database' });
    });
  } catch (err) {
    logger.error('MongoDB 连接失败', { module: 'database', error: err.message });
    throw err;
  }
}

// ==================== 数据模型 ====================

/**
 * 内容库模型
 * 存储待发布和已发布的内容
 */
const contentSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true },
  platform: { type: String, enum: ['douyin', 'xiaohongshu', 'weixin', 'kuaishou', 'bilibili', 'baijiahao'] },
  type: { type: String, enum: ['article', 'video', 'image_text', 'poster'] },
  images: [{ type: String }],
  videoUrl: { type: String },
  tags: [{ type: String }],
  hashtags: [{ type: String }],
  status: { type: String, enum: ['draft', 'pending', 'published', 'failed', 'archived'], default: 'draft' },
  category: { type: String },
  constitution: { type: String },
  products: [{ type: String }],
  aiGenerated: { type: Boolean, default: false },
  generatedBy: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Content = mongoose.model('Content', contentSchema);

/**
 * 发布记录模型
 * 记录每次发布的详情和状态
 */
const publishRecordSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  platform: { type: String, required: true },
  accountId: { type: String, required: true },
  title: { type: String },
  content: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected', 'publishing', 'success', 'failed', 'retrying'] },
  platformPostId: { type: String },
  auditResult: { type: mongoose.Schema.Types.Mixed },
  result: { type: mongoose.Schema.Types.Mixed },
  errorMessage: { type: String },
  retryCount: { type: Number, default: 0 },
  duration: { type: Number },
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const PublishRecord = mongoose.model('PublishRecord', publishRecordSchema);

/**
 * 截流线索模型
 * 记录从各平台捕获的潜在客户线索
 */
const interceptionLeadSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  authorId: { type: String },
  authorName: { type: String },
  location: { type: String },
  source: { type: String, enum: ['comment', 'question', 'dm', 'post'] },
  content: { type: String, required: true },
  matchedKeywords: [{ type: String }],
  intentScore: { type: Number, min: 0, max: 100 },
  isHighPotential: { type: Boolean, default: false },
  replyTemplate: { type: String },
  status: { type: String, enum: ['new', 'contacted', 'converted', 'lost'], default: 'new' },
  note: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

interceptionLeadSchema.index({ platform: 1, createdAt: -1 });
interceptionLeadSchema.index({ isHighPotential: 1 });
interceptionLeadSchema.index({ status: 1 });

export const InterceptionLead = mongoose.model('InterceptionLead', interceptionLeadSchema);

/**
 * 客户档案模型
 * 私域客户完整信息
 */
const customerSchema = new mongoose.Schema({
  source: { type: String },
  externalId: { type: String },
  nickname: { type: String },
  phone: { type: String },
  avatar: { type: String },
  gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  birthday: { type: Date },
  tags: [{ type: String }],
  tier: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'C' },
  status: { type: String, enum: ['new', 'active', 'silent', 'churned'], default: 'new' },
  totalSpend: { type: Number, default: 0 },
  visitCount: { type: Number, default: 0 },
  activationAttempts: { type: Number, default: 0 },
  constitution: { type: String },
  skinType: { type: String },
  concerns: [{ type: String }],
  notes: { type: String },
  /** 腕家H1等健康设备同步数据 */
  healthMetrics: { type: mongoose.Schema.Types.Mixed },
  importedAt: { type: Date },
  lastActiveAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

customerSchema.index({ tier: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ source: 1, externalId: 1 });

export const Customer = mongoose.model('Customer', customerSchema);

/**
 * 客户互动记录模型
 */
const customerInteractionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['import', 'welcome', 'tier_change', 'upsell', 'repurchase_reminder', 'membership_reminder', 'manual', 'other'] },
  content: { type: String },
  channel: { type: String, default: 'wework' },
  operatorId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

customerInteractionSchema.index({ customerId: 1, createdAt: -1 });

export const CustomerInteraction = mongoose.model('CustomerInteraction', customerInteractionSchema);

/**
 * 订单模型
 */
const orderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String },
  serviceType: { type: String },
  items: [{ name: String, price: Number, quantity: Number }],
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  paidAmount: { type: Number },
  paymentMethod: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'completed', 'cancelled', 'refunded'], default: 'pending' },
  source: { type: String, enum: ['pos', 'miniprogram', 'manual', 'sync'] },
  staffId: { type: String },
  staffName: { type: String },
  appointmentTime: { type: Date },
  completedAt: { type: Date },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model('Order', orderSchema);

/**
 * 平台账号模型
 * 管理各平台授权的账号
 */
const platformAccountSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  accountName: { type: String, required: true },
  accountId: { type: String },
  avatar: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  status: { type: String, enum: ['active', 'expired', 'revoked'], default: 'active' },
  dailyLimit: { type: Number, default: 5 },
  publishMode: { type: String, enum: ['full-auto', 'semi-auto'], default: 'semi-auto' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const PlatformAccount = mongoose.model('PlatformAccount', platformAccountSchema);

/**
 * 数据同步日志模型
 */
const syncLogSchema = new mongoose.Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String, enum: ['customer', 'order', 'product', 'inventory'] },
  status: { type: String, enum: ['running', 'success', 'failed'] },
  recordsProcessed: { type: Number, default: 0 },
  recordsFailed: { type: Number, default: 0 },
  errorMessage: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const SyncLog = mongoose.model('SyncLog', syncLogSchema);

/**
 * 数据分析报表模型
 */
const reportSchema = new mongoose.Schema({
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  period: { type: String, required: true },
  data: {
    contentStats: { type: mongoose.Schema.Types.Mixed },
    interceptionStats: { type: mongoose.Schema.Types.Mixed },
    conversionStats: { type: mongoose.Schema.Types.Mixed },
    customerStats: { type: mongoose.Schema.Types.Mixed },
    revenueStats: { type: mongoose.Schema.Types.Mixed },
    platformBreakdown: [{ type: mongoose.Schema.Types.Mixed }],
  },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ type: 1, period: 1 }, { unique: true });

export const Report = mongoose.model('Report', reportSchema);

/**
 * 分销关系模型（链动2+1）
 * userId 唯一，parentId 指向推荐人，level 表示层级
 */
const distributionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },       // 分销员ID
  userName: { type: String },
  parentId: { type: String },                                   // 上级分销员ID(链动2+1)
  level: { type: Number, default: 0 },                          // 分销层级(0-2)
  status: { type: String, enum: ['active', 'frozen', 'banned'], default: 'active' },
  totalCommission: { type: Number, default: 0 },                // 累计佣金
  availableCommission: { type: Number, default: 0 },            // 可提现佣金
  teamSize: { type: Number, default: 0 },                       // 团队人数
  directCount: { type: Number, default: 0 },                    // 直推人数
  createdAt: { type: Date, default: Date.now },
});

distributionSchema.index({ parentId: 1 });
distributionSchema.index({ level: 1 });

export const Distribution = mongoose.model('Distribution', distributionSchema);

/**
 * 佣金记录模型
 */
const commissionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  distributorId: { type: String, required: true },
  fromUserId: { type: String },                                  // 来源用户
  fromUserName: { type: String },
  level: { type: Number },                                       // 佣金层级(1直推/2间推)
  amount: { type: Number, required: true },
  rate: { type: Number },                                        // 佣金比例
  status: { type: String, enum: ['pending', 'settled', 'withdrawn'], default: 'pending' },
  settledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

commissionSchema.index({ distributorId: 1, status: 1 });

export const Commission = mongoose.model('Commission', commissionSchema);

/**
 * 积分记录模型
 */
const pointsRecordSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
  type: { type: String, enum: ['earn', 'spend', 'expire', 'adjust'] },
  amount: { type: Number, required: true },
  balance: { type: Number },
  source: { type: String },                                      // 来源(消费/签到/推荐/活动)
  reference: { type: String },                                   // 关联订单/活动ID
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

pointsRecordSchema.index({ customerId: 1, createdAt: -1 });

export const PointsRecord = mongoose.model('PointsRecord', pointsRecordSchema);

/**
 * 积分商品模型（积分商城）
 */
const pointsProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['service', 'product', 'coupon', 'beautycoin'] },
  points: { type: Number, required: true },
  stock: { type: Number, default: -1 },                          // -1无限
  image: { type: String },
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

export const PointsProduct = mongoose.model('PointsProduct', pointsProductSchema);

/**
 * 金融方案模型（分期/先享后付/保险/联盟）
 */
const financePlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['installment', 'bnpl', 'insurance', 'alliance'] },
  provider: { type: String },                                    // 提供方
  config: { type: mongoose.Schema.Types.Mixed },                 // 配置(期数/费率等)
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

export const FinancePlan = mongoose.model('FinancePlan', financePlanSchema);

/**
 * 金融申请模型
 */
const financeApplicationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinancePlan' },
  planName: { type: String },
  amount: { type: Number, required: true },
  periods: { type: Number },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'overdue'], default: 'pending' },
  result: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

financeApplicationSchema.index({ customerId: 1, status: 1 });

export const FinanceApplication = mongoose.model('FinanceApplication', financeApplicationSchema);

/**
 * 视频制作任务模型
 */
const videoTaskSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  title: { type: String },
  script: { type: mongoose.Schema.Types.Mixed },                 // 分镜脚本
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'reviewing'], default: 'pending' },
  progress: { type: Number, default: 0 },
  outputUrl: { type: String },                                   // 成品视频URL
  platforms: [{ type: String }],                                 // 目标平台
  subtitles: { type: mongoose.Schema.Types.Mixed },             // 字幕数据
  audio: { type: String },                                       // 配音文件
  duration: { type: Number },                                    // 时长(秒)
  template: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

videoTaskSchema.index({ status: 1, createdAt: -1 });

export const VideoTask = mongoose.model('VideoTask', videoTaskSchema);

/**
 * 链上交易记录模型
 */
const web3TransactionSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  type: { type: String, enum: ['notarize', 'points', 'beautycoin', 'nft'] },
  txHash: { type: String },
  network: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  payload: { type: mongoose.Schema.Types.Mixed },
  blockNumber: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

web3TransactionSchema.index({ type: 1, createdAt: -1 });

export const Web3Transaction = mongoose.model('Web3Transaction', web3TransactionSchema);

/**
 * 异业联盟伙伴模型
 */
const alliancePartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: { type: String, enum: ['insurance', 'mobile', 'travel', 'other'] },
  contactInfo: { type: mongoose.Schema.Types.Mixed },
  agreement: { type: mongoose.Schema.Types.Mixed },              // 合作协议
  coMarketing: { type: mongoose.Schema.Types.Mixed },           // 联合营销活动
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

export const AlliancePartner = mongoose.model('AlliancePartner', alliancePartnerSchema);

/**
 * Agent运行日志模型
 */
const agentRunLogSchema = new mongoose.Schema({
  agentId: { type: String, required: true },
  agentName: { type: String },
  trigger: { type: String },
  input: { type: mongoose.Schema.Types.Mixed },
  output: { type: mongoose.Schema.Types.Mixed },
  duration: { type: Number },
  status: { type: String, enum: ['success', 'failed', 'degraded'] },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
});

agentRunLogSchema.index({ agentId: 1, createdAt: -1 });

export const AgentRunLog = mongoose.model('AgentRunLog', agentRunLogSchema);

/**
 * 预测结果模型
 */
const predictionResultSchema = new mongoose.Schema({
  type: { type: String, enum: ['churn', 'sales', 'revenue'] },
  period: { type: String },                                      // 预测周期
  target: { type: String },                                      // 预测目标
  result: { type: mongoose.Schema.Types.Mixed },
  confidence: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

predictionResultSchema.index({ type: 1, createdAt: -1 });

export const PredictionResult = mongoose.model('PredictionResult', predictionResultSchema);

export default {
  connectDatabase,
  Content,
  PublishRecord,
  InterceptionLead,
  Customer,
  CustomerInteraction,
  Order,
  PlatformAccount,
  SyncLog,
  Report,
  Distribution,
  Commission,
  PointsRecord,
  PointsProduct,
  FinancePlan,
  FinanceApplication,
  VideoTask,
  Web3Transaction,
  AlliancePartner,
  AgentRunLog,
  PredictionResult,
};
