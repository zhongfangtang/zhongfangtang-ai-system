/**
 * ERP管家·小芳同步 (ErpAgent)
 *
 * 包装IntegrationService，实现ERP/收银系统数据双向同步。
 * 客户数据、订单数据、财务数据实时同步，保证数据闭环。
 *
 * @module agents/ErpAgent
 */

import AgentBase from './base/AgentBase.js';
import integrationService from '../services/IntegrationService.js';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('ErpAgent');

export default class ErpAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'erp-agent',
      name: 'ERP管家·小芳同步',
      trigger: 'event',
      model: config.ai.models.text,
      knowledgeBase: 'operations-kb',
    });
    this.service = integrationService;
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 执行ERP同步（事件驱动/定时）
   * @param {Object} input - { direction?, full? }
   */
  async execute(input = {}) {
    if (!config.erp.enabled) {
      return { success: true, degraded: true, data: { message: 'ERP未配置，跳过同步' } };
    }

    const direction = input.direction || 'from_erp';
    let result;
    if (direction === 'from_erp') {
      result = await this.service.syncFromERP({ full: input.full || false });
    } else {
      result = await this.service.pushCustomerToWework(input.customerId);
    }

    logger.info(`ERP同步完成: ${direction}`);
    return { success: true, data: result };
  }

  /**
   * 降级逻辑
   */
  async fallback(input = {}) {
    logger.info('ERP Agent降级：ERP未配置');
    return { success: true, degraded: true, data: { skipped: true, reason: 'ERP未配置' } };
  }

  /**
   * 拉取腕家H1健康数据
   */
  async pullHealthData(customerId) {
    if (!config.wanjiH1.enabled) {
      return { success: false, skipped: true };
    }
    return this.service.pullWanjiH1(customerId);
  }
}
