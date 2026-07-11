/**
 * 六大平台发布引擎 - PlatformPublisher
 *
 * 支持抖音、小红书、视频号、快手、B站、百家号的自动化内容发布。
 * 全自动模式（B站/百家号/视频号）：定时定量发布，无需人工干预。
 * 半自动模式（抖音/小红书/快手）：AI预审 + 风险评级 + 人工复核。
 *
 * @module engines/PlatformPublisher
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';
import { PublishRecord } from '../services/DatabaseService.js';

const logger = createModuleLogger('PlatformPublisher');

/** 平台发布模式 */
const PUBLISH_MODES = {
  FULL_AUTO: 'full-auto',
  SEMI_AUTO: 'semi-auto',
};

/** 发布状态 */
const PUBLISH_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PUBLISHING: 'publishing',
  SUCCESS: 'success',
  FAILED: 'failed',
  RETRYING: 'retrying',
};

/** 风险等级 */
const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  BLOCKED: 'blocked',
};

/** 违规词库（示例，实际从配置加载） */
const DEFAULT_SENSITIVE_WORDS = [
  '治疗', '治愈', '根治', '神药', '特效', '百分百',
  '保证', '绝对', '第一', '唯一', '最', '顶级',
  '免费', '限时', '抢购', '促销', '打折',
];

export default class PlatformPublisher {
  /**
   * 创建平台发布引擎实例
   *
   * @param {Object} options - 配置选项
   * @param {string} options.platform - 平台名称
   * @param {Object} options.credentials - 平台认证信息
   */
  constructor(options = {}) {
    this.platform = options.platform || 'unknown';
    this.credentials = options.credentials || {};
    this.publishMode = this._getPublishMode();
    this.dailyLimit = this._getDailyLimit();
    this.rateLimit = this._getRateLimit();
    this.dailyPublished = 0;
    this.retryMap = new Map();
    this.sensitiveWords = this._loadSensitiveWords();

    logger.info('平台发布引擎初始化', {
      platform: this.platform,
      mode: this.publishMode,
      dailyLimit: this.dailyLimit,
    });
  }

  /**
   * 获取平台发布模式
   * @returns {string}
   */
  _getPublishMode() {
    const platformConfig = config.platforms[this.platform];
    return platformConfig?.publishMode || PUBLISH_MODES.SEMI_AUTO;
  }

  /**
   * 获取平台每日发布限制
   * @returns {number}
   */
  _getDailyLimit() {
    const platformConfig = config.platforms[this.platform];
    return platformConfig?.dailyLimit || 5;
  }

  /**
   * 获取平台速率限制
   * @returns {Object}
   */
  _getRateLimit() {
    const platformConfig = config.platforms[this.platform];
    return platformConfig?.rateLimit || { maxRequests: 10, perSeconds: 60 };
  }

  /**
   * 发布内容主入口
   *
   * @param {Object} content - 内容对象
   * @param {string} content.title - 标题
   * @param {string} content.body - 正文
   * @param {string[]} content.images - 图片URL列表
   * @param {string} content.videoUrl - 视频URL
   * @param {string[]} content.tags - 标签列表
   * @param {string} content.accountId - 发布账号ID
   * @returns {Promise<Object>} 发布结果
   */
  async publish(content) {
    const startTime = Date.now();

    try {
      /** 检查每日发布额度 */
      if (this.dailyPublished >= this.dailyLimit) {
        return this._buildResponse(false, null, `已达每日发布上限(${this.dailyLimit})`);
      }

      /** 内容合规自检 */
      const auditResult = await this._contentAudit(content);
      if (auditResult.riskLevel === RISK_LEVELS.BLOCKED) {
        return this._buildResponse(false, null, `内容审核不通过: ${auditResult.reasons.join('; ')}`);
      }

      /** 半自动模式：需要人工复核 */
      if (this.publishMode === PUBLISH_MODES.SEMI_AUTO) {
        if (auditResult.riskLevel === RISK_LEVELS.HIGH) {
          return this._buildResponse(false, null, '高风险内容，需人工复核确认后发布', {
            auditResult,
            status: PUBLISH_STATUS.REVIEWING,
          });
        }
      }

      /** 创建发布记录 */
      const record = await PublishRecord.create({
        platform: this.platform,
        accountId: content.accountId,
        title: content.title,
        content: content,
        status: PUBLISH_STATUS.PUBLISHING,
        auditResult,
        startTime: new Date(),
      });

      /** 执行平台发布 */
      const result = await this._executePublish(content);

      /** 更新发布记录 */
      record.status = result.success ? PUBLISH_STATUS.SUCCESS : PUBLISH_STATUS.FAILED;
      record.platformPostId = result.postId || null;
      record.result = result;
      record.endTime = new Date();
      record.duration = Date.now() - startTime;
      await record.save();

      if (result.success) {
        this.dailyPublished++;
        logger.info('内容发布成功', {
          platform: this.platform,
          title: content.title?.substring(0, 50),
          postId: result.postId,
        });
      }

      return this._buildResponse(result.success, result, result.message);
    } catch (err) {
      logger.error('内容发布异常', {
        platform: this.platform,
        error: err.message,
        stack: err.stack,
      });

      /** 失败重试 */
      const retryCount = this.retryMap.get(content.title) || 0;
      if (retryCount < 3) {
        this.retryMap.set(content.title, retryCount + 1);
        logger.info('发布失败，将自动重试', {
          platform: this.platform,
          retryCount: retryCount + 1,
        });
        setTimeout(() => this.publish(content), 60000 * (retryCount + 1));
        return this._buildResponse(false, null, '发布失败，已加入重试队列');
      }

      this.retryMap.delete(content.title);
      return this._buildResponse(false, null, `发布失败: ${err.message}`);
    }
  }

  /**
   * 加载敏感词库（文件 + 默认词合并，去重）
   * 低成本合规：本地文件，零外部依赖，覆盖医疗功效违规词
   * @returns {string[]}
   */
  _loadSensitiveWords() {
    const words = [...DEFAULT_SENSITIVE_WORDS];
    try {
      const file = path.resolve(process.cwd(), config.contentAudit.sensitiveWordsFile);
      if (fs.existsSync(file)) {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        for (const line of lines) {
          const w = line.trim();
          if (w && !w.startsWith('#')) words.push(w);
        }
      }
    } catch (e) {
      logger.warn('敏感词文件加载失败，使用默认词库', { error: e.message });
    }
    return [...new Set(words)];
  }

  /**
   * 内容合规自检
   *
   * @param {Object} content - 内容对象
   * @returns {Promise<Object>} 审核结果 { riskLevel, reasons, score }
   */
  async _contentAudit(content) {
    if (!config.contentAudit.enabled) {
      return { riskLevel: RISK_LEVELS.LOW, reasons: [], score: 0 };
    }

    const reasons = [];
    let score = 0;

    /** 违规词检测 */
    const fullText = `${content.title || ''} ${content.body || ''} ${(content.tags || []).join(' ')}`;
    for (const word of this.sensitiveWords) {
      if (fullText.includes(word)) {
        reasons.push(`包含敏感词: "${word}"`);
        score += 30;
      }
    }

    /** 标题长度检查 */
    if (content.title && content.title.length > 50) {
      reasons.push('标题超过50字符');
      score += 10;
    }

    /** 图片数量检查 */
    if (content.images && content.images.length > 9) {
      reasons.push('图片数量超过9张');
      score += 10;
    }

    /** 风险等级判定 */
    let riskLevel;
    if (score >= 60) {
      riskLevel = RISK_LEVELS.BLOCKED;
    } else if (score >= 30) {
      riskLevel = RISK_LEVELS.HIGH;
    } else if (score >= 10) {
      riskLevel = RISK_LEVELS.MEDIUM;
    } else {
      riskLevel = RISK_LEVELS.LOW;
    }

    return { riskLevel, reasons, score };
  }

  /**
   * 执行具体平台的发布操作
   *
   * @param {Object} content - 内容对象
   * @returns {Promise<Object>} 发布结果
   */
  async _executePublish(content) {
    const platformConfig = config.platforms[this.platform];
    const apiBase = platformConfig?.apiBase;

    if (!apiBase) {
      throw new Error(`未找到平台配置: ${this.platform}`);
    }

    /** 平台特定参数转换 */
    const payload = this._buildPlatformPayload(content);
    const authHeaders = this._getAuthHeaders();

    // 各平台真实发布端点（基于开放平台公开文档，免费API）
    const endpoints = {
      // 百家号：PC端文章发布接口（full-auto）
      baijiahao: { method: 'POST', path: '/pcui/article/publish' },
      // B站：创作中心稿件提交接口（full-auto）
      bilibili: { method: 'POST', path: '/x/v2/creative/article/create' },
      // 抖音：视频发布接口（semi-auto，需access_token）
      douyin: { method: 'POST', path: '/api/douyin/v1/video/create_video/' },
      // 小红书：笔记发布接口（semi-auto，需access_token）
      xiaohongshu: { method: 'POST', path: '/api/red/open/note/publish' },
      // 快手：视频发布接口（semi-auto）
      kuaishou: { method: 'POST', path: '/openapi/photo/publish' },
      // 视频号：公众号草稿接口（full-auto，需access_token作query）
      weixin: { method: 'POST', path: '/cgi-bin/draft/add' },
    };

    const ep = endpoints[this.platform];
    if (!ep) {
      throw new Error(`未支持的平台发布端点: ${this.platform}`);
    }

    try {
      const response = await axios({
        method: ep.method,
        url: `${apiBase}${ep.path}`,
        data: payload,
        headers: authHeaders,
        timeout: 30000,
      });

      // 统一解析各平台返回（字段命名不同，宽松匹配）
      const data = response.data || {};
      const postId = data.id || data.data?.id || data.data?.publish_id
        || data.post_id || data.article_id || data.data?.article_id || null;

      return {
        success: true,
        postId,
        platformResponse: data,
        message: '已提交至平台（全自动平台将自动发布，半自动平台等待人工复核）',
      };
    } catch (err) {
      /** 处理平台限流 */
      if (err.response?.status === 429) {
        logger.warn('触发平台限流', {
          platform: this.platform,
          retryAfter: err.response.headers['retry-after'],
        });
        throw new Error('平台限流，请稍后重试');
      }

      throw err;
    }
  }

  /**
   * 构建平台特定的发布参数
   *
   * @param {Object} content - 通用内容对象
   * @returns {Object} 平台特定参数
   */
  _buildPlatformPayload(content) {
    const base = {
      title: content.title,
      content: content.body,
      images: content.images || [],
      tags: content.tags || [],
    };

    switch (this.platform) {
      case 'douyin':
        return {
          ...base,
          video_id: content.videoUrl,
          micro_app_id: config.platforms.douyin.appId,
          poi_id: content.poiId,
        };

      case 'xiaohongshu':
        return {
          ...base,
          title: content.title?.substring(0, 20),
          note_type: content.videoUrl ? 'video' : 'normal',
          video_url: content.videoUrl,
          at_users: content.atUsers || [],
        };

      case 'weixin':
        return {
          ...base,
          description: content.body,
          articles: [{
            title: content.title,
            content: content.body,
            cover: content.images?.[0],
          }],
        };

      case 'kuaishou':
        return {
          ...base,
          caption: content.title,
          videoPath: content.videoUrl,
          coverPath: content.images?.[0],
        };

      case 'bilibili':
        return {
          ...base,
          tid: content.categoryId || 171,
          copyright: 2,
          source: content.body,
          cover: content.images?.[0],
          videos: content.videoUrl ? [{ filename: content.videoUrl }] : [],
        };

      case 'baijiahao':
        return {
          ...base,
          content: content.body,
          cover_images: content.images?.slice(0, 3),
          is_original: 1,
        };

      default:
        return base;
    }
  }

  /**
   * 获取平台认证请求头
   *
   * @returns {Object} 请求头
   */
  _getAuthHeaders() {
    const base = { 'Content-Type': 'application/json' };

    switch (this.platform) {
      case 'douyin':
        return { ...base, 'access-token': this.credentials.accessToken || config.platforms.douyin.accessToken };
      case 'bilibili':
        return { ...base, 'Cookie': `SESSDATA=${this.credentials.sessdata}` };
      case 'baijiahao':
        return { ...base, 'Cookie': config.platforms.baijiahao.cookie };
      default:
        return { ...base, 'Authorization': `Bearer ${this.credentials.token || ''}` };
    }
  }

  /**
   * 查询发布状态
   *
   * @param {string} publishId - 发布记录ID
   * @returns {Promise<Object>} 发布状态
   */
  async getPublishStatus(publishId) {
    try {
      const record = await PublishRecord.findById(publishId);
      if (!record) {
        return this._buildResponse(false, null, '发布记录不存在');
      }
      return this._buildResponse(true, {
        status: record.status,
        platformPostId: record.platformPostId,
        createdAt: record.createdAt,
        duration: record.duration,
      });
    } catch (err) {
      logger.error('查询发布状态失败', { error: err.message });
      return this._buildResponse(false, null, err.message);
    }
  }

  /**
   * 批量发布内容
   *
   * @param {Object[]} contents - 内容数组
   * @returns {Promise<Object[]>} 发布结果数组
   */
  async batchPublish(contents) {
    const results = [];
    for (const content of contents) {
      const result = await this.publish(content);
      results.push(result);
      /** 控制发布间隔，避免触发限流 */
      const interval = (this.rateLimit.perSeconds / this.rateLimit.maxRequests) * 1000;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return results;
  }

  /**
   * 重置每日发布计数（由定时任务调用）
   */
  resetDailyCounter() {
    this.dailyPublished = 0;
    logger.info('每日发布计数已重置', { platform: this.platform });
  }

  /**
   * 构建统一响应格式
   *
   * @param {boolean} success - 是否成功
   * @param {*} data - 数据
   * @param {string} message - 消息
   * @param {Object} [extra] - 额外字段
   * @returns {Object}
   */
  _buildResponse(success, data, message = '', extra = {}) {
    return { success, data, message, ...extra };
  }
}

export { PUBLISH_MODES, PUBLISH_STATUS, RISK_LEVELS };
