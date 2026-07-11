/**
 * 私域全链路转化引擎 - PrivateDomainEngine
 *
 * 负责公域流量导入私域后的全链路管理和转化。
 *
 * 功能：
 * - 公域流量自动导入企业微信/社群/个人号
 * - 用户标签分层（A/B/C/D四类）
 * - 自动欢迎话术、品牌介绍、项目科普
 * - 智能升单方案生成
 * - 会员权益提醒、储值活动触发
 * - 消费周期监测和复购提醒
 * - 沉默客户激活
 *
 * @module engines/PrivateDomainEngine
 */

import axios from 'axios';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';
import { Customer, CustomerInteraction, Order } from '../services/DatabaseService.js';

const logger = createModuleLogger('PrivateDomainEngine');

/** 客户分层定义 */
const CUSTOMER_TIERS = {
  A: { name: '高价值客户', minSpend: 5000, revisitDays: 14, color: '#FF4D4F' },
  B: { name: '潜力客户', minSpend: 1000, revisitDays: 30, color: '#FAAD14' },
  C: { name: '普通客户', minSpend: 0, revisitDays: 60, color: '#52C41A' },
  D: { name: '沉默客户', minSpend: 0, revisitDays: 999, color: '#D9D9D9' },
};

/** 沉默客户定义：超过90天未消费 */
const SILENCE_THRESHOLD_DAYS = config.privateDomain.silenceThresholdDays || 90;

/** 复购提醒时间点（消费后天数） */
const REPURCHASE_REMINDER_DAYS = config.privateDomain.repurchaseReminderDays || [21, 28, 35];

/** 自动欢迎话术 */
const WELCOME_MESSAGES = {
  new: [
    '欢迎加入中芳堂大家庭！🎉 我们专注中医芳疗，用千年智慧守护您的美丽与健康。',
    '初次见面，送您一份小礼物——免费九体辨识测评，了解自己的体质才能更好地调理哦～',
    '中芳堂位于宜昌，有任何美容养生问题都可以随时问我，我会为您提供专业建议 💚',
  ],
  reactivation: [
    '好久不见～中芳堂最近有新的调理项目上线，特意为您准备了专属优惠 🎁',
    '亲爱的，最近天气变化大，记得注意身体哦。中芳堂的换季调理套餐很适合现在～',
  ],
};

/** 品牌介绍 */
const BRAND_INTRO = `
🏠 中芳堂 · 中医芳香疗法
📍 湖北宜昌
🌿 专注领域：中医体质调理 | 精油芳疗 | 皮肤管理 | 经络养生
✨ 特色项目：九体辨识 | 精油SPA | 肩颈疏通 | 面部拨筋
📱 预约/咨询请私信
`;

/** 项目科普库 */
const SERVICE_KNOWLEDGE = {
  '九体辨识': {
    intro: '通过专业体质测评问卷+中医望闻问切，精准识别您的体质类型（平和质、气虚质、阳虚质等9种），'
      + '为后续调理方案提供科学依据。',
    duration: '约30分钟',
    price: '首次免费',
  },
  '精油SPA': {
    intro: '选用100%纯天然植物精油，结合中医经络理论，通过按摩手法使精油渗透肌肤，'
      + '达到身心放松、气血调和的效果。',
    duration: '60-90分钟',
    price: '298元起',
  },
  '肩颈疏通': {
    intro: '针对现代人久坐导致的肩颈僵硬、酸痛问题，运用精油推拿+刮痧+热敷综合疗法，'
      + '快速缓解不适，恢复肩颈灵活。',
    duration: '45分钟',
    price: '198元起',
  },
  '面部拨筋': {
    intro: '传承中医面部拨筋手法，配合精油导入，促进面部血液循环，改善暗沉、松弛、'
      + '细纹等问题，打造自然好气色。',
    duration: '60分钟',
    price: '268元起',
  },
};

export default class PrivateDomainEngine {
  constructor() {
    this.weworkAccessToken = null;
    this.weworkTokenExpiresAt = 0;

    logger.info('私域转化引擎已初始化', {
      silenceThreshold: SILENCE_THRESHOLD_DAYS,
      tiers: Object.keys(CUSTOMER_TIERS),
    });
  }

  /**
   * 导入公域用户到私域
   *
   * @param {Object} userInfo - 用户信息
   * @param {string} userInfo.source - 来源平台
   * @param {string} userInfo.externalId - 外部平台ID
   * @param {string} userInfo.nickname - 昵称
   * @param {string} [userInfo.phone] - 手机号
   * @param {string} [userInfo.avatar] - 头像
   * @param {string[]} [userInfo.tags] - 初始标签
   * @returns {Promise<Object>}
   */
  async importUser(userInfo) {
    const { source, externalId, nickname, phone, avatar, tags = [] } = userInfo;

    try {
      /** 检查是否已存在 */
      let customer = await Customer.findOne({
        $or: [
          { externalId, source },
          ...(phone ? [{ phone }] : []),
        ],
      });

      if (customer) {
        logger.info('用户已存在，更新信息', { nickname, source });
        customer.lastActiveAt = new Date();
        customer.tags = [...new Set([...customer.tags, ...tags])];
        await customer.save();
      } else {
        /** 创建新客户 */
        customer = await Customer.create({
          source,
          externalId,
          nickname,
          phone,
          avatar,
          tags: [...tags, `source:${source}`],
          tier: 'C',
          status: 'new',
          importedAt: new Date(),
          lastActiveAt: new Date(),
        });

        /** 记录互动 */
        await this._recordInteraction(customer._id, 'import', '用户导入私域');

        logger.info('新用户已导入私域', { nickname, source, customerId: customer._id });
      }

      /** 自动发送欢迎消息 */
      await this.sendWelcomeMessage(customer._id);

      return {
        success: true,
        data: {
          customerId: customer._id,
          isNew: !customer.importedAt,
          tier: customer.tier,
        },
        message: '用户导入成功',
      };
    } catch (err) {
      logger.error('用户导入失败', { error: err.message, nickname });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 发送自动欢迎消息
   *
   * @param {string} customerId - 客户ID
   * @param {string} [type='new'] - 消息类型(new/reactivation)
   * @returns {Promise<Object>}
   */
  async sendWelcomeMessage(customerId, type = 'new') {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return { success: false, data: null, message: '客户不存在' };
      }

      const messages = WELCOME_MESSAGES[type] || WELCOME_MESSAGES.new;

      /** 通过企业微信发送消息 */
      const sent = [];
      for (const msg of messages) {
        const result = await this._sendWeworkMessage(customer.externalId, msg);
        sent.push(result);
        /** 避免频率过高 */
        await new Promise((r) => setTimeout(r, 1000));
      }

      /** 发送品牌介绍 */
      await this._sendWeworkMessage(customer.externalId, BRAND_INTRO);

      /** 记录互动 */
      await this._recordInteraction(customerId, 'welcome', '发送欢迎消息');

      return {
        success: true,
        data: { sentCount: sent.length, type },
        message: '欢迎消息已发送',
      };
    } catch (err) {
      logger.error('发送欢迎消息失败', { error: err.message, customerId });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 客户分层
   *
   * @param {string} customerId - 客户ID
   * @returns {Promise<Object>} 分层结果
   */
  async classifyCustomer(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return { success: false, data: null, message: '客户不存在' };
      }

      /** 计算消费总额 */
      const orders = await Order.find({
        customerId,
        status: { $in: ['completed', 'paid'] },
      });

      const totalSpend = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const lastOrderDate = orders.length > 0
        ? Math.max(...orders.map((o) => new Date(o.createdAt).getTime()))
        : null;

      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24))
        : 999;

      /** 判定分层 */
      let newTier;
      if (daysSinceLastOrder > SILENCE_THRESHOLD_DAYS) {
        newTier = 'D';
      } else if (totalSpend >= CUSTOMER_TIERS.A.minSpend) {
        newTier = 'A';
      } else if (totalSpend >= CUSTOMER_TIERS.B.minSpend) {
        newTier = 'B';
      } else {
        newTier = 'C';
      }

      /** 更新客户分层 */
      if (customer.tier !== newTier) {
        const oldTier = customer.tier;
        customer.tier = newTier;
        customer.totalSpend = totalSpend;
        await customer.save();

        logger.info('客户分层已更新', {
          customerId,
          oldTier,
          newTier,
          totalSpend,
        });

        await this._recordInteraction(
          customerId,
          'tier_change',
          `分层变更: ${oldTier} → ${newTier}`,
        );
      }

      return {
        success: true,
        data: {
          customerId,
          tier: newTier,
          tierName: CUSTOMER_TIERS[newTier].name,
          totalSpend,
          daysSinceLastOrder,
          orderCount: orders.length,
        },
        message: '客户分层完成',
      };
    } catch (err) {
      logger.error('客户分层失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 生成智能升单方案
   *
   * @param {string} customerId - 客户ID
   * @returns {Promise<Object>}
   */
  async generateUpsellPlan(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return { success: false, data: null, message: '客户不存在' };
      }

      /** 获取消费历史 */
      const orders = await Order.find({
        customerId,
        status: { $in: ['completed', 'paid'] },
      }).sort({ createdAt: -1 }).limit(10);

      /** 分析消费偏好 */
      const serviceCount = {};
      for (const order of orders) {
        const service = order.serviceType || '其他';
        serviceCount[service] = (serviceCount[service] || 0) + 1;
      }

      const preferredService = Object.entries(serviceCount)
        .sort((a, b) => b[1] - a[1])[0];

      /** 根据分层和偏好生成升单方案 */
      const upsellPlans = {
        D: {
          strategy: '激活回流',
          plans: [
            { name: '体验回归套餐', price: 99, description: '精选3项经典项目体验，唤醒美丽记忆' },
          ],
        },
        C: {
          strategy: '提升频次',
          plans: [
            { name: '月度调理卡', price: 498, description: '每月4次精油SPA，持续改善体质' },
          ],
        },
        B: {
          strategy: '深化关系',
          plans: [
            { name: '季度尊享卡', price: 1980, description: '12次全面护理+专属体质跟踪' },
          ],
        },
        A: {
          strategy: '高价值维护',
          plans: [
            { name: '年度VIP', price: 6980, description: '全年无限次+私人定制+优先预约' },
          ],
        },
      };

      const plan = upsellPlans[customer.tier] || upsellPlans.C;

      await this._recordInteraction(
        customerId,
        'upsell',
        `生成升单方案: ${plan.strategy}`,
      );

      return {
        success: true,
        data: {
          customerId,
          tier: customer.tier,
          tierName: CUSTOMER_TIERS[customer.tier].name,
          preferredService: preferredService?.[0] || '无',
          upsellPlan: plan,
        },
        message: '升单方案生成成功',
      };
    } catch (err) {
      logger.error('生成升单方案失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 复购提醒检查
   *
   * @param {string} customerId - 客户ID
   * @returns {Promise<Object>}
   */
  async checkRepurchaseReminder(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return { success: false, data: null, message: '客户不存在' };
      }

      const lastOrder = await Order.findOne({
        customerId,
        status: { $in: ['completed', 'paid'] },
      }).sort({ createdAt: -1 });

      if (!lastOrder) {
        return { success: true, data: { shouldRemind: false, reason: '无消费记录' } };
      }

      const daysSinceOrder = Math.floor(
        (Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      /** 检查是否在提醒时间点 */
      const shouldRemind = REPURCHASE_REMINDER_DAYS.some(
        (day) => Math.abs(daysSinceOrder - day) <= 1,
      );

      if (shouldRemind) {
        await this.sendRepurchaseReminder(customerId, daysSinceOrder);
      }

      return {
        success: true,
        data: {
          shouldRemind,
          daysSinceOrder,
          lastOrderDate: lastOrder.createdAt,
          nextReminderDays: REPURCHASE_REMINDER_DAYS,
        },
      };
    } catch (err) {
      logger.error('复购提醒检查失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 发送复购提醒
   *
   * @param {string} customerId - 客户ID
   * @param {number} daysSinceOrder - 距上次消费天数
   * @returns {Promise<Object>}
   */
  async sendRepurchaseReminder(customerId, daysSinceOrder) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return { success: false, data: null, message: '客户不存在' };
      }

      const messages = [
        `距上次护理已过${daysSinceOrder}天啦～是时候给自己安排一次精油SPA放松一下了 💆‍♀️`,
        `亲爱的，上次的调理效果怎么样？建议${daysSinceOrder}天左右做一次巩固，效果更好哦～`,
      ];

      const msg = messages[Math.floor(Math.random() * messages.length)];
      await this._sendWeworkMessage(customer.externalId, msg);

      await this._recordInteraction(customerId, 'repurchase_reminder', `复购提醒(${daysSinceOrder}天)`);

      logger.info('复购提醒已发送', { customerId, daysSinceOrder });

      return { success: true, data: { customerId, daysSinceOrder }, message: '复购提醒已发送' };
    } catch (err) {
      logger.error('发送复购提醒失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 沉默客户激活
   *
   * @returns {Promise<Object>}
   */
  async activateSilentCustomers() {
    try {
      const thresholdDate = new Date(Date.now() - SILENCE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

      const silentCustomers = await Customer.find({
        tier: { $in: ['A', 'B', 'C'] },
        lastActiveAt: { $lt: thresholdDate },
        status: { $ne: 'churned' },
      }).limit(50);

      let activatedCount = 0;

      for (const customer of silentCustomers) {
        try {
          /** 发送激活消息 */
          await this.sendWelcomeMessage(customer._id, 'reactivation');

          /** 更新状态 */
          customer.lastActiveAt = new Date();
          customer.tier = 'D';
          customer.activationAttempts = (customer.activationAttempts || 0) + 1;

          if (customer.activationAttempts >= 3) {
            customer.status = 'churned';
            logger.info('客户已流失（激活3次无效）', { customerId: customer._id });
          }

          await customer.save();
          activatedCount++;

          /** 避免频繁发送 */
          await new Promise((r) => setTimeout(r, 2000));
        } catch (err) {
          logger.error('激活客户失败', { customerId: customer._id, error: err.message });
        }
      }

      logger.info('沉默客户激活完成', { total: silentCustomers.length, activated: activatedCount });

      return {
        success: true,
        data: { totalChecked: silentCustomers.length, activated: activatedCount },
        message: `已处理${silentCustomers.length}位沉默客户，激活${activatedCount}位`,
      };
    } catch (err) {
      logger.error('沉默客户激活失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 会员权益提醒
   *
   * @param {string} customerId - 客户ID
   * @returns {Promise<Object>}
   */
  async sendMembershipReminder(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return { success: false, data: null, message: '客户不存在' };
      }

      const tierInfo = CUSTOMER_TIERS[customer.tier] || CUSTOMER_TIERS.C;

      let message = `亲爱的${customer.nickname || '客户'}，您的会员等级：${tierInfo.name}\n\n`;

      /** 根据分层添加不同权益 */
      if (customer.tier === 'A') {
        message += '🎖 专属权益：\n'
          + '• 全年无限次预约优先\n'
          + '• 私人定制调理方案\n'
          + '• 生日当月免费护理1次\n'
          + '• 新品优先体验权\n'
          + '• 专属客户经理1对1服务';
      } else if (customer.tier === 'B') {
        message += '🌟 会员权益：\n'
          + '• 每月专属折扣日\n'
          + '• 生日当月8折优惠\n'
          + '• 积分翻倍日';
      } else {
        message += '💚 基础权益：\n'
          + '• 首次体质测评免费\n'
          + '• 消费积分兑换\n'
          + '• 每月优惠活动通知';
      }

      await this._sendWeworkMessage(customer.externalId, message);
      await this._recordInteraction(customerId, 'membership_reminder', '会员权益提醒');

      return { success: true, data: { tier: customer.tier }, message: '权益提醒已发送' };
    } catch (err) {
      logger.error('发送权益提醒失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 获取项目科普信息
   *
   * @param {string} serviceName - 服务名称
   * @returns {Object}
   */
  getServiceKnowledge(serviceName) {
    const knowledge = SERVICE_KNOWLEDGE[serviceName];
    if (!knowledge) {
      return { success: false, data: null, message: '未找到该项目信息' };
    }
    return { success: true, data: knowledge };
  }

  /**
   * 查询客户档案
   *
   * @param {string} customerId - 客户ID
   * @returns {Promise<Object>}
   */
  async getCustomerProfile(customerId) {
    try {
      const customer = await Customer.findById(customerId).lean();
      if (!customer) {
        return { success: false, data: null, message: '客户不存在' };
      }

      const interactions = await CustomerInteraction.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      const orders = await Order.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return {
        success: true,
        data: {
          ...customer,
          tierName: CUSTOMER_TIERS[customer.tier]?.name,
          recentInteractions: interactions,
          recentOrders: orders,
        },
      };
    } catch (err) {
      logger.error('查询客户档案失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 通过企业微信发送消息
   *
   * @param {string} externalUserId - 外部联系人ID
   * @param {string} message - 消息内容
   * @returns {Promise<Object>}
   */
  async _sendWeworkMessage(externalUserId, message) {
    try {
      const token = await this._getWeworkToken();

      const response = await axios.post(
        `${config.wework.apiBase}/externalcontact/message/send`,
        {
          touser: externalUserId,
          msgtype: 'text',
          agentid: config.wework.agentId,
          text: { content: message },
        },
        {
          params: { access_token: token },
          timeout: 10000,
        },
      );

      return { success: response.data?.errcode === 0, data: response.data };
    } catch (err) {
      logger.warn('企业微信消息发送失败', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  /**
   * 获取企业微信 Access Token
   *
   * @returns {Promise<string>}
   */
  async _getWeworkToken() {
    if (this.weworkAccessToken && Date.now() < this.weworkTokenExpiresAt) {
      return this.weworkAccessToken;
    }

    try {
      const response = await axios.get(
        `${config.wework.apiBase}/gettoken`,
        {
          params: {
            corpid: config.wework.corpId,
            corpsecret: config.wework.corpSecret,
          },
          timeout: 10000,
        },
      );

      this.weworkAccessToken = response.data?.access_token;
      this.weworkTokenExpiresAt = Date.now() + (response.data?.expires_in || 7200) * 1000 - 600000;

      return this.weworkAccessToken;
    } catch (err) {
      logger.error('获取企业微信Token失败', { error: err.message });
      throw err;
    }
  }

  /**
   * 记录客户互动
   *
   * @param {string} customerId - 客户ID
   * @param {string} type - 互动类型
   * @param {string} content - 互动内容
   * @returns {Promise<void>}
   */
  async _recordInteraction(customerId, type, content) {
    try {
      await CustomerInteraction.create({
        customerId,
        type,
        content,
        createdAt: new Date(),
      });

      await Customer.findByIdAndUpdate(customerId, {
        lastActiveAt: new Date(),
      });
    } catch (err) {
      logger.warn('记录互动失败', { error: err.message, customerId });
    }
  }
}

export { CUSTOMER_TIERS, SILENCE_THRESHOLD_DAYS, REPURCHASE_REMINDER_DAYS, SERVICE_KNOWLEDGE };
