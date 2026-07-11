/**
 * 截流获客 API 路由
 *
 * 关键词管理、截流策略配置、线索列表、转化标记。
 *
 * @module api/interceptionRoutes
 */

import { Router } from 'express';
import InterceptionEngine from '../engines/InterceptionEngine.js';
import { InterceptionLead } from '../services/DatabaseService.js';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

/** 引擎单例 */
const interceptionEngine = new InterceptionEngine();

// ==================== 关键词管理 ====================

/**
 * GET /api/v1/interception/keywords
 * 获取所有截流关键词
 */
router.get('/keywords', (req, res) => {
  res.json({
    success: true,
    data: {
      keywords: interceptionEngine.keywords,
      blockedKeywords: interceptionEngine.blockedKeywords,
    },
  });
});

/**
 * POST /api/v1/interception/keywords
 * 添加截流关键词
 */
router.post('/keywords', authorize('admin', 'operator'), (req, res) => {
  try {
    const { category, words } = req.body;
    const result = interceptionEngine.addKeywords(category, words);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * DELETE /api/v1/interception/keywords
 * 删除截流关键词
 */
router.delete('/keywords', authorize('admin'), (req, res) => {
  try {
    const { category, words } = req.body;
    const result = interceptionEngine.removeKeywords(category, words);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/interception/blocked-words
 * 添加屏蔽词
 */
router.post('/blocked-words', authorize('admin'), (req, res) => {
  try {
    const result = interceptionEngine.addBlockedKeywords(req.body.words);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 监控管理 ====================

/**
 * POST /api/v1/interception/monitor/start
 * 启动平台监控
 */
router.post('/monitor/start', authorize('admin'), async (req, res) => {
  try {
    const { platform, options } = req.body;
    const result = await interceptionEngine.startMonitoring(platform, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/interception/monitor/stop
 * 停止平台监控
 */
router.post('/monitor/stop', authorize('admin'), async (req, res) => {
  try {
    const { platform } = req.body;
    const result = await interceptionEngine.stopMonitoring(platform);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 内容扫描 ====================

/**
 * POST /api/v1/interception/scan
 * 扫描内容并识别截流机会
 */
router.post('/scan', async (req, res) => {
  try {
    const { platform, content } = req.body;
    const result = await interceptionEngine.scanContent(platform, content);
    res.json(result);
  } catch (err) {
    logger.error('内容扫描失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 线索管理 ====================

/**
 * GET /api/v1/interception/leads
 * 获取截流线索列表
 */
router.get('/leads', async (req, res) => {
  try {
    const { platform, isHighPotential, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (platform) query.platform = platform;
    if (isHighPotential !== undefined) query.isHighPotential = isHighPotential === 'true';
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [leads, total] = await Promise.all([
      InterceptionLead.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      InterceptionLead.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: leads,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('获取线索列表失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * GET /api/v1/interception/leads/:id
 * 获取单条线索详情
 */
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await InterceptionLead.findById(req.params.id).lean();
    if (!lead) {
      return res.status(404).json({ success: false, data: null, message: '线索不存在' });
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * PUT /api/v1/interception/leads/:id/status
 * 更新线索状态
 */
router.put('/leads/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const result = await interceptionEngine.updateLeadStatus(req.params.id, status, note);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 统计分析 ====================

/**
 * GET /api/v1/interception/stats
 * 获取截流统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await interceptionEngine.getStats({ startDate, endDate });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

export default router;
