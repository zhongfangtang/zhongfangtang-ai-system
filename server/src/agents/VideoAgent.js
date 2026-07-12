/**
 * 视频工厂·小芳制片 (VideoAgent)
 *
 * 包装VideoProcessor引擎，实现AI视频自动生产。
 * 从内容库提取脚本 → FFmpeg自动剪辑 → TTS配音 → 字幕叠加 → 品牌水印 → 多平台输出。
 *
 * @module agents/VideoAgent
 */

import AgentBase from './base/AgentBase.js';
import ContentGenerator from '../engines/ContentGenerator.js';
import VideoProcessor from '../engines/VideoProcessor.js';
import config from '../../config/default.js';
import { Content, VideoTask } from '../services/DatabaseService.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('VideoAgent');

export default class VideoAgent extends AgentBase {
  constructor(opts = {}) {
    super({
      id: 'video-agent',
      name: '视频工厂·小芳制片',
      trigger: 'event',
      model: config.ai.models.text,
      knowledgeBase: 'content-kb',
    });
    this.generator = new ContentGenerator();
    this.processor = new VideoProcessor();
    this.canUseAI = Boolean(config.ai.apiKey);
    this.ffmpegAvailable = this.processor.ffmpegAvailable;
  }

  /**
   * 执行视频生产（事件驱动）
   * @param {Object} input - { contentId?, platform?, topic?, type? }
   */
  async execute(input = {}) {
    // 如果传入了taskId，直接处理已有任务
    if (input.taskId) {
      return await this.processor.processTask(input.taskId);
    }

    // 否则创建新任务并处理
    const task = await this._createTask(input);
    if (!task) {
      return { success: false, message: '无可处理的内容' };
    }

    // 检查FFmpeg是否可用
    if (!this.ffmpegAvailable) {
      logger.warn('FFmpeg不可用，视频任务标记待处理（需手动或使用云端渲染）');
      await VideoTask.findByIdAndUpdate(task._id, {
        status: 'pending',
        error: 'FFmpeg未安装，任务已创建等待处理',
      });
      return { success: true, degraded: true, data: { taskId: task._id, status: 'pending', message: 'FFmpeg不可用，任务已创建' } };
    }

    // 执行视频处理
    try {
      const result = await this.processor.processTask(task._id);
      return { success: result.success, data: { taskId: task._id, ...result.data } };
    } catch (err) {
      await VideoTask.findByIdAndUpdate(task._id, { status: 'failed', error: err.message });
      return { success: false, error: err.message };
    }
  }

  /**
   * 创建视频任务
   */
  async _createTask(input) {
    let content;
    if (input.contentId) {
      content = await Content.findById(input.contentId);
    } else {
      // 随机取一条未生成视频的内容
      content = await Content.findOne({ type: { $in: ['video', 'article'] } }).sort({ createdAt: -1 });
    }

    if (!content) return null;

    // 生成分镜脚本
    const script = await this.generator.generateVideoScript({
      topic: content.title || input.topic || '九体辨识精油调理',
      platform: input.platform || content.platform || 'xiaohongshu',
      duration: 60,
    });

    const task = await VideoTask.create({
      contentId: content._id,
      title: content.title,
      script: script.success ? script.data : null,
      platforms: [content.platform || 'xiaohongshu'],
      template: content.platform || 'xiaohongshu',
      status: 'pending',
    });

    return task;
  }

  /**
   * 降级逻辑
   */
  async fallback(input = {}) {
    logger.info('视频Agent降级：创建任务但不处理');
    return this.execute(input);
  }
}
