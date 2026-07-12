/**
 * 内容总监·小芳创作 (ContentAgent)
 *
 * 包装ContentGenerator引擎，实现定时内容生产。根据每日内容计划，
 * 自动生成各平台差异化内容，经过合规清洗后存入内容库，进入发布队列。
 *
 * @module agents/ContentAgent
 */

import AgentBase from './base/AgentBase.js';
import ContentGenerator from '../engines/ContentGenerator.js';
import config from '../../config/default.js';
import { Content } from '../services/DatabaseService.js';
import complianceService from '../services/ComplianceService.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('ContentAgent');

const PLATFORMS = ['douyin', 'xiaohongshu', 'weixin', 'kuaishou', 'bilibili', 'baijiahao'];
const CONSTITUTIONS = ['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'];
const TOPICS = [
  '九体辨识精油居家调理', '节气养生芳香疗法', '面部拨筋抗衰', '肩颈疏通精油按摩',
  '精油SPA放松身心', '中医体质调理方案', '居家芳疗小妙招', '宜昌到店体验',
];

export default class ContentAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'content-agent',
      name: '内容总监·小芳创作',
      trigger: 'scheduled',
      model: config.ai.models.text,
      knowledgeBase: 'content-kb',
    });
    this.generator = new ContentGenerator();
    this.canUseAI = Boolean(config.ai.apiKey);
  }

  /**
   * 执行内容生产（定时触发）
   * @param {Object} input - { dailyPlan?, platforms?, count? }
   */
  async execute(input = {}) {
    const plan = input.dailyPlan || config.agents.content.dailyPlan;
    const results = [];

    for (const [platform, count] of Object.entries(plan)) {
      for (let i = 0; i < count; i++) {
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        const constitution = CONSTITUTIONS[Math.floor(Math.random() * CONSTITUTIONS.length)];
        try {
          const result = await this._generateOne({ platform, topic, constitution });
          results.push(result);
        } catch (err) {
          logger.warn(`内容生成失败: ${platform}/${topic}`, { error: err.message });
        }
      }
    }

    logger.info(`内容生产完成，共生成 ${results.length} 条`);
    return {
      success: true,
      data: { generated: results.length, items: results },
    };
  }

  /**
   * 生成单条内容
   */
  async _generateOne({ platform, topic, constitution }) {
    // 调用ContentGenerator生成
    const generated = await this.generator.generateCopywriting({
      platform,
      topic,
      constitution,
      tone: '专业温暖',
    });

    if (!generated.success) {
      throw new Error(generated.message || '生成失败');
    }

    // 合规清洗
    const data = generated.data;
    const cleaned = complianceService.sanitizeFields({
      title: data.title,
      body: data.body,
      hashtags: data.hashtags,
    });

    // 存入内容库
    const doc = await Content.create({
      title: cleaned.title,
      body: cleaned.body,
      platform,
      type: platform === 'douyin' || platform === 'kuaishou' ? 'video' : 'article',
      hashtags: cleaned.hashtags,
      constitution,
      products: data.products || [],
      aiGenerated: this.canUseAI,
      status: 'draft',
      generatedBy: this.name,
      metadata: { keyPoints: data.keyPoints || [] },
    });

    return { id: doc._id, platform, title: cleaned.title, aiGenerated: this.canUseAI };
  }

  /**
   * 降级逻辑：无AI时仍走知识库组合生成
   */
  async fallback(input = {}) {
    logger.info('内容生产降级模式：使用知识库组合生成');
    return this.execute(input);
  }

  /**
   * 手动触发单条生成
   */
  async generateSingle({ platform, constitution, topic, type }) {
    return this._generateOne({
      platform: platform || 'xiaohongshu',
      topic: topic || '九体辨识精油调理',
      constitution: constitution || '平和质',
      type: type || 'article',
    });
  }
}
