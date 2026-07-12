/**
 * 截流获客官·小芳获客 (InterceptionAgent)
 *
 * 包装InterceptionEngine引擎，实现全域截流获客。
 * 监控自有平台留言 + 同城/全国同行评论区，识别意向用户，
 * 通过合规软性种草话术自动互动，不违反平台规定。
 *
 * @module agents/InterceptionAgent
 */

import AgentBase from './base/AgentBase.js';
import InterceptionEngine from '../engines/InterceptionEngine.js';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('InterceptionAgent');

export default class InterceptionAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'interception-agent',
      name: '截流获客官·小芳获客',
      trigger: 'scheduled',
      model: config.ai.models.text,
      knowledgeBase: 'interception-kb',
    });
    this.engine = new InterceptionEngine();
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 执行截流扫描（定时触发）
   * @param {Object} input - { platform?, contents?, batch? }
   */
  async execute(input = {}) {
    // 如果有外部传入的内容（模拟平台抓取）
    if (input.contents && Array.isArray(input.contents)) {
      const results = [];
      for (const c of input.contents) {
        const r = await this.engine.scanContent(c.platform, c);
        results.push(r);
      }
      return { success: true, data: { scanned: results.length, results } };
    }

    // 定时扫描模式：返回监控状态（实际抓取需要平台API）
    const competitors = config.agents.interception.competitors;
    const status = await this._checkMonitorStatus();

    logger.info(`截流监控检查完成，监控同行账号 ${competitors.length} 个`);
    return {
      success: true,
      data: {
        monitoring: true,
        competitors: competitors.length,
        status,
        hint: '实际内容抓取需要配置各平台API，当前为框架模式',
      },
    };
  }

  /**
   * 检查监控状态
   */
  async _checkMonitorStatus() {
    const platforms = ['douyin', 'xiaohongshu', 'weixin', 'kuaishou', 'bilibili'];
    const status = {};
    for (const p of platforms) {
      const r = await this.engine.startMonitoring(p);
      status[p] = r.success ? 'active' : 'error';
    }
    return status;
  }

  /**
   * 降级逻辑：监控状态检查不依赖AI
   */
  async fallback(input = {}) {
    logger.info('截流Agent降级：仅做状态检查和内容扫描');
    if (input.contents) {
      return this.execute(input);
    }
    return {
      success: true,
      data: { monitoring: true, mode: 'degraded', message: '框架模式运行' },
    };
  }

  /**
   * 手动扫描单条内容（供运营后台调用）
   */
  async scanOne(platform, content) {
    return this.engine.scanContent(platform, content);
  }
}
