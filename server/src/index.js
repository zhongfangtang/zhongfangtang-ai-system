/**
 * 中芳堂AI系统 - 服务主入口
 *
 * Express + WebSocket 服务，挂载所有中间件和路由。
 * 启动定时任务队列，连接数据库和Redis。
 *
 * @module index
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import config from '../config/default.js';
import logger from './utils/logger.js';
import { connectDatabase } from './services/DatabaseService.js';
import routes from './api/routes.js';
import { startScheduledTasks } from './engines/scheduler.js';

const app = express();
const server = createServer(app);

// ==================== 中间件 ====================

/** 安全头 */
app.use(helmet());

/** CORS 跨域 */
// 生产环境允许的来源由 CORS_ORIGINS 配置（逗号分隔），至少包含 BI 看板域名与自有域名；
// 未配置时回退到默认管理后台域名。开发环境放开为 '*'。
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (corsOrigins.length ? corsOrigins : ['https://admin.zhongfangtang.com'])
    : '*',
  credentials: true,
}));

/** HTTP 请求日志 */
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim(), { module: 'http' }) },
}));

/** JSON 请求体解析 */
app.use(express.json({ limit: '10mb' }));

/** URL 编码请求体解析 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== 健康检查 ====================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    message: '服务运行正常',
  });
});

// ==================== API 路由 ====================

app.use('/api/v1', routes);

// ==================== 404 处理 ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `接口不存在: ${req.method} ${req.path}`,
  });
});

// ==================== 全局错误处理 ====================

app.use((err, req, res, _next) => {
  logger.error('未捕获的错误', {
    module: 'app',
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(err.status || 500).json({
    success: false,
    data: null,
    message: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message,
  });
});

// ==================== WebSocket ====================

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  logger.info('WebSocket 客户端已连接', { module: 'ws', ip: clientIp });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      logger.info('收到 WebSocket 消息', { module: 'ws', type: msg.type });
      /** 根据消息类型分发处理 */
      handleWsMessage(ws, msg);
    } catch (err) {
      logger.warn('WebSocket 消息解析失败', { module: 'ws', error: err.message });
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket 客户端已断开', { module: 'ws', ip: clientIp });
  });

  ws.on('error', (err) => {
    logger.error('WebSocket 错误', { module: 'ws', error: err.message });
  });

  /** 发送连接确认 */
  ws.send(JSON.stringify({
    type: 'connected',
    data: { timestamp: Date.now() },
  }));
});

/**
 * WebSocket 消息处理分发
 *
 * @param {import('ws').WebSocket} ws - WebSocket 连接
 * @param {Object} msg - 消息对象
 */
function handleWsMessage(ws, msg) {
  switch (msg.type) {
    case 'publish_status':
      /** 发布状态实时推送 */
      ws.send(JSON.stringify({
        type: 'publish_status',
        data: { status: 'acknowledged', messageId: msg.data?.messageId },
      }));
      break;

    case 'subscribe':
      /** 订阅频道 */
      ws.send(JSON.stringify({
        type: 'subscribed',
        data: { channel: msg.data?.channel },
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        data: null,
        message: `未知消息类型: ${msg.type}`,
      }));
  }
}

/** 导出 wss 供其他模块广播使用 */
export { wss };

// ==================== 启动服务 ====================

async function start() {
  try {
    /** 连接数据库 */
    await connectDatabase();
    logger.info('数据库连接成功', { module: 'startup' });

    /** 启动定时任务 */
    startScheduledTasks();
    logger.info('定时任务已启动', { module: 'startup' });

    /** 启动 HTTP 服务 */
    server.listen(config.server.port, config.server.host, () => {
      logger.info(`中芳堂AI系统服务已启动`, {
        module: 'startup',
        port: config.server.port,
        env: config.env,
      });
      logger.info(`WebSocket 端点: ws://${config.server.host}:${config.server.port}/ws`, {
        module: 'startup',
      });
    });
  } catch (err) {
    logger.error('服务启动失败', {
      module: 'startup',
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

// ==================== 优雅关闭 ====================

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在优雅关闭...', { module: 'shutdown' });
  server.close(() => {
    logger.info('HTTP 服务已关闭', { module: 'shutdown' });
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在优雅关闭...', { module: 'shutdown' });
  server.close(() => {
    logger.info('HTTP 服务已关闭', { module: 'shutdown' });
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise 拒绝', {
    module: 'process',
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', {
    module: 'process',
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

start();

export default app;
