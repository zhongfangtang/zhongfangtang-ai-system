/**
 * Web3 链上存证 API 路由
 *
 * 公开接口（读）：
 *   GET  /api/v1/web3/info            链状态（网络/合约/是否可写）
 *   GET  /api/v1/web3/verify?hash=0x.. 验证哈希是否已上链
 * 受保护接口（写）：
 *   POST /api/v1/web3/notarize        上链存证（需登录）
 *
 * @module api/web3Routes
 */

import { Router } from 'express';
import web3Service from '../services/Web3Service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/v1/web3/info
 * 链状态
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: web3Service.getChainInfo(),
  });
});

/**
 * GET /api/v1/web3/verify?hash=0x...
 * 验证哈希是否已上链
 */
router.get('/verify', async (req, res) => {
  try {
    const { hash } = req.query;
    if (!hash) {
      return res.status(400).json({ success: false, data: null, message: '缺少 hash 参数' });
    }
    const result = await web3Service.verify(hash);
    res.json({ success: result.success, data: result, message: result.verified === true ? '已在链上存证' : (result.verified === false ? '未找到链上存证' : '链上验证未启用') });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/web3/notarize
 * 上链存证（需鉴权）
 */
router.post('/notarize', authenticate, async (req, res) => {
  try {
    const { type, payload, meta } = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, data: null, message: '缺少 payload 存证内容' });
    }
    const result = await web3Service.notarize({ type, payload, meta });
    if (!result.success) {
      return res.status(502).json({ success: false, data: result, message: '存证上链失败：' + (result.error || '未知错误') });
    }
    res.json({
      success: true,
      data: result,
      message: result.onChain ? '已成功上链存证' : '已生成离线哈希（未上链，请配置 WEB3_PRIVATE_KEY/合约）',
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

export default router;
