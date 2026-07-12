/**
 * BI分析师·小芳数据 (AnalyticsAgent)
 *
 * 数据聚合 + 报表生成 + 异常预警 + 策略建议。
 * 定时生成日报/周报/月报，发现异常指标主动预警。
 *
 * @module agents/AnalyticsAgent
 */

import AgentBase from './base/AgentBase.js';
import config from '../../config/default.js';
import {
  Content, PublishRecord, InterceptionLead, Customer, Order, Report,
} from '../services/DatabaseService.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('AnalyticsAgent');

export default class AnalyticsAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'analytics-agent',
      name: 'BI分析师·小芳数据',
      trigger: 'scheduled',
      model: config.ai.models.text,
      knowledgeBase: 'operations-kb',
    });
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 执行数据分析（定时触发）
   * @param {Object} input - { reportType?, period? }
   */
  async execute(input = {}) {
    const reportType = input.reportType || 'daily';
    const period = input.period || this._todayPeriod();

    const data = await this._aggregateData();
    const insights = this._generateInsights(data);

    // 保存报表
    let report;
    try {
      report = await Report.findOneAndUpdate(
        { type: reportType, period },
        { type: reportType, period, data, createdAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (err) {
      logger.warn('报表保存失败', { error: err.message });
    }

    logger.info(`分析报表生成完成: ${reportType}/${period}`);
    return {
      success: true,
      data: { reportType, period, metrics: data, insights },
    };
  }

  /**
   * 聚合全维度数据
   */
  async _aggregateData() {
    const [contentCount, publishedCount, leadsCount, highPotential, customers, orders, revenue] = await Promise.all([
      Content.countDocuments(),
      PublishRecord.countDocuments({ status: 'success' }),
      InterceptionLead.countDocuments(),
      InterceptionLead.countDocuments({ isHighPotential: true }),
      Customer.countDocuments(),
      Order.countDocuments({ status: { $in: ['paid', 'completed'] } }),
      Order.aggregate([{ $match: { status: { $in: ['paid', 'completed'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    return {
      contentStats: { total: contentCount, published: publishedCount },
      interceptionStats: { total: leadsCount, highPotential },
      customerStats: { total: customers },
      revenueStats: { orderCount: orders, totalRevenue: revenue[0]?.total || 0 },
      platformBreakdown: await this._platformBreakdown(),
    };
  }

  /**
   * 平台发布分布
   */
  async _platformBreakdown() {
    return PublishRecord.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]);
  }

  /**
   * 生成洞察建议
   */
  _generateInsights(data) {
    const insights = [];
    const { contentStats, interceptionStats, revenueStats } = data;

    if (contentStats.published < contentStats.total * 0.5) {
      insights.push('发布率偏低，建议检查平台账号授权状态');
    }
    if (interceptionStats.highPotential > 0) {
      insights.push(`有 ${interceptionStats.highPotential} 条高潜线索待跟进，建议优先处理`);
    }
    if (revenueStats.totalRevenue > 0) {
      insights.push(`当前营收 ¥${revenueStats.totalRevenue}，客户均额 ¥${(revenueStats.totalRevenue / Math.max(revenueStats.orderCount, 1)).toFixed(0)}`);
    }
    return insights;
  }

  /**
   * 降级逻辑
   */
  async fallback(input = {}) {
    logger.info('分析Agent降级：使用规则生成洞察');
    return this.execute(input);
  }

  _todayPeriod() {
    return new Date().toISOString().slice(0, 10);
  }
}
