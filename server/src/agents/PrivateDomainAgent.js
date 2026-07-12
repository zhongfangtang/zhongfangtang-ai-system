/**
 * 私域管家·小芳跟进 (PrivateDomainAgent)
 *
 * 包装PrivateDomainEngine引擎，实现私域全链路转化。
 * 自动追踪客户服务、成交、维护、复购，通过企业微信/社群/个人号触达。
 *
 * @module agents/PrivateDomainAgent
 */

import AgentBase from './base/AgentBase.js';
import PrivateDomainEngine from '../engines/PrivateDomainEngine.js';
import config from '../../config/default.js';
import { Customer } from '../services/DatabaseService.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('PrivateDomainAgent');

export default class PrivateDomainAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'followup-agent',
      name: '私域管家·小芳跟进',
      trigger: 'scheduled',
      model: config.ai.models.text,
      knowledgeBase: 'conversion-kb',
    });
    this.engine = new PrivateDomainEngine();
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 执行私域维护（定时触发）
   * @param {Object} input - { action?, customerId? }
   */
  async execute(input = {}) {
    const action = input.action || 'daily-maintain';

    switch (action) {
      case 'daily-maintain':
        return this._dailyMaintain();
      case 'activate-silent':
        return this.engine.activateSilentCustomers();
      case 'classify':
        return this._classifyAll();
      case 'repurchase-check':
        return this._repurchaseCheck();
      default:
        return this._dailyMaintain();
    }
  }

  /**
   * 每日维护：检查复购+激活沉默
   */
  async _dailyMaintain() {
    const results = {};

    // 复购提醒检查
    const customers = await Customer.find({
      status: { $in: ['new', 'active'] },
      lastActiveAt: { $gte: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
    }).limit(100);

    let repurchaseCount = 0;
    for (const c of customers) {
      const r = await this.engine.checkRepurchaseReminder(c._id);
      if (r.success && r.data?.shouldRemind) repurchaseCount++;
    }
    results.repurchaseReminders = repurchaseCount;

    // 沉默客户激活
    const activation = await this.engine.activateSilentCustomers();
    results.silentActivated = activation.success ? activation.data.activated : 0;

    logger.info(`私域每日维护完成`, results);
    return { success: true, data: results };
  }

  /**
   * 全量客户分层
   */
  async _classifyAll() {
    const customers = await Customer.find({}).limit(500);
    let classified = 0;
    for (const c of customers) {
      const r = await this.engine.classifyCustomer(c._id);
      if (r.success) classified++;
    }
    return { success: true, data: { classified } };
  }

  /**
   * 复购检查
   */
  async _repurchaseCheck() {
    const customers = await Customer.find({ status: { $in: ['new', 'active'] } }).limit(100);
    let reminded = 0;
    for (const c of customers) {
      const r = await this.engine.checkRepurchaseReminder(c._id);
      if (r.success && r.data?.shouldRemind) reminded++;
    }
    return { success: true, data: { reminded } };
  }

  /**
   * 降级逻辑：不依赖AI
   */
  async fallback(input = {}) {
    logger.info('私域Agent降级：执行基础维护逻辑');
    return this.execute(input);
  }

  /**
   * 手动导入用户到私域
   */
  async importUser(userInfo) {
    return this.engine.importUser(userInfo);
  }

  /**
   * 生成升单方案
   */
  async upsell(customerId) {
    return this.engine.generateUpsellPlan(customerId);
  }
}
