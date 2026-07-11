/**
 * 定时任务调度器 - Scheduler
 *
 * 管理所有定时任务的启动和调度。
 * 使用 node-cron 实现 cron 表达式调度。
 *
 * @module engines/scheduler
 */

import cron from 'node-cron';
import config from '../../config/default.js';
import logger from '../utils/logger.js';
import integrationService from '../services/IntegrationService.js';

/** 引擎实例缓存 */
let engines = {};

/**
 * 设置引擎实例引用
 *
 * @param {Object} engineInstances - 引擎实例映射
 */
export function setEngines(engineInstances) {
  engines = engineInstances;
}

/**
 * 启动所有定时任务
 */
export function startScheduledTasks() {
  logger.info('开始注册定时任务', { module: 'scheduler' });

  /** 每日重置发布计数 */
  cron.schedule('0 0 * * *', () => {
    logger.info('[定时任务] 重置每日发布计数', { module: 'scheduler' });
    if (engines.publishers) {
      for (const publisher of Object.values(engines.publishers)) {
        publisher.resetDailyCounter();
      }
    }
  });

  /** 每小时重置截流互动计数 */
  cron.schedule('0 * * * *', () => {
    if (engines.interception) {
      engines.interception.resetHourlyCounter();
    }
  });

  /** 内容定时发布 */
  if (config.cron.publish) {
    cron.schedule(config.cron.publish, async () => {
      logger.info('[定时任务] 执行内容定时发布', { module: 'scheduler' });
      /** 由外部内容调度系统触发，此处为占位 */
    });
  }

  /** 截流监控 */
  if (config.cron.interception) {
    cron.schedule(config.cron.interception, async () => {
      logger.debug('[定时任务] 执行截流监控扫描', { module: 'scheduler' });
    });
  }

  /** 数据报表生成 */
  if (config.cron.report) {
    cron.schedule(config.cron.report, async () => {
      logger.info('[定时任务] 执行每日数据报表生成', { module: 'scheduler' });
    });
  }

  /** 沉默客户激活 */
  if (config.cron.reactivation) {
    cron.schedule(config.cron.reactivation, async () => {
      logger.info('[定时任务] 执行沉默客户激活检查', { module: 'scheduler' });
      if (engines.privateDomain) {
        await engines.privateDomain.activateSilentCustomers();
      }
    });
  }

  /** ERP 每日数据同步（凌晨 3:00，未配置自动降级跳过） */
  cron.schedule('0 3 * * *', async () => {
    logger.info('[定时任务] ERP 数据同步', { module: 'scheduler' });
    try {
      const r = await integrationService.syncFromERP();
      logger.info('[定时任务] ERP 同步结果', { module: 'scheduler', result: r });
    } catch (err) {
      logger.error('[定时任务] ERP 同步异常', { module: 'scheduler', error: err.message });
    }
  });

  /** 腕家H1 健康数据每日拉取（早 6:00，仅活跃客户） */
  cron.schedule('0 6 * * *', async () => {
    logger.info('[定时任务] 腕家H1 健康数据拉取', { module: 'scheduler' });
    try {
      const { Customer } = await import('../services/DatabaseService.js');
      const since = new Date(Date.now() - 7 * 86400000);
      const customers = await Customer.find({ lastActiveAt: { $gte: since } }).limit(200).lean();
      for (const c of customers) {
        await integrationService.pullWanjiH1(c._id);
      }
      logger.info('[定时任务] 腕家H1 拉取完成', { module: 'scheduler', count: customers.length });
    } catch (err) {
      logger.error('[定时任务] 腕家H1 拉取异常', { module: 'scheduler', error: err.message });
    }
  });

  logger.info('定时任务注册完成', { module: 'scheduler' });
}
