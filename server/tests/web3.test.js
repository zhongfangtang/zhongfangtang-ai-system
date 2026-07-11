/**
 * 中芳堂AI系统 · Web3 存证引擎单元测试
 * 运行：cd server && node --test tests/
 * 覆盖：哈希计算 / 离线降级存证 / 未启用时验证
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Web3Service } from '../src/services/Web3Service.js';

test('存证哈希计算：相同内容哈希一致，keccak256 32字节', () => {
  const svc = new Web3Service({ web3: { enabled: false } });
  const a = svc.computeHash({ type: 'service', id: 'S001' });
  const b = svc.computeHash({ type: 'service', id: 'S001' });
  const c = svc.computeHash({ type: 'service', id: 'S002' });
  assert.equal(a, b, '相同内容哈希应一致');
  assert.notEqual(a, c, '不同内容哈希应不同');
  assert.match(a, /^0x[0-9a-f]{64}$/, '应为 0x + 64位十六进制');
});

test('未启用链上：存证降级为离线哈希（onChain=false，不报错）', async () => {
  const svc = new Web3Service({ web3: { enabled: false } });
  assert.equal(svc.isEnabled(), false, '未启用');
  const res = await svc.notarize({ type: 'service', payload: { id: 'S001' } });
  assert.equal(res.success, true, '应成功');
  assert.equal(res.onChain, false, '未上链');
  assert.ok(res.hash.startsWith('0x'), '应返回哈希');
});

test('未启用链上：验证返回 verified=null（未启用）', async () => {
  const svc = new Web3Service({ web3: { enabled: false } });
  const hash = svc.computeHash({ foo: 'bar' });
  const res = await svc.verify(hash);
  assert.equal(res.success, true);
  assert.equal(res.verified, null, '未启用时无法验证');
});

test('链信息：未启用时 canWrite=false', () => {
  const svc = new Web3Service({ web3: { enabled: false, network: 'sepolia' } });
  const info = svc.getChainInfo();
  assert.equal(info.enabled, false);
  assert.equal(info.canWrite, false);
  assert.equal(info.chainId, 11155111);
});

test('非法哈希格式：verify 返回错误', async () => {
  const svc = new Web3Service({ web3: { enabled: false } });
  const res = await svc.verify('not-a-hash');
  assert.equal(res.success, false, '非法哈希应失败');
});
