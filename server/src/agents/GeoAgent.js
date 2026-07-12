/**
 * 搜索占位官·小芳SEO (GeoAgent)
 *
 * 包装GEOEngine引擎，实现GEO搜索占位优化。
 * 生成关键词矩阵、优化内容、监控搜索排名、生成FAQ问答库。
 *
 * @module agents/GeoAgent
 */

import AgentBase from './base/AgentBase.js';
import GEOEngine from '../engines/GEOEngine.js';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('GeoAgent');

export default class GeoAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'geo-agent',
      name: '搜索占位官·小芳SEO',
      trigger: 'scheduled',
      model: config.ai.models.text,
      knowledgeBase: 'geo-kb',
    });
    this.engine = new GEOEngine({ brand: '中芳堂', city: '宜昌' });
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 执行GEO优化（定时触发）
   * @param {Object} input - { theme?, platform? }
   */
  async execute(input = {}) {
    const theme = input.theme || '中芳堂中医芳香疗法宜昌';
    const platform = input.platform || 'xiaohongshu';

    // 生成关键词矩阵
    const matrix = this.engine.generateKeywordMatrix(theme, platform);

    // 生成FAQ问答库
    const faq = this.engine.generateFAQBase(theme);

    // 平台策略
    const strategy = this.engine.getPlatformStrategy(platform);

    logger.info(`GEO优化完成: ${theme} @ ${platform}`);
    return {
      success: true,
      data: {
        theme,
        platform,
        keywordMatrix: matrix.success ? matrix.data : null,
        faqCount: faq.success ? (faq.data?.faqs?.length || 0) : 0,
        strategy: strategy.success ? strategy.data : null,
      },
    };
  }

  /**
   * 降级逻辑
   */
  async fallback(input = {}) {
    logger.info('GEO Agent降级：使用内置知识库');
    return this.execute(input);
  }

  /**
   * 优化内容（供其他Agent调用）
   */
  optimizeContent(content, keywords) {
    return this.engine.optimizeContentForGEO(content, keywords);
  }
}
