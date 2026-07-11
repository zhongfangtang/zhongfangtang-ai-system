/**
 * 平台管理 API 路由
 *
 * 账号授权、发布任务管理、内容库CRUD、发布状态查询。
 *
 * @module api/platformRoutes
 */

import { Router } from 'express';
import PlatformPublisher, { PUBLISH_STATUS } from '../engines/PlatformPublisher.js';
import ContentGenerator from '../engines/ContentGenerator.js';
import { Content, PublishRecord, PlatformAccount } from '../services/DatabaseService.js';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

/** 引擎实例（单例） */
let contentGenerator = new ContentGenerator();

/** 平台发布器缓存 */
const publishers = new Map();

/**
 * 获取或创建平台发布器
 *
 * @param {string} platform - 平台名称
 * @param {Object} [credentials] - 认证信息
 * @returns {PlatformPublisher}
 */
function getPublisher(platform, credentials = {}) {
  if (!publishers.has(platform)) {
    publishers.set(platform, new PlatformPublisher({ platform, credentials }));
  }
  return publishers.get(platform);
}

// ==================== 账号管理 ====================

/**
 * GET /api/v1/platforms/accounts
 * 获取平台账号列表
 */
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await PlatformAccount.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: accounts });
  } catch (err) {
    logger.error('获取账号列表失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/platforms/accounts
 * 添加平台账号
 */
router.post('/accounts', authorize('admin'), async (req, res) => {
  try {
    const account = await PlatformAccount.create(req.body);
    res.json({ success: true, data: account, message: '账号添加成功' });
  } catch (err) {
    logger.error('添加账号失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * PUT /api/v1/platforms/accounts/:id
 * 更新平台账号
 */
router.put('/accounts/:id', authorize('admin'), async (req, res) => {
  try {
    const account = await PlatformAccount.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true },
    );
    if (!account) {
      return res.status(404).json({ success: false, data: null, message: '账号不存在' });
    }
    res.json({ success: true, data: account, message: '账号更新成功' });
  } catch (err) {
    logger.error('更新账号失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * DELETE /api/v1/platforms/accounts/:id
 * 删除平台账号
 */
router.delete('/accounts/:id', authorize('admin'), async (req, res) => {
  try {
    await PlatformAccount.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: '账号已删除' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 内容管理 ====================

/**
 * GET /api/v1/platforms/contents
 * 获取内容列表
 */
router.get('/contents', async (req, res) => {
  try {
    const { platform, status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (platform) query.platform = platform;
    if (status) query.status = status;
    if (type) query.type = type;

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Content.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: contents,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('获取内容列表失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/platforms/contents
 * 创建内容
 */
router.post('/contents', async (req, res) => {
  try {
    const content = await Content.create(req.body);
    res.json({ success: true, data: content, message: '内容创建成功' });
  } catch (err) {
    logger.error('创建内容失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * PUT /api/v1/platforms/contents/:id
 * 更新内容
 */
router.put('/contents/:id', async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true },
    );
    if (!content) {
      return res.status(404).json({ success: false, data: null, message: '内容不存在' });
    }
    res.json({ success: true, data: content, message: '内容更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * DELETE /api/v1/platforms/contents/:id
 * 删除内容
 */
router.delete('/contents/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: '内容已删除' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== AI内容生成 ====================

/**
 * POST /api/v1/platforms/generate/copywriting
 * 生成营销文案
 */
router.post('/generate/copywriting', async (req, res) => {
  try {
    const result = await contentGenerator.generateCopywriting(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/platforms/generate/video-script
 * 生成短视频分镜脚本
 */
router.post('/generate/video-script', async (req, res) => {
  try {
    const result = await contentGenerator.generateVideoScript(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/platforms/generate/poster
 * 生成海报描述
 */
router.post('/generate/poster', async (req, res) => {
  try {
    const result = await contentGenerator.generatePosterDescription(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 发布管理 ====================

/**
 * POST /api/v1/platforms/publish
 * 发布内容到指定平台
 */
router.post('/publish', async (req, res) => {
  try {
    const { platform, content, accountId } = req.body;
    const publisher = getPublisher(platform);
    const result = await publisher.publish({ ...content, accountId });
    res.json(result);
  } catch (err) {
    logger.error('发布请求失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/platforms/batch-publish
 * 批量发布
 */
router.post('/batch-publish', authorize('admin'), async (req, res) => {
  try {
    const { platform, contents } = req.body;
    const publisher = getPublisher(platform);
    const results = await publisher.batchPublish(contents);
    res.json({ success: true, data: results, message: `批量发布完成` });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * GET /api/v1/platforms/publish/:id/status
 * 查询发布状态
 */
router.get('/publish/:id/status', async (req, res) => {
  try {
    const record = await PublishRecord.findById(req.params.id).lean();
    if (!record) {
      return res.status(404).json({ success: false, data: null, message: '发布记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * GET /api/v1/platforms/publish-records
 * 获取发布记录列表
 */
router.get('/publish-records', async (req, res) => {
  try {
    const { platform, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (platform) query.platform = platform;
    if (status) query.status = status;

    const [records, total] = await Promise.all([
      PublishRecord.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      PublishRecord.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { items: records, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

export default router;
