/**
 * 集成中枢 - IntegrationService
 *
 * 打通「中芳堂AI系统」与外部系统的数据闭环：
 *   1. 企业微信 SCRM  —— 客户自动沉淀为外部联系人、欢迎触达
 *   2. 美业 ERP       —— 有赞美业/美团收银/客如云等，双向同步客户与订单
 *   3. 腕家 H1 手表   —— 拉取睡眠/心率/血氧等健康数据进入客户档案
 *   4. Webhook 接收   —— ERP / 小程序订单实时回写 CRM
 *
 * 设计原则：
 *   - 所有外部系统「未配置即降级」，绝不因缺密钥而崩溃
 *   - 采用通用 OpenAPI/Webhook 适配，具体 ERP 仅需配置 apiBase/apiKey
 *   - 失败计入 SyncLog，便于排查
 *
 * @module services/IntegrationService
 */

import axios from 'axios';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';
import { Customer, Order, CustomerInteraction, SyncLog } from './DatabaseService.js';

const logger = createModuleLogger('IntegrationService');

/** ERP 服务商中文名映射 */
const ERP_PROVIDER_LABEL = {
  youzan: '有赞美业',
  meituan: '美团收银',
  keruyun: '客如云',
  generic: '通用 OpenAPI',
};

/** 把字符串布尔统一为布尔 */
const bool = (v) => v === true || v === 'true';

class IntegrationService {
  // ============ 集成清单 ============

  /** 列出所有已接入/可接入的集成及其配置状态 */
  listIntegrations() {
    const weworkOk = !!(config.wework.corpId && config.wework.corpSecret);
    const erpOk = bool(config.erp.enabled) && !!(config.erp.apiBase && config.erp.apiKey);
    const h1Ok = bool(config.wanjiH1.enabled) && !!(config.wanjiH1.appKey);

    return [
      {
        name: 'wework',
        label: '企业微信 SCRM',
        enabled: weworkOk,
        configured: weworkOk,
        description: '客户自动沉淀为企微外部联系人，欢迎语/标签自动同步',
      },
      {
        name: 'erp',
        label: `美业 ERP（${ERP_PROVIDER_LABEL[config.erp.provider] || '未配置'}）`,
        enabled: erpOk,
        configured: erpOk,
        description: '有赞美业/美团收银/客如云等，客户与订单双向同步',
        provider: config.erp.provider,
      },
      {
        name: 'wanjiH1',
        label: '腕家 H1 健康手表',
        enabled: h1Ok,
        configured: h1Ok,
        description: '拉取睡眠/心率/血氧等健康数据，进入客户画像，支撑「数据追踪→循环改善」闭环',
      },
    ];
  }

  // ============ 连通性测试 ============

  /** 测试某个集成的连通性 */
  async testConnection(name) {
    try {
      if (name === 'wework') {
        if (!(config.wework.corpId && config.wework.corpSecret)) {
          return { success: false, message: '企业微信未配置 corpId/corpSecret' };
        }
        const token = await this._weworkToken(config.wework);
        return { success: !!token, message: token ? '企业微信 API 连通正常' : '获取 access_token 失败' };
      }
      if (name === 'erp') {
        if (!bool(config.erp.enabled)) return { success: false, message: 'ERP 未启用（ERP_ENABLED=true）' };
        if (!(config.erp.apiBase && config.erp.apiKey)) return { success: false, message: 'ERP 未配置 apiBase/apiKey' };
        await axios.get(`${config.erp.apiBase}/ping`, { headers: this._erpHeaders(config.erp), timeout: 10000 });
        return { success: true, message: 'ERP API 连通正常' };
      }
      if (name === 'wanjiH1') {
        if (!bool(config.wanjiH1.enabled)) return { success: false, message: '腕家H1未启用' };
        return { success: true, message: '腕家H1 配置就绪（拉取需指定客户）' };
      }
      return { success: false, message: '未知集成：' + name };
    } catch (err) {
      return { success: false, message: '连通失败：' + err.message };
    }
  }

  // ============ ERP 同步 ============

  /**
   * 从 ERP 拉取客户/订单写入 CRM
   * @param {object} [opts]
   * @param {string} [opts.since] 增量时间点（ISO）
   */
  async syncFromERP(opts = {}) {
    const cfg = config.erp;
    if (!bool(cfg.enabled)) {
      return { success: true, synced: 0, skipped: true, reason: 'ERP 未启用（ERP_ENABLED=true 后生效）' };
    }
    if (!(cfg.apiBase && cfg.apiKey)) {
      return { success: false, reason: 'ERP 未配置 ERP_API_BASE / ERP_API_KEY' };
    }

    const log = await SyncLog.create({ source: 'erp', target: 'crm', type: 'customer', status: 'running', startedAt: new Date() });
    let processed = 0;
    let failed = 0;

    try {
      // 1) 拉取客户
      const custResp = await axios.get(`${cfg.apiBase}/customers`, {
        headers: this._erpHeaders(cfg),
        timeout: 15000,
        params: opts.since ? { since: opts.since } : {},
      });
      const customers = this._asList(custResp.data);
      for (const item of customers) {
        try {
          await this._upsertCustomer(this._mapErpCustomer(item));
          processed++;
        } catch (e) {
          failed++;
          logger.error('ERP 客户写入失败', { error: e.message });
        }
      }

      // 2) 拉取订单
      const orderResp = await axios.get(`${cfg.apiBase}/orders`, {
        headers: this._erpHeaders(cfg),
        timeout: 15000,
        params: opts.since ? { since: opts.since } : {},
      });
      const orders = this._asList(orderResp.data);
      for (const item of orders) {
        try {
          await this._upsertOrder(this._mapErpOrder(item));
          processed++;
        } catch (e) {
          failed++;
          logger.error('ERP 订单写入失败', { error: e.message });
        }
      }

      await SyncLog.findByIdAndUpdate(log._id, {
        status: 'success', recordsProcessed: processed, recordsFailed: failed, completedAt: new Date(),
      });
      logger.info('ERP 同步完成', { processed, failed });
      return { success: true, synced: processed, failed, message: `已同步 ${processed} 条，失败 ${failed} 条` };
    } catch (err) {
      await SyncLog.findByIdAndUpdate(log._id, {
        status: 'failed', errorMessage: err.message, completedAt: new Date(),
      });
      logger.error('ERP 同步异常', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  // ============ 企业微信 ============

  /** 把指定客户推送到企业微信外部联系人 */
  async pushCustomerToWework(customerId) {
    const cfg = config.wework;
    if (!(cfg.corpId && cfg.corpSecret)) {
      return { success: false, reason: '企业微信未配置 corpId/corpSecret' };
    }
    const customer = await Customer.findById(customerId);
    if (!customer) return { success: false, reason: '客户不存在' };

    try {
      const token = await this._weworkToken(cfg);
      // 客户联系「添加外部联系人」简化调用（实际需按企微文档补齐 userid 等）
      await axios.post(`${cfg.apiBase}/externalcontact/add_contact_way`, {
        name: customer.nickname || '中芳堂客户',
        type: 1,
        scene: 2,
      }, { params: { access_token: token }, timeout: 10000 });

      await CustomerInteraction.create({
        customerId, type: 'import', channel: 'wework',
        content: `已同步至企业微信外部联系人：${customer.nickname || customer.phone || ''}`,
      });
      logger.info('客户已推送企微', { customerId });
      return { success: true, pushed: customer.nickname || customer.phone };
    } catch (err) {
      logger.error('推送企微失败', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  // ============ 腕家 H1 健康数据 ============

  /** 拉取指定客户的腕家H1健康数据，写入客户档案 */
  async pullWanjiH1(customerId) {
    const cfg = config.wanjiH1;
    if (!bool(cfg.enabled)) {
      return { success: true, reason: '腕家H1 未启用（WANJIA_H1_ENABLED=true 后生效）', metrics: null };
    }
    const customer = await Customer.findById(customerId);
    if (!customer) return { success: false, reason: '客户不存在' };

    const uid = customer.externalId || customer.phone;
    if (!uid) return { success: false, reason: '客户缺少 externalId/phone，无法定位腕家H1账号' };

    try {
      const resp = await axios.get(`${cfg.apiBase}/users/${encodeURIComponent(uid)}/health`, {
        headers: { 'X-App-Key': cfg.appKey, 'X-App-Secret': cfg.appSecret },
        timeout: 15000,
      });
      const metrics = resp.data?.data || resp.data;
      await Customer.findByIdAndUpdate(customerId, { healthMetrics: metrics, lastActiveAt: new Date() });
      await CustomerInteraction.create({
        customerId, type: 'import', channel: 'wanjiH1',
        content: '已同步腕家H1健康数据（睡眠/心率/血氧等）',
      });
      logger.info('腕家H1 数据已同步', { customerId });
      return { success: true, metrics };
    } catch (err) {
      logger.error('腕家H1 拉取失败', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  // ============ Webhook 接收 ============

  /**
   * 接收外部系统 Webhook，实时回写 CRM
   * @param {string} source erp | miniprogram
   * @param {object} payload 规范化载荷
   * @param {string} [signature] 可选签名（用于验签）
   */
  async receiveWebhook(source, payload = {}, signature) {
    // TODO: 生产环境按各平台文档校验 signature，防止伪造
    try {
      if (source === 'erp') {
        if (payload.customer) {
          const c = await this._upsertCustomer(this._mapErpCustomer(payload.customer));
          if (payload.order) {
            await this._upsertOrder({ ...this._mapErpOrder(payload.order), customerId: c._id });
          }
          return { success: true, type: 'erp', customerId: String(c._id) };
        }
        if (payload.order) {
          const o = await this._upsertOrder(this._mapErpOrder(payload.order));
          return { success: true, type: 'erp', orderId: String(o._id) };
        }
        return { success: false, reason: 'ERP Webhook 缺少 customer/order' };
      }

      if (source === 'miniprogram') {
        const c = await this._upsertCustomer({
          source: 'miniprogram',
          externalId: payload.openid,
          nickname: payload.nickname,
          phone: payload.phone,
          constitution: payload.constitution,
          tags: payload.tags || ['小程序'],
        });
        return { success: true, type: 'miniprogram', customerId: String(c._id) };
      }

      return { success: false, reason: '未知 Webhook 来源：' + source };
    } catch (err) {
      logger.error('Webhook 处理失败', { source, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // ============ 内部工具 ============

  _erpHeaders(cfg) {
    return {
      'Authorization': `Bearer ${cfg.apiKey}`,
      'X-API-Secret': cfg.apiSecret || '',
      'Content-Type': 'application/json',
    };
  }

  _asList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data?.list)) return data.data.list;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  async _upsertCustomer(data) {
    const q = data.phone ? { phone: data.phone } : { externalId: data.externalId, source: data.source };
    const update = { ...data, lastActiveAt: new Date() };
    if (!update.importedAt) update.importedAt = new Date();
    return Customer.findOneAndUpdate(q, update, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  async _upsertOrder(data) {
    if (data.orderNo) {
      return Order.findOneAndUpdate(
        { orderNo: data.orderNo },
        { ...data, updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    return Order.create(data);
  }

  _mapErpCustomer(item) {
    return {
      source: 'erp',
      externalId: String(item.id ?? item.customerId ?? item.openid ?? ''),
      nickname: item.name ?? item.nickname ?? '',
      phone: item.mobile ?? item.phone ?? '',
      gender: item.gender ?? 'unknown',
      totalSpend: Number(item.totalSpend ?? item.total_amount ?? 0),
      tags: item.tags ?? [],
      constitution: item.constitution ?? '',
      notes: item.remark ?? item.note ?? '',
    };
  }

  _mapErpOrder(item) {
    return {
      orderNo: item.orderNo ?? item.order_no ?? `ERP${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      customerId: item.customerId ?? null,
      customerName: item.customerName ?? item.customer_name ?? '',
      serviceType: item.serviceType ?? item.service_type ?? item.title ?? 'ERP订单',
      amount: Number(item.amount ?? item.total_fee ?? 0),
      status: (item.status ?? 'paid'),
      source: 'sync',
      staffName: item.staffName ?? item.staff_name ?? '',
      remarks: item.remark ?? '',
    };
  }

  async _weworkToken(cfg) {
    const r = await axios.get(`${cfg.apiBase}/gettoken`, {
      params: { corpid: cfg.corpId, corpsecret: cfg.corpSecret },
      timeout: 10000,
    });
    if (r.data?.errcode !== 0) throw new Error(r.data?.errmsg || '企微获取token失败');
    return r.data.access_token;
  }
}

/** 默认单例 */
const integrationService = new IntegrationService();

export default integrationService;
export { IntegrationService, ERP_PROVIDER_LABEL };
