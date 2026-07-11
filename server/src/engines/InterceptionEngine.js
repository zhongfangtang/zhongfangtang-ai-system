/**
 * 全域精准截流获客引擎 - InterceptionEngine
 *
 * 监控六大平台的评论区、问答区、私信区，
 * 通过关键词识别意向用户，自动触发合规互动话术。
 *
 * 功能：
 * - 六大平台评论/问答/私信区监控
 * - 关键词智能识别
 * - 同城+同行精准定位
 * - 自动触发合规互动话术（软性种草模式）
 * - 意向用户标记和高潜筛选
 * - 自定义截流关键词/屏蔽词库
 * - 互动频率控制和风控规避
 *
 * @module engines/InterceptionEngine
 */

import axios from 'axios';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';
import { InterceptionLead } from '../services/DatabaseService.js';

const logger = createModuleLogger('InterceptionEngine');

/** 默认截流关键词 */
const DEFAULT_KEYWORDS = {
  /** 养生类 */
  wellness: ['养生', '中医', '调理', '体质', '亚健康', '气血', '经络'],
  /** 护肤类 */
  skincare: ['护肤', '皮肤', '祛痘', '美白', '抗衰', '补水', '敏感肌', '痘痘'],
  /** 美体类 */
  bodycare: ['减肥', '瘦身', '塑形', '按摩', '肩颈', '腰酸', '背痛', '颈椎'],
  /** 情绪类 */
  emotion: ['焦虑', '失眠', '压力', '疲劳', '乏力', '没精神'],
  /** 消费意向 */
  intent: ['推荐', '哪里', '多少钱', '怎么样', '有效吗', '靠谱吗'],
};

/** 默认屏蔽关键词 */
const DEFAULT_BLOCKED_KEYWORDS = [
  '广告', '推销', '微商', '加微信', '扫码', '下载APP',
];

/** 合规互动话术模板 */
const REPLY_TEMPLATES = {
  /** 养生咨询 */
  wellness_ask: [
    '建议可以先了解一下自己的体质类型哦～中芳堂有免费的九体辨识测评，能帮你找到最适合的调理方式 🌿',
    '每个人的体质不同，调理方式也因人而异。建议做个专业体质测评，针对性调理效果更好 ✨',
  ],
  /** 护肤咨询 */
  skincare_ask: [
    '护肤最重要的是了解自己的肤质和体质内因。中芳堂结合中医体质辨识，从根源改善肌肤问题 💆‍♀️',
    '外用护肤品只能治标，内调外养才是关键。中医芳疗能帮你从体质入手，由内而外焕发光采 🌸',
  ],
  /** 肩颈疼痛 */
  bodycare_ask: [
    '长期久坐确实容易肩颈不适，精油推拿配合经络疏通效果很不错，可以来体验一下哦～',
    '肩颈问题不能忽视，中芳堂的精油肩颈SPA可以帮你深度放松，很多人做一次就感觉轻松多了 😊',
  ],
  /** 睡眠问题 */
  emotion_ask: [
    '失眠确实很困扰人，薰衣草精油配合头部按摩对改善睡眠很有帮助，建议来店里感受一下 🌙',
    '中医认为失眠多与心肾不交有关，中芳堂有专门的安神助眠调理方案，很多人反馈效果很好 💤',
  ],
  /** 通用回复 */
  general: [
    '中芳堂专注中医芳疗，在宜昌做了很多年了，口碑一直很好，有兴趣可以了解一下～',
    '每个人情况不同，建议到店做专业评估，中芳堂的体质测评和皮肤检测都是免费的哦 ❤️',
  ],
};

export default class InterceptionEngine {
  constructor() {
    this.keywords = { ...DEFAULT_KEYWORDS };
    this.blockedKeywords = [...DEFAULT_BLOCKED_KEYWORDS];
    this.replyTemplates = { ...REPLY_TEMPLATES };

    /** 互动频率控制 */
    this.interactionCount = 0;
    this.lastInteractionTime = 0;
    this.maxPerHour = config.interception.maxInteractionsPerHour;
    this.minInterval = config.interception.minInteractionInterval;

    /** 平台监控状态 */
    this.monitoringStatus = new Map();

    logger.info('截流获客引擎已初始化', {
      keywordsCount: this._countKeywords(),
      maxPerHour: this.maxPerHour,
    });
  }

  /**
   * 启动平台监控
   *
   * @param {string} platform - 平台名称
   * @param {Object} [options] - 监控选项
   * @returns {Promise<Object>}
   */
  async startMonitoring(platform, options = {}) {
    logger.info('启动平台监控', { platform });

    this.monitoringStatus.set(platform, {
      active: true,
      startedAt: new Date(),
      options,
    });

    return {
      success: true,
      data: { platform, status: 'active' },
      message: `${platform} 监控已启动`,
    };
  }

  /**
   * 停止平台监控
   *
   * @param {string} platform - 平台名称
   * @returns {Promise<Object>}
   */
  async stopMonitoring(platform) {
    this.monitoringStatus.set(platform, { active: false, stoppedAt: new Date() });
    logger.info('停止平台监控', { platform });

    return {
      success: true,
      data: { platform, status: 'stopped' },
      message: `${platform} 监控已停止`,
    };
  }

  /**
   * 扫描平台内容并识别截流机会
   *
   * @param {string} platform - 平台名称
   * @param {Object} content - 待扫描内容
   * @param {string} content.text - 文本内容
   * @param {string} content.authorId - 作者ID
   * @param {string} content.authorName - 作者昵称
   * @param {string} [content.location] - 作者位置
   * @param {string} content.source - 来源(comment/question/dm)
   * @returns {Promise<Object>} 分析结果
   */
  async scanContent(platform, content) {
    const { text, authorId, authorName, location, source } = content;

    /** 屏蔽词检查 */
    if (this._containsBlocked(text)) {
      return { success: true, data: { matched: false, reason: '包含屏蔽词' } };
    }

    /** 关键词匹配 */
    const matches = this._matchKeywords(text);

    if (matches.length === 0) {
      return { success: true, data: { matched: false, matches: [] } };
    }

    /** 计算意向分数 */
    const intentScore = this._calculateIntentScore(text, matches, location);

    /** 判断是否为高潜用户 */
    const isHighPotential = intentScore >= 70;

    /** 频率控制 */
    if (!this._checkRateLimit()) {
      logger.info('互动频率已达上限，跳过本次截流', { platform });
      return { success: true, data: { matched: true, matches, throttled: true } };
    }

    /** 选择话术 */
    const replyTemplate = this._selectReplyTemplate(matches);

    /** 保存线索 */
    const lead = await this._saveLead({
      platform,
      authorId,
      authorName,
      location,
      source,
      content: text,
      matchedKeywords: matches,
      intentScore,
      isHighPotential,
      replyTemplate,
    });

    logger.info('截流线索已捕获', {
      platform,
      authorName,
      intentScore,
      isHighPotential,
      matches,
    });

    return {
      success: true,
      data: {
        matched: true,
        matches,
        intentScore,
        isHighPotential,
        replyTemplate,
        leadId: lead._id,
      },
      message: isHighPotential ? '高潜用户，建议立即跟进' : '意向用户，已记录',
    };
  }

  /**
   * 添加截流关键词
   *
   * @param {string} category - 分类(wellness/skincare/bodycare/emotion/intent)
   * @param {string[]} words - 关键词列表
   * @returns {Object}
   */
  addKeywords(category, words) {
    if (!this.keywords[category]) {
      this.keywords[category] = [];
    }

    const added = [];
    for (const word of words) {
      if (!this.keywords[category].includes(word)) {
        this.keywords[category].push(word);
        added.push(word);
      }
    }

    logger.info('截流关键词已添加', { category, count: added.length });
    return { success: true, data: { added, category }, message: `已添加${added.length}个关键词` };
  }

  /**
   * 删除截流关键词
   *
   * @param {string} category - 分类
   * @param {string[]} words - 待删除关键词
   * @returns {Object}
   */
  removeKeywords(category, words) {
    if (this.keywords[category]) {
      this.keywords[category] = this.keywords[category].filter((w) => !words.includes(w));
    }

    return { success: true, data: { removed: words }, message: '关键词已删除' };
  }

  /**
   * 添加屏蔽词
   *
   * @param {string[]} words - 屏蔽词列表
   * @returns {Object}
   */
  addBlockedKeywords(words) {
    for (const word of words) {
      if (!this.blockedKeywords.includes(word)) {
        this.blockedKeywords.push(word);
      }
    }
    return { success: true, data: { count: this.blockedKeywords.length } };
  }

  /**
   * 查询截流线索列表
   *
   * @param {Object} [filters] - 筛选条件
   * @param {string} [filters.platform] - 平台
   * @param {boolean} [filters.isHighPotential] - 是否高潜
   * @param {Date} [filters.startDate] - 开始日期
   * @param {Date} [filters.endDate] - 结束日期
   * @param {number} [filters.limit=50] - 返回数量
   * @returns {Promise<Object>}
   */
  async getLeads(filters = {}) {
    try {
      const query = {};

      if (filters.platform) query.platform = filters.platform;
      if (filters.isHighPotential !== undefined) query.isHighPotential = filters.isHighPotential;
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const leads = await InterceptionLead.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .lean();

      return {
        success: true,
        data: leads,
        message: `查询到${leads.length}条线索`,
      };
    } catch (err) {
      logger.error('查询线索失败', { error: err.message });
      return { success: false, data: [], message: err.message };
    }
  }

  /**
   * 标记线索转化状态
   *
   * @param {string} leadId - 线索ID
   * @param {string} status - 状态(contacted/converted/lost)
   * @param {string} [note] - 备注
   * @returns {Promise<Object>}
   */
  async updateLeadStatus(leadId, status, note = '') {
    try {
      const lead = await InterceptionLead.findByIdAndUpdate(
        leadId,
        { status, note, updatedAt: new Date() },
        { new: true },
      );

      if (!lead) {
        return { success: false, data: null, message: '线索不存在' };
      }

      logger.info('线索状态已更新', { leadId, status });
      return { success: true, data: lead, message: '状态更新成功' };
    } catch (err) {
      logger.error('更新线索状态失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  /**
   * 获取截流统计数据
   *
   * @param {Object} [filters] - 时间筛选
   * @returns {Promise<Object>}
   */
  async getStats(filters = {}) {
    try {
      const query = {};
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const [total, highPotential, converted, byPlatform] = await Promise.all([
        InterceptionLead.countDocuments(query),
        InterceptionLead.countDocuments({ ...query, isHighPotential: true }),
        InterceptionLead.countDocuments({ ...query, status: 'converted' }),
        InterceptionLead.aggregate([
          { $match: query },
          { $group: { _id: '$platform', count: { $sum: 1 } } },
        ]),
      ]);

      return {
        success: true,
        data: {
          total,
          highPotential,
          converted,
          conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : 0,
          byPlatform,
        },
      };
    } catch (err) {
      logger.error('获取统计数据失败', { error: err.message });
      return { success: false, data: null, message: err.message };
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 关键词匹配
   *
   * @param {string} text - 文本内容
   * @returns {string[]} 匹配到的关键词
   */
  _matchKeywords(text) {
    const matched = [];
    for (const [, words] of Object.entries(this.keywords)) {
      for (const word of words) {
        if (text.includes(word) && !matched.includes(word)) {
          matched.push(word);
        }
      }
    }
    return matched;
  }

  /**
   * 检查是否包含屏蔽词
   *
   * @param {string} text - 文本
   * @returns {boolean}
   */
  _containsBlocked(text) {
    return this.blockedKeywords.some((word) => text.includes(word));
  }

  /**
   * 计算用户意向分数
   *
   * @param {string} text - 文本内容
   * @param {string[]} matches - 匹配关键词
   * @param {string} [location] - 位置信息
   * @returns {number} 0-100分
   */
  _calculateIntentScore(text, matches, location) {
    let score = 0;

    /** 关键词数量计分 */
    score += Math.min(matches.length * 15, 45);

    /** 消费意向关键词额外加分 */
    const intentWords = this.keywords.intent || [];
    const intentMatches = intentWords.filter((w) => text.includes(w));
    score += intentMatches.length * 15;

    /** 问号结尾表示提问意图 */
    if (text.trim().endsWith('?') || text.trim().endsWith('？')) {
      score += 10;
    }

    /** 同城加分 */
    if (location && (location.includes('宜昌') || location.includes('湖北'))) {
      score += 20;
    }

    /** 文本长度适中说明是真实用户 */
    if (text.length >= 10 && text.length <= 200) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * 选择最合适的回复话术
   *
   * @param {string[]} matches - 匹配关键词
   * @returns {string} 回复话术
   */
  _selectReplyTemplate(matches) {
    const allKeywords = [...matches];

    if (allKeywords.some((w) => DEFAULT_KEYWORDS.emotion.includes(w))) {
      return this._randomPick(this.replyTemplates.emotion_ask);
    }
    if (allKeywords.some((w) => DEFAULT_KEYWORDS.bodycare.includes(w))) {
      return this._randomPick(this.replyTemplates.bodycare_ask);
    }
    if (allKeywords.some((w) => DEFAULT_KEYWORDS.skincare.includes(w))) {
      return this._randomPick(this.replyTemplates.skincare_ask);
    }
    if (allKeywords.some((w) => DEFAULT_KEYWORDS.wellness.includes(w))) {
      return this._randomPick(this.replyTemplates.wellness_ask);
    }

    return this._randomPick(this.replyTemplates.general);
  }

  /**
   * 互动频率控制
   *
   * @returns {boolean} 是否允许互动
   */
  _checkRateLimit() {
    const now = Date.now();

    /** 最小间隔检查 */
    if (now - this.lastInteractionTime < this.minInterval) {
      return false;
    }

    /** 每小时上限检查 */
    if (this.interactionCount >= this.maxPerHour) {
      return false;
    }

    this.interactionCount++;
    this.lastInteractionTime = now;
    return true;
  }

  /**
   * 保存截流线索
   *
   * @param {Object} data - 线索数据
   * @returns {Promise<Object>} 保存后的文档
   */
  async _saveLead(data) {
    return InterceptionLead.create({
      platform: data.platform,
      authorId: data.authorId,
      authorName: data.authorName,
      location: data.location,
      source: data.source,
      content: data.content,
      matchedKeywords: data.matchedKeywords,
      intentScore: data.intentScore,
      isHighPotential: data.isHighPotential,
      replyTemplate: data.replyTemplate,
      status: 'new',
    });
  }

  /**
   * 随机选择数组元素
   *
   * @param {Array} arr - 数组
   * @returns {*} 随机元素
   */
  _randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * 统计关键词总数
   *
   * @returns {number}
   */
  _countKeywords() {
    return Object.values(this.keywords).reduce((sum, arr) => sum + arr.length, 0);
  }

  /**
   * 重置每小时互动计数（由定时任务调用）
   */
  resetHourlyCounter() {
    this.interactionCount = 0;
    logger.info('每小时互动计数已重置');
  }
}

export { DEFAULT_KEYWORDS, DEFAULT_BLOCKED_KEYWORDS, REPLY_TEMPLATES };
