/**
 * CRM管理 API 路由
 *
 * 客户档案、跟进记录、流失预警、精准分组。
 *
 * @module api/crmRoutes
 */

import { Router } from 'express';
import PrivateDomainEngine from '../engines/PrivateDomainEngine.js';
import { Customer, CustomerInteraction, Order } from '../services/DatabaseService.js';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

/** 引擎单例 */
const privateDomainEngine = new PrivateDomainEngine();

// ==================== 客户档案 ====================

/**
 * GET /api/v1/crm/customers
 * 获取客户列表
 */
router.get('/customers', async (req, res) => {
  try {
    const {
      tier, status, keyword, source,
      page = 1, limit = 20,
    } = req.query;

    const query = {};
    if (tier) query.tier = tier;
    if (status) query.status = status;
    if (source) query.source = source;
    if (keyword) {
      query.$or = [
        { nickname: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword } },
        { tags: { $regex: keyword, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ lastActiveAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: customers,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('获取客户列表失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * GET /api/v1/crm/customers/:id
 * 获取客户详情
 */
router.get('/customers/:id', async (req, res) => {
  try {
    const profile = await privateDomainEngine.getCustomerProfile(req.params.id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/crm/customers
 * 创建客户
 */
router.post('/customers', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.json({ success: true, data: customer, message: '客户创建成功' });
  } catch (err) {
    logger.error('创建客户失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * PUT /api/v1/crm/customers/:id
 * 更新客户信息
 */
router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true },
    );
    if (!customer) {
      return res.status(404).json({ success: false, data: null, message: '客户不存在' });
    }
    res.json({ success: true, data: customer, message: '客户信息更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * DELETE /api/v1/crm/customers/:id
 * 删除客户
 */
router.delete('/customers/:id', authorize('admin'), async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: '客户已删除' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 客户分层 ====================

/**
 * POST /api/v1/crm/customers/:id/classify
 * 客户分层
 */
router.post('/customers/:id/classify', async (req, res) => {
  try {
    const result = await privateDomainEngine.classifyCustomer(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 跟进记录 ====================

/**
 * GET /api/v1/crm/customers/:id/interactions
 * 获取客户互动记录
 */
router.get('/customers/:id/interactions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [interactions, total] = await Promise.all([
      CustomerInteraction.find({ customerId: req.params.id })
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      CustomerInteraction.countDocuments({ customerId: req.params.id }),
    ]);

    res.json({
      success: true,
      data: {
        items: interactions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/crm/customers/:id/interactions
 * 添加跟进记录
 */
router.post('/customers/:id/interactions', async (req, res) => {
  try {
    const interaction = await CustomerInteraction.create({
      customerId: req.params.id,
      ...req.body,
    });

    /** 更新客户活跃时间 */
    await Customer.findByIdAndUpdate(req.params.id, { lastActiveAt: new Date() });

    res.json({ success: true, data: interaction, message: '跟进记录已添加' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 流失预警 ====================

/**
 * GET /api/v1/crm/churn-prediction
 * 流失预警列表
 */
router.get('/churn-prediction', async (req, res) => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 60);

    const atRiskCustomers = await Customer.find({
      tier: { $in: ['A', 'B'] },
      lastActiveAt: { $lt: thresholdDate },
      status: { $ne: 'churned' },
    })
      .sort({ lastActiveAt: 1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: {
        count: atRiskCustomers.length,
        customers: atRiskCustomers,
      },
      message: `发现${atRiskCustomers.length}位流失风险客户`,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 沉默客户激活 ====================

/**
 * POST /api/v1/crm/activate-silent
 * 批量激活沉默客户
 */
router.post('/activate-silent', authorize('admin', 'operator'), async (req, res) => {
  try {
    const result = await privateDomainEngine.activateSilentCustomers();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 升单方案 ====================

/**
 * POST /api/v1/crm/customers/:id/upsell-plan
 * 生成升单方案
 */
router.post('/customers/:id/upsell-plan', async (req, res) => {
  try {
    const result = await privateDomainEngine.generateUpsellPlan(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 复购提醒 ====================

/**
 * POST /api/v1/crm/customers/:id/repurchase-check
 * 检查复购提醒
 */
router.post('/customers/:id/repurchase-check', async (req, res) => {
  try {
    const result = await privateDomainEngine.checkRepurchaseReminder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 会员权益 ====================

/**
 * POST /api/v1/crm/customers/:id/membership-reminder
 * 发送会员权益提醒
 */
router.post('/customers/:id/membership-reminder', async (req, res) => {
  try {
    const result = await privateDomainEngine.sendMembershipReminder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 客户分组 ====================

/**
 * GET /api/v1/crm/groups
 * 获取客户分组统计
 */
router.get('/groups', async (req, res) => {
  try {
    const [byTier, bySource, byTag] = await Promise.all([
      Customer.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 }, totalSpend: { $sum: '$totalSpend' } } },
      ]),
      Customer.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        byTier,
        bySource,
        byTag,
        totalCustomers: await Customer.countDocuments(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 消费订单 ====================

/**
 * GET /api/v1/crm/orders
 * 获取订单列表
 */
router.get('/orders', async (req, res) => {
  try {
    const { customerId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: orders,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

/**
 * POST /api/v1/crm/orders
 * 创建订单
 */
router.post('/orders', async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      orderNo: `ZFT${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    });

    /** 更新客户消费总额 */
    await Customer.findByIdAndUpdate(order.customerId, {
      $inc: { totalSpend: order.amount, visitCount: 1 },
      lastActiveAt: new Date(),
    });

    res.json({ success: true, data: order, message: '订单创建成功' });
  } catch (err) {
    logger.error('创建订单失败', { error: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

// ==================== 私域导入 ====================

/**
 * POST /api/v1/crm/import-user
 * 导入公域用户到私域
 */
router.post('/import-user', async (req, res) => {
  try {
    const result = await privateDomainEngine.importUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
});

export default router;
