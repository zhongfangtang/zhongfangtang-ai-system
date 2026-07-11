/**
 * 认证中间件 - JWT Token 验证
 *
 * 验证请求头中的 Bearer Token，解析用户身份信息。
 * 支持角色权限控制（admin / operator / viewer）。
 *
 * @module middleware/auth
 */

import jwt from 'jsonwebtoken';
import config from '../../config/default.js';

/**
 * JWT 认证中间件
 * 从 Authorization 头提取 Bearer Token 并验证
 *
 * @param {import('express').Request} req - Express 请求对象
 * @param {import('express').Response} res - Express 响应对象
 * @param {import('express').NextFunction} next - 下一个中间件
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      message: '未提供认证令牌',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        message: '认证令牌已过期',
      });
    }
    return res.status(401).json({
      success: false,
      data: null,
      message: '无效的认证令牌',
    });
  }
}

/**
 * 可选认证中间件
 * 如果提供了有效的 Token 则解析用户信息，否则继续执行（不拦截）
 *
 * @param {import('express').Request} req - Express 请求对象
 * @param {import('express').Response} res - Express 响应对象
 * @param {import('express').NextFunction} next - 下一个中间件
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
  } catch {
    req.user = null;
  }

  next();
}

/**
 * 角色权限控制中间件工厂函数
 *
 * @param {...string} roles - 允许的角色列表
 * @returns {import('express').RequestHandler} Express 中间件
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: '请先登录',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '权限不足',
      });
    }

    next();
  };
}

/**
 * 生成 JWT Token
 *
 * @param {Object} payload - Token 载荷（userId, role 等）
 * @returns {string} JWT Token
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * 生成刷新 Token
 *
 * @param {Object} payload - Token 载荷
 * @returns {string} 刷新 Token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}
