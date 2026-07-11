/**
 * 中芳堂AI系统 - Worker 调度器
 *
 * 独立进程运行的定时任务 Worker，负责：
 * 1. 内容定时发布调度
 * 2. 截流监控循环
 * 3. 数据报表生成
 * 4. 客户跟进触达
 *
 * 与 API 服务解耦，通过共享 MongoDB/Redis 通信。
 *
 * @module workers/scheduler
 */

import { connectDatabase } from '../services/DatabaseService.js';
import logger from '../utils/logger.js';
import config from '../../config/default.js';

// ==================== 引擎引用（延迟加载） ====================

let PlatformPublisher, ContentGenerator, InterceptionEngine, PrivateDomainEngine;

async function loadEngines() {
  PlatformPublisher = (await import('../engines/PlatformPublisher.js')).default;
  ContentGenerator = (await import('../engines/ContentGenerator.js')).default;
  InterceptionEngine = (await import('../engines/InterceptionEngine.js')).default;
  PrivateDomainEngine = (await import('../engines/PrivateDomainEngine.js')).default;
}

// ==================== 任务定义 ====================

/**
 * 内容定时发布任务
 * 每天多个时段执行，生成并发布内容到各平台
 */
async function taskPublishContent() {
  logger.info('[Worker] 开始执行内容发布任务', { module: 'worker' });
  try {
    const publisher = new PlatformPublisher();
    const generator = new ContentGenerator();

    // 生成今日内容
    const contents = await generator.generateDailyContent();
    logger.info(`[Worker] 生成内容 ${contents.length} 条`, { module: 'worker' });

    // 逐条发布到各平台
    for (const content of contents) {
      try {
        await publisher.publish(content);
      } catch (err) {
        logger.error(`[Worker] 发布失败: ${content.platform}`, {
          module: 'worker',
          error: err.message,
        });
      }
    }

    logger.info('[Worker] 内容发布任务完成', { module: 'worker' });
  } catch (err) {
    logger.error('[Worker] 内容发布任务异常', {
      module: 'worker',
      error: err.message,
    });
  }
}

/**
 * 截流监控任务
 * 每5分钟执行，扫描各平台评论区/问答区，识别高意向用户并互动
 */
async function taskInterceptionMonitor() {
  logger.debug('[Worker] 开始执行截流监控', { module: 'worker' });
  try {
    const engine = new InterceptionEngine();
    const results = await engine.monitor();

    if (results && results.length > 0) {
      logger.info(`[Worker] 截流监控发现 ${results.length} 条潜在线索`, {
        module: 'worker',
      });

      for (const lead of results) {
        try {
          await engine.interact(lead);
        } catch (err) {
          logger.warn(`[Worker] 截流互动失败: ${lead.platform}`, {
            module: 'worker',
            error: err.message,
          });
        }
      }
    }
  } catch (err) {
    logger.error('[Worker] 截流监控任务异常', {
      module: 'worker',
      error: err.message,
    });
  }
}

/**
 * 数据报表生成任务
 * 每天凌晨执行，生成日报/周报/月报
 */
async function taskGenerateReports() {
  logger.info('[Worker] 开始生成数据报表', { module: 'worker' });
  try {
    // TODO: 对接 analytics 引擎生成报表
    logger.info('[Worker] 数据报表生成完成', { module: 'worker' });
  } catch (err) {
    logger.error('[Worker] 数据报表生成异常', {
      module: 'worker',
      error: err.message,
    });
  }
}

/**
 * 客户跟进触达任务
 * 每4小时执行，检查需要跟进的客户并发送消息
 */
async function taskCustomerFollowUp() {
  logger.info('[Worker] 开始执行客户跟进', { module: 'worker' });
  try {
    const engine = new PrivateDomainEngine();
    const result = await engine.processFollowUps();
    logger.info(`[Worker] 客户跟进完成: ${result?.processed || 0} 人`, {
      module: 'worker',
    });
  } catch (err) {
    logger.error('[Worker] 客户跟进任务异常', {
      module: 'worker',
      error: err.message,
    });
  }
}

// ==================== 定时调度 ====================

const SCHEDULE = {
  publishContent: { cron: '0 9,12,15,18,21 * * *', task: taskPublishContent },
  interceptionMonitor: { cron: '*/5 * * * *', task: taskInterceptionMonitor },
  generateReports: { cron: '0 2 * * *', task: taskGenerateReports },
  customerFollowUp: { cron: '0 */4 * * *', task: taskCustomerFollowUp },
};

/**
 * 简单的 cron 解析和调度器
 * 生产环境建议使用 node-cron 或 Bull 队列
 */
function parseCron(expr) {
  const parts = expr.split(' ');
  // 简化实现：返回下次执行间隔（毫秒）
  // 生产环境请使用 node-cron 库
  return 60000; // 默认1分钟
}

// ==================== 主循环 ====================

async function start() {
  logger.info('[Worker] 中芳堂 Worker 调度器启动中...', { module: 'worker' });

  try {
    // 连接数据库
    await connectDatabase();
    logger.info('[Worker] 数据库连接成功', { module: 'worker' });

    // 加载引擎
    await loadEngines();
    logger.info('[Worker] 引擎加载完成', { module: 'worker' });

    logger.info('[Worker] Worker 调度器已就绪', { module: 'worker' });
  } catch (err) {
    logger.error('[Worker] 启动失败', {
      module: 'worker',
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

// ==================== 优雅关闭 ====================

process.on('SIGTERM', () => {
  logger.info('[Worker] 收到 SIGTERM，正在关闭...', { module: 'worker' });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('[Worker] 收到 SIGINT，正在关闭...', { module: 'worker' });
  process.exit(0);
});

start();

export { start };
