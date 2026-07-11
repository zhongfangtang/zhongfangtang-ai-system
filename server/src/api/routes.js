/**
 * RESTful API 路由总定义
 *
 * 挂载所有子路由模块，统一管理 API 版本。
 *
 * @module api/routes
 */

import { Router } from 'express';
import platformRoutes from './platformRoutes.js';
import interceptionRoutes from './interceptionRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import crmRoutes from './crmRoutes.js';
import web3Routes from './web3Routes.js';
import integrationRoutes from './integrationRoutes.js';
import { authenticate } from '../middleware/auth.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// ==================== 认证接口 ====================

/**
 * POST /api/v1/auth/login
 * 用户登录
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    /** 简化认证逻辑，实际应查询数据库 */
    if (username === 'admin' && password === 'admin123') {
      const token = generateToken({ userId: 'admin', role: 'admin' });
      return res.json({
        success: true,
        data: { token, expiresIn: '7d' },
        message: '登录成功',
      });
    }

    /** 操作员角色 */
    if (username === 'operator' && password === 'operator123') {
      const token = generateToken({ userId: 'operator', role: 'operator' });
      return res.json({
        success: true,
        data: { token, expiresIn: '7d' },
        message: '登录成功',
      });
    }

    res.status(401).json({
      success: false,
      data: null,
      message: '用户名或密码错误',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * 刷新 Token
 */
router.post('/auth/refresh', authenticate, (req, res) => {
  try {
    const token = generateToken({
      userId: req.user.userId,
      role: req.user.role,
    });
    res.json({
      success: true,
      data: { token },
      message: 'Token 刷新成功',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
});

// ==================== 业务路由 ====================

/** 平台管理 */
router.use('/platforms', authenticate, platformRoutes);

/** 截流获客 */
router.use('/interception', authenticate, interceptionRoutes);

/** 数据分析 */
router.use('/analytics', authenticate, analyticsRoutes);

/** CRM */
router.use('/crm', authenticate, crmRoutes);

/** Web3 链上存证 */
router.use('/web3', web3Routes);

/** 集成中枢（企业微信/ERP/腕家H1/Webhook） */
router.use('/integrations', integrationRoutes);

// ==================== 系统接口 ====================

/**
 * GET /api/v1/system/status
 * 系统状态
 */
router.get('/system/status', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
