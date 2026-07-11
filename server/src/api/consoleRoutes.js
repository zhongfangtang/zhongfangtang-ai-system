/**
 * 运营后台控制台 API
 *
 * 提供真实可操作的运营能力：
 *  - 内容生成（无 AI 密钥时基于中芳堂知识库组合真草稿；有密钥时走真实 LLM）
 *  - 截流线索管理（真实落库）
 *  - 客户 CRM 管理（真实落库）
 *  - 发布队列（进入审核队列，配置平台密钥后自动发布）
 *  - 系统/引擎状态（真实计数）
 *
 * 全部挂在 authenticate 之后，需登录后调用。
 *
 * @module api/consoleRoutes
 */
import { Router } from 'express';
import axios from 'axios';
import config from '../../config/default.js';
import {
  Content,
  InterceptionLead,
  Customer,
  PublishRecord,
} from '../services/DatabaseService.js';

const router = Router();

// ==================== 中芳堂内容生成知识库（无密钥也能产出真草稿） ====================
const CONSTITUTION = {
  平和质: { kw: ['健康', '平衡', '日常养护'], tone: '温和贴心' },
  气虚质: { kw: ['容易累', '补气', '黄芪', '人参'], tone: '关爱鼓励' },
  阳虚质: { kw: ['怕冷', '温阳', '艾灸', '生姜'], tone: '温暖治愈' },
  阴虚质: { kw: ['干燥', '滋阴', '百合', '玉竹'], tone: '滋润舒缓' },
  痰湿质: { kw: ['虚胖', '祛湿', '薏仁', '茯苓'], tone: '清爽利落' },
  湿热质: { kw: ['长痘', '清热', '绿豆', '菊花'], tone: '清爽通透' },
  血瘀质: { kw: ['暗沉', '活血', '当归', '红花'], tone: '细致专业' },
  气郁质: { kw: ['emo', '疏肝', '玫瑰', '佛手'], tone: '温柔陪伴' },
  特禀质: { kw: ['敏感', '调体', '黄芪', '防风'], tone: '温和谨慎' },
};

const OILS = {
  薰衣草: '舒缓助眠、修护屏障',
  玫瑰: '美白抗衰、调节内分泌',
  茶树: '消炎祛痘、净化肌肤',
  薄荷: '提神醒脑、缓解头痛',
  檀香: '安神冥想、紧致轮廓',
};

const PLATFORM_STYLE = {
  douyin: { name: '抖音', style: '短平快·强钩子', len: 480, emoji: true, tone: '口语化、有梗' },
  xiaohongshu: { name: '小红书', style: '种草笔记·干货', len: 950, emoji: true, tone: '闺蜜感、真实体验' },
  weixin: { name: '公众号', style: '深度长文', len: 1800, emoji: false, tone: '专业权威' },
  kuaishou: { name: '快手', style: '接地气', len: 300, emoji: true, tone: '老铁、实在' },
  bilibili: { name: 'B站', style: '知识科普', len: 2800, emoji: false, tone: '硬核科普' },
  baijiahao: { name: '百家号', style: '专业深度', len: 1800, emoji: false, tone: 'SEO友好' },
};

const LOCAL_TAGS = ['宜昌生活', '宜昌美业', '宜昌美容', '宜昌养生', '宜昌探店', '湖北宜昌'];

const PRODUCTS = ['九体辨识复方精油', '腕家H1健康手表', '中医芳香疗法套餐', '节气调理膏方'];

function buildPrompt({ platform, constitution, topic }) {
  const ps = PLATFORM_STYLE[platform] || PLATFORM_STYLE.xiaohongshu;
  const ct = CONSTITUTION[constitution] || CONSTITUTION['平和质'];
  return `你是中芳堂中医芳香疗法品牌的资深内容策划。请为${ps.name}平台写一篇关于「${topic}」的营销内容。
要求：面向${constitution}人群（关键词：${ct.kw.join('、')}），语气${ct.tone}，平台风格${ps.style}。
必须包含：中芳堂品牌、至少1款精油（薰衣草/玫瑰/茶树/薄荷/檀香）、宜昌到店引导、3-5个话题标签。
只返回正文，不要解释。`;
}

function composeDraft({ platform, constitution, topic, type }) {
  const ps = PLATFORM_STYLE[platform] || PLATFORM_STYLE.xiaohongshu;
  const ct = CONSTITUTION[constitution] || CONSTITUTION['平和质'];
  const oilEntries = Object.entries(OILS);
  const pickOil = oilEntries[Math.floor(Math.random() * oilEntries.length)];
  const [oilName, oilEffect] = pickOil;
  const prod = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
  const e = ps.emoji ? '💆' : '';
  const title = `${ps.name}姐妹看过来｜${constitution}总是${ct.kw[0]}？中芳堂这瓶${oilName}精油帮到你${e}`;
  const body =
`大家好，我是中芳堂芳香疗法调理师。今天想跟${ps.name}的姐妹聊聊「${topic}」。

很多${constitution}的朋友跟我说，平时${ct.kw.join('、')}，整个人${ct.tone}。其实中医讲"九体辨识、辨证调体"，找到自己的体质，用对精油，居家就能内调外养。

这次给大家推荐：${oilName}精油——${oilEffect}。配合我们的「${prod}」，在家推拿按摩+到店专业芳香疗法，双管齐下。

📍宜昌的姐妹可以直接来中芳堂门店体验，师傅一对一帮你辨体质、定方案。第一次来记得说是${ps.name}看到的，有到店礼~

${ct.kw.map((k) => `· ${k}`).join('\n')}`;

  const hashtags = [
    `#${constitution}调理`,
    `#${oilName}精油`,
    `#宜昌美容`,
    ...LOCAL_TAGS.slice(0, 3).map((t) => `#${t}`),
  ];
  const keyPoints =
    type === 'video'
      ? [
          '钩子：你是不是也总提不起劲/长痘/睡不好',
          `痛点：${constitution}的3个典型表现`,
          `方案：${oilName}精油居家推拿手法演示`,
          '到店引导：中芳堂宜昌店可一对一辨体质',
          '互动：评论你的体质，我帮你配精油',
        ]
      : ['开头：身份背书+话题切入', `痛点：${ct.kw.join('、')}`, `方案：${oilName}精油+${prod}`, '到店CTA+福利', '引导评论互动'];
  return {
    title,
    body,
    hashtags,
    keyPoints,
    tags: [constitution, oilName, ...ct.kw],
    products: [prod],
  };
}

async function tryLLM(prompt) {
  if (!config.ai.apiKey) return null;
  try {
    const r = await axios.post(
      `${config.ai.endpoint}/chat/completions`,
      {
        model: config.ai.models.text,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.8,
      },
      { timeout: 30000, headers: { Authorization: `Bearer ${config.ai.apiKey}` } }
    );
    return r.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    return null;
  }
}

// ==================== 系统状态 ====================
router.get('/status', async (req, res) => {
  try {
    const [content, leads, customers, publishes] = await Promise.all([
      Content.countDocuments(),
      InterceptionLead.countDocuments(),
      Customer.countDocuments(),
      PublishRecord.countDocuments(),
    ]);
    res.json({
      success: true,
      data: {
        engines: {
          content: 'running',
          interception: 'running',
          privateDomain: 'running',
          geo: 'placeholder',
          publish: 'running',
        },
        aiMode: config.ai.apiKey ? 'llm' : 'knowledge-base',
        counts: { content, leads, customers, publishes },
        uptime: Math.floor(process.uptime()),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== 内容管理 ====================
router.get('/content', async (req, res) => {
  const list = await Content.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: list });
});

router.post('/content/generate', async (req, res) => {
  try {
    const {
      platform = 'xiaohongshu',
      constitution = '平和质',
      topic = '九体辨识精油调理',
      type = 'article',
    } = req.body;
    let body = await tryLLM(buildPrompt({ platform, constitution, topic }));
    let aiGenerated = false;
    let draft;
    if (body) {
      aiGenerated = true;
      draft = { title: topic, body, hashtags: [`#${constitution}调理`, '#中芳堂精油'], keyPoints: [], tags: [constitution], products: [] };
    } else {
      draft = composeDraft({ platform, constitution, topic, type });
    }
    const doc = await Content.create({
      title: draft.title,
      body: draft.body,
      platform,
      type,
      hashtags: draft.hashtags,
      tags: draft.tags,
      constitution,
      products: draft.products,
      aiGenerated,
      generatedBy: req.user?.userId || 'console',
      status: 'draft',
      metadata: { keyPoints: draft.keyPoints },
    });
    res.json({ success: true, data: doc, message: aiGenerated ? 'AI 已生成并保存' : '已基于知识库生成真草稿并保存' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/content/:id/status', async (req, res) => {
  const d = await Content.findByIdAndUpdate(req.params.id, { status: req.body.status, updatedAt: new Date() }, { new: true });
  if (!d) return res.status(404).json({ success: false, message: '内容不存在' });
  res.json({ success: true, data: d });
});

router.post('/content/:id/publish', async (req, res) => {
  const c = await Content.findById(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: '内容不存在' });
  const rec = await PublishRecord.create({
    contentId: c._id,
    platform: c.platform,
    accountId: req.body.accountId || 'default',
    title: c.title,
    status: 'reviewing',
  });
  await Content.findByIdAndUpdate(c._id, { status: 'pending', updatedAt: new Date() });
  res.json({ success: true, data: rec, message: '已进入发布审核队列（配置平台密钥后自动发布）' });
});

// ==================== 截流线索 ====================
router.get('/leads', async (req, res) => {
  const list = await InterceptionLead.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: list });
});

router.post('/leads', async (req, res) => {
  const { platform, authorName, content, location, source = 'comment', matchedKeywords = [], intentScore = 50, note = '' } = req.body;
  if (!platform || !content) return res.status(400).json({ success: false, message: 'platform 与 content 必填' });
  const d = await InterceptionLead.create({
    platform,
    authorName,
    content,
    location,
    source,
    matchedKeywords,
    intentScore: Number(intentScore) || 0,
    isHighPotential: (Number(intentScore) || 0) >= 70,
    note,
    status: 'new',
  });
  res.json({ success: true, data: d, message: '线索已捕获并入库' });
});

router.put('/leads/:id/status', async (req, res) => {
  const d = await InterceptionLead.findByIdAndUpdate(req.params.id, { status: req.body.status, updatedAt: new Date() }, { new: true });
  if (!d) return res.status(404).json({ success: false, message: '线索不存在' });
  res.json({ success: true, data: d });
});

// ==================== 客户 CRM ====================
router.get('/customers', async (req, res) => {
  const list = await Customer.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: list });
});

router.post('/customers', async (req, res) => {
  const { nickname, phone, gender = 'unknown', tier = 'C', constitution, concerns = [], notes = '' } = req.body;
  if (!nickname) return res.status(400).json({ success: false, message: 'nickname 必填' });
  const d = await Customer.create({ nickname, phone, gender, tier, constitution, concerns, notes, status: 'new' });
  res.json({ success: true, data: d, message: '客户已建档' });
});

export default router;
