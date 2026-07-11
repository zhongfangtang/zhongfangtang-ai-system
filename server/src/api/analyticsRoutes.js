/**
 * 数据BI分析 API 路由
 *
 * 内容数据、获客数据、转化数据、用户画像、日报/周报/月报。
 *
 * @module api/analyticsRoutes
 */

import { Router } from 'express';
import {
  Content, PublishRecord, InterceptionLead,
  Customer, Order, Report,
} from '../services/DatabaseService.js';
import logger from '../utils/logger.js';

const router = Router();

// ==================== 内容数据 ====================

/**
 * GET /api/v1/analytics/content
 * 内容数据分析
 */
router.get('/content', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [totalContent, byStatus, byPlatform, publishRecords] = await Promise.all([
      Content.countDocuments(query),
      Content.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Content.aggregate([
        { $match: query },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
      ]),
      PublishRecord.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalContent,
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        byPlatform: Object.fromEntries(byPlatform.map((p) => [p._id, p.count])),
        publishStats: Object.fromEntries(publishRecords.map((r) => [r._id, r.count])),
      },
    });
  } catch (err) {
    logger.error('获取内容数据失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 获客数据 ====================

/**
 * GET /api/v1/analytics/acquisition
 * 获客数据分析
 */
router.get('/acquisition', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [
      totalLeads,
      highPotential,
      byPlatform,
      byStatus,
      avgIntentScore,
    ] = await Promise.all([
      InterceptionLead.countDocuments(query),
      InterceptionLead.countDocuments({ ...query, isHighPotential: true }),
      InterceptionLead.aggregate([
        { $match: query },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
      ]),
      InterceptionLead.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      InterceptionLead.aggregate([
        { $match: query },
        { $group: { _id: null, avg: { $avg: '$intentScore' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalLeads,
        highPotential,
        highPotentialRate: totalLeads > 0 ? ((highPotential / totalLeads) * 100).toFixed(1) : 0,
        avgIntentScore: avgIntentScore[0]?.avg?.toFixed(1) || 0,
        byPlatform: Object.fromEntries(byPlatform.map((p) => [p._id, p.count])),
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      },
    });
  } catch (err) {
    logger.error('获取获客数据失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 转化数据 ====================

/**
 * GET /api/v1/analytics/conversion
 * 转化数据分析
 */
router.get('/conversion', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [
      totalCustomers,
      newCustomers,
      convertedLeads,
      orders,
      revenue,
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments(query),
      InterceptionLead.countDocuments({ ...query, status: 'converted' }),
      Order.aggregate([
        { $match: query },
        { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]),
      Order.aggregate([
        { $match: { ...query, status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
    ]);

    const totalLeads = await InterceptionLead.countDocuments(query);
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        newCustomers: newCustomers,
        convertedLeads,
        conversionRate,
        orderCount: orders[0]?.count || 0,
        totalRevenue: revenue[0]?.total || 0,
        avgOrderValue: orders[0]?.count > 0
          ? (orders[0].totalAmount / orders[0].count).toFixed(0)
          : 0,
      },
    });
  } catch (err) {
    logger.error('获取转化数据失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 用户画像 ====================

/**
 * GET /api/v1/analytics/customer-profile
 * 用户画像分析
 */
router.get('/customer-profile', async (req, res) => {
  try {
    const [
      byTier,
      bySource,
      byStatus,
      byGender,
    ] = await Promise.all([
      Customer.aggregate([{ $group: { _id: '$tier', count: { $sum: 1 } } }]),
      Customer.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      Customer.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Customer.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers: await Customer.countDocuments(),
        byTier: Object.fromEntries(byTier.map((t) => [t._id, t.count])),
        bySource: Object.fromEntries(bySource.map((s) => [s._id, s.count])),
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        byGender: Object.fromEntries(byGender.map((g) => [g._id, g.count])),
      },
    });
  } catch (err) {
    logger.error('获取用户画像失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 营收数据 ====================

/**
 * GET /api/v1/analytics/revenue
 * 营收数据分析
 */
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    query.status = { $in: ['paid', 'completed'] };

    /** 按时间分组聚合 */
    const dateGroup = groupBy === 'month'
      ? { $substr: ['$createdAt', 0, 7] }
      : { $substr: ['$createdAt', 0, 10] };

    const revenueTrend = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: dateGroup,
          revenue: { $sum: '$paidAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paidAmount' },
          totalOrders: { $sum: 1 },
          avgOrder: { $avg: '$paidAmount' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalStats[0]?.totalRevenue || 0,
        totalOrders: totalStats[0]?.totalOrders || 0,
        avgOrderValue: totalStats[0]?.avgOrder?.toFixed(0) || 0,
        trend: revenueTrend,
      },
    });
  } catch (err) {
    logger.error('获取营收数据失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 报表管理 ====================

/**
 * GET /api/v1/analytics/reports
 * 获取报表列表
 */
router.get('/reports', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.type = type;

    const [reports, total] = await Promise.all([
      Report.find(query).sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Report.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { items: reports, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * GET /api/v1/analytics/reports/:id
 * 获取报表详情
 */
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).lean();
    if (!report) {
      return res.status(404).json({ success: false, data: null, message: '报表不存在' });
    }
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/analytics/reports/generate
 * 手动生成报表
 */
router.post('/reports/generate', async (req, res) => {
  try {
    const { type = 'daily' } = req.body;
    const period = new Date().toISOString().slice(0, 10);

    /** 收集各类统计数据 */
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      contentCount, publishCount, leadCount, customerCount, orderStats,
    ] = await Promise.all([
      Content.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      PublishRecord.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      InterceptionLead.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Customer.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$paidAmount' } } },
      ]),
    ]);

    const report = await Report.create({
      type,
      period,
      data: {
        contentStats: { created: contentCount, published: publishCount },
        interceptionStats: { leadsCaptured: leadCount },
        customerStats: { newCustomers: customerCount },
        revenueStats: {
          orderCount: orderStats[0]?.count || 0,
          revenue: orderStats[0]?.revenue || 0,
        },
      },
    });

    res.json({ success: true, data: report, message: '报表生成成功' });
  } catch (err) {
    logger.error('生成报表失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

export default router;
