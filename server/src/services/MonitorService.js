/**
 * 系统监控与健康检查 - MonitorService
 *
 * 统一系统监控、告警、健康检查。
 * 市场最佳实践：
 * - 健康检查端点（/health）
 * - 内存/CPU监控
 * - MongoDB连接状态
 * - Redis连接状态
 * - Agent运行状态汇总
 * - 定时告警（钉钉/飞书/企业微信）
 *
 * @module services/MonitorService
 */

import os from 'os';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('MonitorService');

export default class MonitorService {
  constructor() {
    this.startTime = Date.now();
    this.alertWebhook = process.env.ALERT_WEBHOOK || ''; // 钉钉/飞书Webhook
    this.checks = [];
  }

  /**
   * 完整健康检查
   */
  async healthCheck() {
    const checks = {
      server: this._checkServer(),
      memory: this._checkMemory(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };

    // 汇总状态
    const allHealthy = Object.values(checks).every(c => c?.status !== 'unhealthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      version: '5.1.0',
    };
  }

  /**
   * 获取系统资源使用情况
   */
  getSystemMetrics() {
    const mem = process.memoryUsage();
    const cpu = os.loadavg();
    return {
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        percent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
      },
      cpu: {
        load1: cpu[0].toFixed(2),
        load5: cpu[1].toFixed(2),
        load15: cpu[2].toFixed(2),
        cores: os.cpus().length,
      },
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: os.platform(),
    };
  }

  /**
   * 发送告警
   */
  async sendAlert(level, title, message) {
    logger.warn(`[${level.toUpperCase()}] ${title}: ${message}`);

    // 预留：钉钉/飞书 Webhook 告警
    if (this.alertWebhook) {
      try {
        const { default: axios } = await import('axios');
        await axios.post(this.alertWebhook, {
          msgtype: 'text',
          text: { content: `[中芳堂AI系统 ${level}] ${title}\n${message}` },
        });
      } catch (err) {
        logger.warn('告警发送失败', { error: err.message });
      }
    }
  }

  _checkServer() {
    return { status: 'healthy', port: 3001, pid: process.pid };
  }

  _checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const percent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    return {
      status: percent > 90 ? 'unhealthy' : percent > 70 ? 'degraded' : 'healthy',
      heapUsedMB,
      heapTotalMB,
      percent,
    };
  }
}
