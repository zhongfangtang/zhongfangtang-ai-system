/**
 * Agent 基类
 *
 * 所有AI智能体继承此类，统一生命周期和降级逻辑。
 * 核心设计：每个Agent都有正常执行(execute)和降级执行(fallback)两条路径，
 * 当AI密钥未配置或外部服务不可用时自动降级，保证系统可运行。
 *
 * @module agents/base/AgentBase
 */

import { createModuleLogger } from '../../utils/logger.js';

export default class AgentBase {
  /**
   * @param {Object} config - Agent配置
   * @param {string} config.id - Agent唯一ID
   * @param {string} config.name - Agent显示名
   * @param {string} config.trigger - 触发方式: scheduled | event | user_message
   * @param {string} [config.model] - 使用的AI模型
   * @param {string} [config.knowledgeBase] - 关联知识库
   * @param {Object} [config.rules] - 执行规则
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.trigger = config.trigger || 'event';
    this.model = config.model;
    this.knowledgeBase = config.knowledgeBase;
    this.rules = config.rules || {};

    this.status = 'idle'; // idle | running | paused | error | degraded
    this.lastRunAt = null;
    this.lastError = null;
    this.runCount = 0;
    this.successCount = 0;
    this.failCount = 0;
    this.degradedCount = 0;
    this.metrics = { totalDuration: 0, avgDuration: 0 };

    this.logger = createModuleLogger(`Agent:${this.id}`);
  }

  /**
   * 初始化Agent（子类可重写）
   */
  async initialize() {
    this.logger.info(`Agent ${this.name} 初始化完成`);
    return { success: true };
  }

  /**
   * 执行Agent任务（子类必须实现）
   * @param {Object} input - 任务输入
   */
  async execute(input) {
    throw new Error(`${this.name} 未实现 execute 方法`);
  }

  /**
   * 降级执行（子类可重写，无AI密钥时调用）
   * @param {Object} input - 任务输入
   */
  async fallback(input) {
    this.logger.warn(`Agent ${this.name} 使用默认降级逻辑`);
    return { success: false, degraded: true, message: 'AI不可用，请配置API密钥' };
  }

  /**
   * 统一执行入口：自动选择正常或降级路径
   * @param {Object} input - 任务输入
   * @returns {Promise<Object>} 执行结果
   */
  async run(input = {}) {
    const startTime = Date.now();
    this.status = 'running';
    this.lastRunAt = new Date();

    try {
      let result;
      // 判断是否走降级路径
      if (this._shouldFallback(input)) {
        result = await this.fallback(input);
        this.degradedCount++;
        this.status = 'degraded';
      } else {
        result = await this.execute(input);
        this.successCount++;
        this.status = 'idle';
      }

      this.runCount++;
      const duration = Date.now() - startTime;
      this.metrics.totalDuration += duration;
      this.metrics.avgDuration = Math.round(this.metrics.totalDuration / this.runCount);

      // 记录运行日志
      this._logRun(input, result, duration, 'success');
      return result;
    } catch (err) {
      this.status = 'error';
      this.lastError = err.message;
      this.failCount++;
      this.runCount++;
      const duration = Date.now() - startTime;
      this._logRun(input, { error: err.message }, duration, 'failed');
      this.logger.error(`Agent ${this.name} 执行失败`, { error: err.message });
      return { success: false, error: err.message };
    }
  }

  /**
   * 判断是否需要降级（子类可重写）
   * @param {Object} input
   * @returns {boolean}
   */
  _shouldFallback(input) {
    // 默认：子类通过 this.canUseAI 标志控制
    return this.canUseAI === false;
  }

  /**
   * 记录运行日志（子类可重写持久化逻辑）
   */
  _logRun(input, output, duration, status) {
    // 默认仅打印，持久化由AgentRunLog模型完成
    if (status === 'failed') {
      this.logger.warn(`运行日志: ${status} (${duration}ms)`);
    }
  }

  /**
   * 获取Agent状态
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      trigger: this.trigger,
      model: this.model,
      lastRunAt: this.lastRunAt,
      metrics: {
        runCount: this.runCount,
        successCount: this.successCount,
        failCount: this.failCount,
        degradedCount: this.degradedCount,
        avgDuration: this.metrics.avgDuration,
      },
      canUseAI: this.canUseAI !== false,
    };
  }

  /**
   * 暂停Agent
   */
  pause() {
    this.status = 'paused';
    this.logger.info(`Agent ${this.name} 已暂停`);
  }

  /**
   * 恢复Agent
   */
  resume() {
    this.status = 'idle';
    this.logger.info(`Agent ${this.name} 已恢复`);
  }
}
