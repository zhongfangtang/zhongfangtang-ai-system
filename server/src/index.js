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
import staticRoutes from './api/staticRoutes.js';
import agentRoutes from './api/agentRoutes.js';
import videoRoutes from './api/videoRoutes.js';
import { startScheduledTasks } from './engines/scheduler.js';
import orchestrator from './agents/orchestrator.js';
import TizhiAgent from './agents/TizhiAgent.js';
import ContentAgent from './agents/ContentAgent.js';
import InterceptionAgent from './agents/InterceptionAgent.js';
import PrivateDomainAgent from './agents/PrivateDomainAgent.js';
import AnalyticsAgent from './agents/AnalyticsAgent.js';
import VideoAgent from './agents/VideoAgent.js';
import GeoAgent from './agents/GeoAgent.js';
import ErpAgent from './agents/ErpAgent.js';
import DistributionAgent from './agents/DistributionAgent.js';
import DigitalHumanAgent from './agents/DigitalHumanAgent.js';
import douyinOAuth from './services/DouyinOAuth.js';
import MonitorService from './services/MonitorService.js';
import { getConfiguredIntegrations } from './services/IntegrationManifest.js';

const app = express();
const monitor = new MonitorService();
const server = createServer(app);

// ==================== 中间件 ====================

/** 安全头
 * 注意：静态页面（运营后台/看板/门户）使用内联脚本和样式，
 * 因此放宽 CSP 允许 'unsafe-inline'。API 端点的安全由认证和输入校验保证。
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameAncestors: ["'self'", "*"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

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

// ==================== 静态文件（同源自托管：运营后台JS/CSS等资源） ====================
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONSOLE_ROOT = path.resolve(__dirname, '..', '..', 'console');
app.use('/js', express.static(path.join(CONSOLE_ROOT, 'js'), { maxAge: '1h' }));
app.use('/pages', express.static(path.join(CONSOLE_ROOT, 'pages'), { maxAge: '1h' }));

// ==================== 静态页面（同源自托管：运营后台/看板/门户） ====================
app.use('/', staticRoutes);

// ==================== AI智能体管理API ====================
app.use('/api/v1/agents', agentRoutes);

// ==================== 视频工厂API ====================
app.use('/api/v1/video', videoRoutes);

// ==================== 健康检查 ====================

app.get('/health', (req, res) => {
  monitor.healthCheck().then(h => res.json(h));
});

/**
 * GET /api/v1/system/metrics - 系统资源指标
 */
app.get('/api/v1/system/metrics', (req, res) => {
  res.json({
    success: true,
    data: monitor.getSystemMetrics(),
  });
});

/**
 * GET /api/v1/system/integrations - 外部接口配置状态
 */
app.get('/api/v1/system/integrations', (req, res) => {
  res.json({
    success: true,
    data: getConfiguredIntegrations(),
  });
});

// ==================== API 路由 ====================

app.use('/api/v1', routes);

// ==================== 抖音来客 OAuth 回调（公开，抖音授权后跳转） ====================
app.get('/callback/douyin', async (req, res) => {
  const { code, state, error } = req.query;
  const style = "font-family:-apple-system,'PingFang SC',sans-serif;max-width:520px;margin:80px auto;padding:32px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center";
  if (error || !code) {
    return res.status(400).send(
      `<div style="${style}"><h2>❌ 抖音授权失败</h2><p>${error || '未获取到授权 code'}</p><p style="color:#888">可关闭此页面，返回控制台重试。</p></div>`
    );
  }
  try {
    const { account } = await douyinOAuth.completeAuth(code);
    res.send(
      `<div style="${style}"><h2>✅ 抖音来客授权成功</h2><p>账号「${account.accountName}」的 access_token 已安全存储。</p><p style="color:#888">请关闭此页面，返回控制台即可一键发文。</p></div>`
    );
  } catch (e) {
    res.status(500).send(`<div style="${style}"><h2>❌ 授权处理失败</h2><p>${e.message}</p></div>`);
  }
});

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

    /** 初始化AI智能体编排器 */
    if (config.agents.enabled) {
      const agents = [
        new TizhiAgent(),
        new ContentAgent(),
        new InterceptionAgent(),
        new PrivateDomainAgent(),
        new AnalyticsAgent(),
        new VideoAgent(),
        new GeoAgent(),
        new ErpAgent(),
        new DistributionAgent(),
        new DigitalHumanAgent(),
      ];
      await orchestrator.initialize(agents);

      /** 注册工作流 */
      orchestrator.registerWorkflow('content-to-publish', {
        steps: [
          { agentId: 'content-agent', name: '内容生成' },
          { agentId: 'geo-agent', name: 'GEO优化' },
          { agentId: 'video-agent', name: '视频生产' },
        ],
      });
      logger.info('AI智能体编排器启动完成', { module: 'startup', agentCount: agents.length });
    }

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
