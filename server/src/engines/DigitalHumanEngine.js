/**
 * AI数字人直播引擎 - DigitalHumanEngine
 *
 * 中芳堂虚拟IP"小芳"数字人直播系统。
 * 支持7×24小时自动直播：产品讲解+体质科普+优惠活动+弹幕互动截流。
 *
 * 技术栈：
 * - 直播脚本：ContentAgent自动生成
 * - TTS配音：Edge TTS（免费）
 * - 数字人驱动：可对接硅基智能/腾讯智影等API
 * - 弹幕互动：InterceptionAgent自动回复
 *
 * @module engines/DigitalHumanEngine
 */

import { createModuleLogger } from '../utils/logger.js';
import config from '../../config/default.js';

const logger = createModuleLogger('DigitalHumanEngine');

/** 数字人"小芳"形象配置 */
const XIAOFANG_PROFILE = {
  name: '小芳',
  title: '中芳堂AI数字人·首席体质辨证师',
  avatar: '/assets/xiaofang-avatar.png',
  voice: 'zh-CN-XiaoxiaoNeural', // Azure TTS voice
  personality: '专业温暖、亲切自然',
  specialties: ['九体辨识', '精油搭配', '中医养生', '芳香疗法'],
};

/** 直播脚本模板库 */
const LIVE_SCRIPTS = {
  /** 开场暖场（3分钟） */
  opening: [
    '大家好，欢迎来到中芳堂中医芳香疗法直播间！我是你们的体质辨证师小芳 🌿',
    '今天小芳要跟大家分享一个特别适合${constitution}的精油调理方案～',
    '先来看看我们中芳堂的镇店之宝——九体辨识复方精油！',
  ],
  /** 产品讲解（每5分钟一轮） */
  product: [
    '${product}是我们中芳堂的王牌产品，采用${ingredient}，${effect}',
    '很多${constitution}的姐妹用了都说效果很好，来看看真实反馈～',
    '今天直播间下单有专属优惠，记得领券哦 💰',
  ],
  /** 体质科普（每10分钟） */
  education: [
    '很多姐妹问我：小芳，我怎么知道自己是哪种体质呢？',
    '中医把人的体质分为九种：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质。',
    '${constitution}的典型表现是：${symptoms}。如果你有这些情况，可以试试${oil}精油～',
  ],
  /** 互动引导 */
  engagement: [
    '评论区告诉我你的体质类型，小芳帮你搭配精油方案！',
    '新进来的姐妹点个关注，每天都有中医养生干货分享 💚',
    '宜昌本地的姐妹可以到店免费做体质测评哦～',
  ],
  /** 优惠活动 */
  promotion: [
    '限时福利！现在下单九体辨识套餐，送${gift}！',
    '会员积分翻倍活动进行中，消费1元=1积分，100积分=1元！',
    '推荐朋友到店体验，双方各得50积分～',
  ],
};

export default class DigitalHumanEngine {
  constructor() {
    this.profile = XIAOFANG_PROFILE;
    this.isLive = false;
    this.currentScript = null;
    this.scriptQueue = [];
    this.liveStartTime = null;
    this.viewerCount = 0;
    this.interactionCount = 0;
    this.interceptionAgent = null; // 由外部注入

    logger.info('数字人直播引擎已初始化', { digitalHuman: this.profile.name });
  }

  /**
   * 设置截流Agent（弹幕互动用）
   */
  setInterceptionAgent(agent) {
    this.interceptionAgent = agent;
  }

  /**
   * 生成直播脚本（按时间线编排）
   * @param {Object} options - { duration, products, constitution }
   */
  async generateLiveScript(options = {}) {
    const { duration = 120, products = [], constitution = '气虚质' } = options;
    const segments = [];

    // 每10分钟一个循环
    const cycles = Math.ceil(duration / 10);
    for (let i = 0; i < cycles; i++) {
      const minute = i * 10;

      if (i === 0) {
        // 第一轮：开场
        segments.push({
          minute,
          type: 'opening',
          duration: 3,
          script: this._fillTemplate(LIVE_SCRIPTS.opening, { constitution }),
        });
      }

      // 产品讲解
      const product = products[i % products.length] || '九体辨识复方精油';
      segments.push({
        minute: minute + 3,
        type: 'product',
        duration: 5,
        script: this._fillTemplate(LIVE_SCRIPTS.product, {
          product,
          ingredient: '纯天然植物萃取精华',
          effect: '深层滋养、调理体质',
          constitution,
        }),
      });

      // 互动引导
      segments.push({
        minute: minute + 8,
        type: 'engagement',
        duration: 2,
        script: this._fillTemplate(LIVE_SCRIPTS.engagement, {}),
      });
    }

    // 结尾：优惠活动
    segments.push({
      minute: duration - 3,
      type: 'promotion',
      duration: 3,
      script: this._fillTemplate(LIVE_SCRIPTS.promotion, {
        gift: '中芳堂精油小样3支装',
      }),
    });

    this.currentScript = { duration, segments, totalSegments: segments.length };
    return { success: true, data: this.currentScript };
  }

  /**
   * 启动数字人直播
   */
  async startLive(options = {}) {
    const script = await this.generateLiveScript(options);
    this.isLive = true;
    this.liveStartTime = new Date();
    this.viewerCount = 0;
    this.interactionCount = 0;

    logger.info('数字人直播已启动', {
      duration: script.data.duration,
      segments: script.data.totalSegments,
    });

    return {
      success: true,
      data: {
        digitalHuman: this.profile.name,
        status: 'live',
        startedAt: this.liveStartTime,
        script: script.data,
      },
    };
  }

  /**
   * 停止直播
   */
  async stopLive() {
    this.isLive = false;
    const duration = this.liveStartTime
      ? Math.floor((Date.now() - this.liveStartTime) / 1000 / 60)
      : 0;

    logger.info('数字人直播已停止', {
      duration,
      viewers: this.viewerCount,
      interactions: this.interactionCount,
    });

    return {
      success: true,
      data: {
        status: 'ended',
        duration,
        totalViewers: this.viewerCount,
        totalInteractions: this.interactionCount,
      },
    };
  }

  /**
   * 处理弹幕互动（与InterceptionAgent联动）
   */
  async handleComment(comment) {
    this.interactionCount++;

    // 通过截流Agent识别意向
    let interceptionResult = null;
    if (this.interceptionAgent) {
      interceptionResult = await this.interceptionAgent.scanOne('douyin', {
        authorId: comment.userId,
        authorName: comment.userName,
        content: comment.text,
        source: 'comment',
      });
    }

    // 生成回复
    const reply = this._generateReply(comment.text, interceptionResult);

    return {
      success: true,
      data: { reply, interception: interceptionResult },
    };
  }

  /**
   * 获取直播状态
   */
  getLiveStatus() {
    return {
      isLive: this.isLive,
      digitalHuman: this.profile,
      startedAt: this.liveStartTime,
      duration: this.liveStartTime
        ? Math.floor((Date.now() - this.liveStartTime) / 1000 / 60)
        : 0,
      viewerCount: this.viewerCount,
      interactionCount: this.interactionCount,
    };
  }

  // ==================== 私有方法 ====================

  _fillTemplate(templates, vars) {
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    let result = tpl;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), v || '');
    }
    return result;
  }

  _generateReply(commentText, interceptionResult) {
    // 如果截流Agent识别到高意向，使用其话术
    if (interceptionResult?.data?.replyTemplate) {
      return interceptionResult.data.replyTemplate;
    }

    // 默认回复
    const defaults = [
      '感谢关注中芳堂～想了解体质调理可以私信小芳哦 💚',
      '姐妹可以到我们主页看看九体辨识测评，免费的～',
      '宜昌的朋友欢迎到店体验，报直播间有优惠 🌿',
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }
}
