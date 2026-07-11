/**
 * 日志工具 - 基于 Winston
 *
 * 提供分级日志记录能力，支持控制台输出和文件持久化。
 * 日志级别：error < warn < info < debug
 *
 * @module utils/logger
 */

import winston from 'winston';
import { resolve } from 'path';
import config from '../../config/default.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * 自定义日志格式
 * 格式: [时间] [级别] [模块]: 消息 {元数据}
 */
const customFormat = printf(({ level, message, timestamp, module, ...meta }) => {
  const moduleStr = module ? `[${module}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level} ${moduleStr}: ${message}${metaStr}`;
});

/**
 * 创建 Winston Logger 实例
 */
const logger = winston.createLogger({
  level: config.log.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customFormat,
  ),
  transports: [
    /** 控制台输出（带颜色） */
    new winston.transports.Console({
      format: combine(colorize(), customFormat),
    }),
    /** 错误日志文件 */
    new winston.transports.File({
      filename: resolve(config.log.dir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 10,
    }),
    /** 综合日志文件 */
    new winston.transports.File({
      filename: resolve(config.log.dir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 30,
    }),
  ],
});

/**
 * 创建带模块标识的子 Logger
 *
 * @param {string} moduleName - 模块名称
 * @returns {winston.Logger} 子 Logger 实例
 */
export function createModuleLogger(moduleName) {
  return logger.child({ module: moduleName });
}

export default logger;
