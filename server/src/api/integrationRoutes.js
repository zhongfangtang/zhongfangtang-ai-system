/**
 * 集成中枢 API 路由
 *
 * 鉴权接口（需登录）：
 *   GET  /api/v1/integrations                  集成清单
 *   POST /api/v1/integrations/:name/test       连通性测试
 *   POST /api/v1/integrations/sync/erp         从 ERP 全量/增量同步
 *   POST /api/v1/integrations/wanji-h1/:id     拉取腕家H1健康数据
 *   POST /api/v1/integrations/wework/notify    给企业内部成员发通知（未认证可用）
 *   POST /api/v1/integrations/wework/:id       推送客户到企业微信（外部联系人，需认证）
 * 公开接口（Webhook，建议配合签名校验 + IP 白名单）：
 *   POST /api/v1/webhook/:source               ERP / 小程序 实时回写
 *
 * @module api/integrationRoutes
 */

import { Router } from 'express';
import integrationService from '../services/IntegrationService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/** 集成清单 */
router.get('/', authenticate, (req, res) => {
  res.json({ success: true, data: integrationService.listIntegrations() });
});

/** 连通性测试 */
router.post('/:name/test', authenticate, async (req, res) => {
  try {
    const result = await integrationService.testConnection(req.params.name);
    res.json({ success: result.success, data: result, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/** ERP 同步 */
router.post('/sync/erp', authenticate, async (req, res) => {
  try {
    const result = await integrationService.syncFromERP(req.body || {});
    if (!result.success) {
      return res.status(result.skipped ? 200 : 502).json({ success: false, data: result, message: result.reason || result.error });
    }
    res.json({ success: true, data: result, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/** 腕家H1 健康数据拉取 */
router.post('/wanji-h1/:id', authenticate, async (req, res) => {
  try {
    const result = await integrationService.pullWanjiH1(req.params.id);
    if (!result.success) {
      return res.status(502).json({ success: false, data: result, message: result.reason || result.error });
    }
    res.json({ success: true, data: result, message: '腕家H1数据同步成功' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/** 给企业内部成员发通知（未认证可用，仅依赖 corpId/corpSecret/agentId） */
router.post('/wework/notify', authenticate, async (req, res) => {
  try {
    const result = await integrationService.notifyWeworkInternal(req.body || {});
    if (!result.success) {
      return res.status(502).json({ success: false, data: result, message: result.reason || result.error });
    }
    res.json({ success: true, data: result, message: '企微内部通知已发送' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/** 推送客户到企业微信 */
router.post('/wework/:id', authenticate, async (req, res) => {
  try {
    const result = await integrationService.pushCustomerToWework(req.params.id);
    if (!result.success) {
      return res.status(502).json({ success: false, data: result, message: result.reason || result.error });
    }
    res.json({ success: true, data: result, message: '已推送至企业微信' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/** 公开 Webhook 接收（ERP / 小程序 → CRM） */
router.post('/webhook/:source', async (req, res) => {
  try {
    const result = await integrationService.receiveWebhook(req.params.source, req.body || {}, req.headers['x-signature']);
    if (!result.success) {
      return res.status(400).json({ success: false, data: result, message: result.reason || result.error });
    }
    res.json({ success: true, data: result, message: 'Webhook 处理成功' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

export default router;
