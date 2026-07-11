/**
 * BI 数据中台 - 真实数据聚合路由
 *
 * 为前端 BI 中台（dashboard）提供 9 个聚合接口，数据来源于真实 MongoDB
 * （dashboard_cache 集合，由 scripts/seedDashboard.js 播种/更新）。
 * 接口返回结构与前端 api.js 的 Mock 结构完全一致，便于无缝切换。
 *
 * 全部为公开接口（免鉴权），供中台看板读取。
 *
 * @module api/dashboardRoutes
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const router = Router();

// ==================== 数据模型 ====================

const DashboardCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },
});

const DashboardCache = mongoose.models.DashboardCache ||
  mongoose.model('DashboardCache', DashboardCacheSchema);

// ==================== 读取缓存 ====================

async function getCache(key) {
  const doc = await DashboardCache.findOne({ key }).lean();
  return doc ? doc.data : null;
}

// ==================== 9 个聚合接口 ====================

/** GET /api/v1/dashboard/overview 核心指标概览 */
router.get('/overview', async (req, res) => {
  try {
    const data = await getCache('overview');
    res.json({ code: 200, data: data || {} });
  } catch (err) {
    logger.error('读取 overview 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/platform-data 六大平台数据对比 */
router.get('/platform-data', async (req, res) => {
  try {
    const data = await getCache('platform-data');
    res.json({ code: 200, data: data || [] });
  } catch (err) {
    logger.error('读取 platform-data 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/funnel 流量转化漏斗 */
router.get('/funnel', async (req, res) => {
  try {
    const data = await getCache('funnel');
    res.json({ code: 200, data: data || {} });
  } catch (err) {
    logger.error('读取 funnel 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/trend 内容发布趋势（近30天） */
router.get('/trend', async (req, res) => {
  try {
    const data = await getCache('trend');
    res.json({ code: 200, data: data || {} });
  } catch (err) {
    logger.error('读取 trend 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/channel 获客渠道分布 */
router.get('/channel', async (req, res) => {
  try {
    const data = await getCache('channel');
    res.json({ code: 200, data: data || [] });
  } catch (err) {
    logger.error('读取 channel 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/user-profile 用户画像 */
router.get('/user-profile', async (req, res) => {
  try {
    const data = await getCache('user-profile');
    res.json({ code: 200, data: data || {} });
  } catch (err) {
    logger.error('读取 user-profile 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/private-domain 私域流量池 */
router.get('/private-domain', async (req, res) => {
  try {
    const data = await getCache('private-domain');
    res.json({ code: 200, data: data || {} });
  } catch (err) {
    logger.error('读取 private-domain 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/report?period=day|week|month 数据复盘报告 */
router.get('/report', async (req, res) => {
  try {
    const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'day';
    const data = await getCache(`report_${period}`);
    res.json({ code: 200, data: data || {} });
  } catch (err) {
    logger.error('读取 report 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/v1/dashboard/geo/performance GEO搜索占位 */
router.get('/geo/performance', async (req, res) => {
  try {
    const data = await getCache('geo');
    res.json({ code: 200, data: data || {} });
  } catch (err) {
    logger.error('读取 geo 缓存失败', { module: 'dashboard', error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
