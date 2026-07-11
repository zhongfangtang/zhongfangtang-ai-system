/**
 * 中芳堂AI系统 · 集成中枢单元测试
 * 运行：cd server && node --test tests/
 * 覆盖：集成清单 / ERP 客户订单映射（纯函数，无需数据库）
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { IntegrationService } from '../src/services/IntegrationService.js';

const svc = new IntegrationService();

test('集成清单：返回 3 类集成且字段完整', () => {
  const list = svc.listIntegrations();
  assert.equal(list.length, 3);
  const names = list.map((i) => i.name).sort();
  assert.deepEqual(names, ['erp', 'wanjiH1', 'wework']);
  for (const it of list) {
    assert.equal(typeof it.enabled, 'boolean');
    assert.equal(typeof it.label, 'string');
  }
});

test('ERP 客户映射：字段归一化正确', () => {
  const c = svc._mapErpCustomer({
    id: 'C1001', name: '王芳', mobile: '13800001111', totalSpend: '2580',
    tags: ['VIP'], remark: '敏感肌',
  });
  assert.equal(c.externalId, 'C1001');
  assert.equal(c.nickname, '王芳');
  assert.equal(c.phone, '13800001111');
  assert.equal(c.totalSpend, 2580); // 字符串转数字
  assert.deepEqual(c.tags, ['VIP']);
  assert.equal(c.source, 'erp');
});

test('ERP 订单映射：orderNo 缺失自动生成', () => {
  const o = svc._mapErpOrder({ customerId: 'C1001', amount: 880, status: 'paid', title: '芳香开背' });
  assert.match(o.orderNo, /^ERP/, '应自动生成 ERP 前缀单号');
  assert.equal(o.amount, 880);
  assert.equal(o.serviceType, '芳香开背');
  assert.equal(o.source, 'sync');
});

test('ERP 订单映射：保留原始 orderNo', () => {
  const o = svc._mapErpOrder({ orderNo: 'YZ20240601001', amount: 1200 });
  assert.equal(o.orderNo, 'YZ20240601001');
});

test('未启用 ERP 时 syncFromERP 降级返回 skipped', async () => {
  const r = await svc.syncFromERP();
  assert.equal(r.skipped, true, '默认 ERP 未启用应跳过');
});
