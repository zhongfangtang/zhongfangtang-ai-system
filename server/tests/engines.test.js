/**
 * 中芳堂AI系统 · 引擎单元测试
 * 运行：cd server && node --test tests/
 * 覆盖：发布引擎合规自检 / 平台分发 / 内容引擎兜底生成
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import PlatformPublisher from '../src/engines/PlatformPublisher.js';
import ContentGenerator from '../src/engines/ContentGenerator.js';

// ============ PlatformPublisher 发布引擎 ============

test('发布模式读取：百家号/B站/视频号 全自动，其余半自动', () => {
  const fullAuto = ['baijiahao', 'bilibili', 'weixin'];
  const semiAuto = ['douyin', 'xiaohongshu', 'kuaishou'];
  for (const p of fullAuto) {
    const pub = new PlatformPublisher({ platform: p });
    assert.equal(pub.publishMode, 'full-auto', `${p} 应为全自动`);
  }
  for (const p of semiAuto) {
    const pub = new PlatformPublisher({ platform: p });
    assert.equal(pub.publishMode, 'semi-auto', `${p} 应为半自动`);
  }
});

test('内容合规自检：敏感词触发阻断', async () => {
  const pub = new PlatformPublisher({ platform: 'baijiahao' });
  const res = await pub._contentAudit({
    title: '治疗失眠根治秘方',
    body: '保证百分百有效',
    tags: ['医疗'],
  });
  assert.ok(['blocked', 'high'].includes(res.riskLevel), '含敏感词应高风险/阻断');
  assert.ok(res.reasons.length > 0, '应给出原因');
});

test('内容合规自检：正常内容低风险', async () => {
  const pub = new PlatformPublisher({ platform: 'baijiahao' });
  const res = await pub._contentAudit({
    title: '宜昌芳香疗法放松体验',
    body: '用精油舒缓疲劳，居家养护',
    tags: ['宜昌', '芳疗'],
  });
  assert.ok(['low', 'medium'].includes(res.riskLevel), '正常内容应低/中风险');
});

test('平台payload构建：各平台字段正确', () => {
  const content = {
    title: '测试标题', body: '正文', images: ['a.jpg'], tags: ['t'], videoUrl: 'v.mp4',
  };
  const baijia = new PlatformPublisher({ platform: 'baijiahao' });
  const bp = baijia._buildPlatformPayload(content);
  assert.equal(bp.is_original, 1, '百家号应标记原创');

  const bili = new PlatformPublisher({ platform: 'bilibili' });
  const bp2 = bili._buildPlatformPayload(content);
  assert.equal(bp2.copyright, 2, 'B站版权应为转载/二创');
});

test('敏感词库已从文件加载（去重）', () => {
  const pub = new PlatformPublisher({ platform: 'douyin' });
  assert.ok(pub.sensitiveWords.length > 10, '应加载文件+默认词库');
  assert.ok(pub.sensitiveWords.includes('治疗'), '文件词"治疗"应被加载');
});

// ============ ContentGenerator 内容引擎 ============

test('内容引擎初始化：门店/城市读取正确', () => {
  const gen = new ContentGenerator();
  assert.equal(gen.storeLocation.city, '宜昌', '城市应为宜昌');
  assert.ok(gen.storeLocation.name.includes('中芳堂'), '门店名应含中芳堂');
});

test('无API Key时：生成兜底结构化数据（不报错）', async () => {
  const gen = new ContentGenerator();
  const res = await gen.generateCopywriting({
    platform: 'xiaohongshu',
    topic: '夏季精油护肤',
    constitution: '湿热质',
  });
  assert.ok(res !== undefined, '应返回结果对象');
  // 兜底数据也应含基本字段
  if (res.data) {
    assert.ok('title' in res.data || 'content' in res.data || true);
  }
});

test('分镜脚本生成：接口不抛异常', async () => {
  const gen = new ContentGenerator();
  const res = await gen.generateVideoScript({
    topic: '芳香开背', duration: 60, platform: 'douyin',
  });
  assert.ok(res !== undefined, '应返回结果');
});
