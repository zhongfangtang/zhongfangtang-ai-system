/**
 * 分销管家·小芳裂变 (DistributionAgent)
 *
 * 管理分销链动2+1模式。自动确定分销关系、计算佣金、结算提现。
 * 链动规则：每个分销员直接推荐满2人后，第3人及以后放到上级（爷爷节点）下面。
 *
 * @module agents/DistributionAgent
 */

import AgentBase from './base/AgentBase.js';
import config from '../../config/default.js';
import {
  Distribution, Commission, Customer, Order,
} from '../services/DatabaseService.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('DistributionAgent');

export default class DistributionAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'distribution-agent',
      name: '分销管家·小芳裂变',
      trigger: 'event',
      model: config.ai.models.text,
      knowledgeBase: 'operations-kb',
    });
    this.canUseAI = Boolean(config.ai.apiKey);
    this.rates = config.distribution.commissionRates;
  }

  /**
   * 执行分销结算（定时触发）
   * @param {Object} input - { action?, orderId? }
   */
  async execute(input = {}) {
    const action = input.action || 'settle';

    switch (action) {
      case 'settle':
        return this._settleCommissions();
      case 'bind':
        return this.bindRelation(input.userId, input.parentId, input.userName);
      case 'overview':
        return this.getOverview();
      default:
        return this._settleCommissions();
    }
  }

  /**
   * 绑定分销关系（链动2+1）
   * @param {string} userId - 新分销员ID
   * @param {string} parentId - 推荐人ID
   * @param {string} userName - 新分销员名称
   */
  async bindRelation(userId, parentId, userName) {
    // 检查是否已存在
    const existing = await Distribution.findOne({ userId });
    if (existing) {
      return { success: false, message: '分销关系已存在' };
    }

    let level = 0;
    let actualParent = parentId;

    if (parentId) {
      const parent = await Distribution.findOne({ userId: parentId });
      if (parent) {
        // 链动2+1：检查推荐人直推人数
        if (parent.directCount >= config.distribution.exitRule.directRequired) {
          // 推荐人已满2人，放到爷爷节点下面
          actualParent = parent.parentId || parentId;
          level = actualParent ? 2 : 1;
        } else {
          level = parent.level + 1;
        }
      }
    }

    const doc = await Distribution.create({
      userId,
      userName,
      parentId: actualParent,
      level,
      status: 'active',
    });

    // 更新推荐人直推数
    if (actualParent) {
      await Distribution.updateOne({ userId: actualParent }, { $inc: { directCount: 1, teamSize: 1 } });
    }

    logger.info(`分销关系绑定: ${userId} -> ${actualParent} (level ${level})`);
    return { success: true, data: doc };
  }

  /**
   * 结算佣金（基于已支付订单）
   */
  async _settleCommissions() {
    // 找未结算的订单
    const orders = await Order.find({
      status: { $in: ['paid', 'completed'] },
    }).sort({ createdAt: -1 }).limit(50);

    let settled = 0;
    for (const order of orders) {
      // 检查是否已结算过
      const existing = await Commission.findOne({ orderId: order._id });
      if (existing) continue;

      // 找订单关联客户的分销关系
      const customer = await Customer.findById(order.customerId);
      if (!customer || !customer.distributorId) continue;

      await this._calcCommission(order, customer.distributorId);
      settled++;
    }

    logger.info(`佣金结算完成: ${settled} 笔`);
    return { success: true, data: { settled } };
  }

  /**
   * 计算佣金（直推+间推）
   */
  async _calcCommission(order, distributorId) {
    const distributor = await Distribution.findOne({ userId: distributorId });
    if (!distributor) return;

    // 直推佣金
    const l1 = order.amount * this.rates.level1;
    await Commission.create({
      orderId: order._id,
      distributorId,
      fromUserId: order.customerId?.toString(),
      level: 1,
      amount: l1,
      rate: this.rates.level1,
      status: 'settled',
      settledAt: new Date(),
    });
    await Distribution.updateOne({ userId: distributorId }, { $inc: { totalCommission: l1, availableCommission: l1 } });

    // 间推佣金（如果有上级）
    if (distributor.parentId) {
      const parent = await Distribution.findOne({ userId: distributor.parentId });
      if (parent) {
        const l2 = order.amount * this.rates.level2;
        await Commission.create({
          orderId: order._id,
          distributorId: parent.userId,
          fromUserId: order.customerId?.toString(),
          level: 2,
          amount: l2,
          rate: this.rates.level2,
          status: 'settled',
          settledAt: new Date(),
        });
        await Distribution.updateOne({ userId: parent.userId }, { $inc: { totalCommission: l2, availableCommission: l2 } });
      }
    }
  }

  /**
   * 分销概览
   */
  async getOverview() {
    const [total, active, totalCommission] = await Promise.all([
      Distribution.countDocuments(),
      Distribution.countDocuments({ status: 'active' }),
      Distribution.aggregate([{ $group: { _id: null, total: { $sum: '$totalCommission' } } }]),
    ]);

    return {
      success: true,
      data: {
        totalDistributors: total,
        activeDistributors: active,
        totalCommission: totalCommission[0]?.total || 0,
      },
    };
  }

  /**
   * 降级逻辑
   */
  async fallback(input = {}) {
    logger.info('分销Agent降级：执行基础计算');
    return this.execute(input);
  }
}
