/**
 * 数字人主播·小芳 (DigitalHumanAgent)
 *
 * 7×24小时AI数字人直播。自动生成直播脚本 → 数字人播报 →
 * 弹幕互动截流 → 引导私域转化。
 *
 * @module agents/DigitalHumanAgent
 */

import AgentBase from './base/AgentBase.js';
import DigitalHumanEngine from '../engines/DigitalHumanEngine.js';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('DigitalHumanAgent');

export default class DigitalHumanAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'digital-human-agent',
      name: '数字人主播·小芳',
      trigger: 'event',
      model: config.ai.models.text,
      knowledgeBase: 'content-kb',
    });
    this.engine = new DigitalHumanEngine();
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 启动数字人直播
   * @param {Object} input - { duration, products, platform }
   */
  async execute(input = {}) {
    const options = {
      duration: input.duration || 120,
      products: input.products || ['九体辨识复方精油', '腕家H1健康手表', '精油SPA套餐'],
      constitution: input.constitution || '气虚质',
    };

    // 设置截流Agent
    if (this.interceptionAgent) {
      this.engine.setInterceptionAgent(this.interceptionAgent);
    }

    const result = await this.engine.startLive(options);
    logger.info(`数字人直播启动: ${options.duration}分钟`);

    return {
      success: true,
      data: {
        ...result.data,
        message: '数字人"小芳"已开始直播',
      },
    };
  }

  /**
   * 停止直播
   */
  async stopLive() {
    return this.engine.stopLive();
  }

  /**
   * 获取直播状态
   */
  getLiveStatus() {
    return this.engine.getLiveStatus();
  }

  /**
   * 处理弹幕
   */
  async handleComment(comment) {
    return this.engine.handleComment(comment);
  }

  /**
   * 降级逻辑
   */
  async fallback(input = {}) {
    logger.info('数字人Agent降级：使用预置脚本');
    return this.execute(input);
  }
}
