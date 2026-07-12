/**
 * AIGC美业专属内容生成引擎 - ContentGenerator
 *
 * 基于中芳堂九体辨识、精油、膏方、皮肤管理知识库，
 * 生成适配各平台调性的营销内容。
 *
 * 功能：
 * - LBS精准定位算法（锁定同城美业圈层）
 * - 营销文案生成（适配各平台调性）
 * - 短视频分镜脚本生成
 * - 营销海报/配图描述生成
 * - 话题标签智能匹配
 * - 同城流量标签挂载
 *
 * @module engines/ContentGenerator
 */

import axios from 'axios';
import config from '../../config/default.js';
import { createModuleLogger } from '../utils/logger.js';
import complianceService from '../services/ComplianceService.js';
import { parseModelJSON } from '../utils/safeJson.js';

const logger = createModuleLogger('ContentGenerator');

/** 中芳堂知识库 - 九体辨识 */
const CONSTITUTION_KNOWLEDGE = {
  '平和质': { keywords: ['健康', '平衡', '养护'], tone: '温和' },
  '气虚质': { keywords: ['补气', '乏力', '黄芪', '人参'], tone: '关爱' },
  '阳虚质': { keywords: ['怕冷', '温阳', '艾灸', '生姜'], tone: '温暖' },
  '阴虚质': { keywords: ['干燥', '滋阴', '百合', '玉竹'], tone: '滋润' },
  '痰湿质': { keywords: ['肥胖', '祛湿', '薏仁', '茯苓'], tone: '清新' },
  '湿热质': { keywords: ['痘痘', '清热', '绿豆', '菊花'], tone: '清爽' },
  '血瘀质': { keywords: ['斑点', '活血', '当归', '红花'], tone: '细致' },
  '气郁质': { keywords: ['郁闷', '疏肝', '玫瑰', '佛手'], tone: '舒缓' },
  '特禀质': { keywords: ['过敏', '调体', '黄芪', '防风'], tone: '温和' },
};

/** 精油知识库 */
const ESSENTIAL_OIL_KNOWLEDGE = {
  '薰衣草': { effects: ['舒缓', '助眠', '修复'], scenarios: ['失眠', '焦虑', '皮肤修复'] },
  '玫瑰': { effects: ['美白', '抗衰', '调节内分泌'], scenarios: ['暗沉', '衰老', '经期不适'] },
  '茶树': { effects: ['消炎', '祛痘', '净化'], scenarios: ['痘痘肌', '头皮屑', '脚气'] },
  '薄荷': { effects: ['提神', '止痛', '清凉'], scenarios: ['头痛', '疲劳', '暑热'] },
  '檀香': { effects: ['安神', '冥想', '紧致'], scenarios: ['失眠', '焦虑', '松弛'] },
};

/** 各平台内容调性配置 */
const PLATFORM_STYLES = {
  douyin: { maxLength: 500, style: '短平快', hashtagStyle: '热门话题', emoji: true },
  xiaohongshu: { maxLength: 1000, style: '种草笔记', hashtagStyle: '精准标签', emoji: true },
  weixin: { maxLength: 2000, style: '深度长文', hashtagStyle: '品牌话题', emoji: false },
  kuaishou: { maxLength: 300, style: '接地气', hashtagStyle: '老铁风格', emoji: true },
  bilibili: { maxLength: 3000, style: '知识科普', hashtagStyle: '圈层标签', emoji: false },
  baijiahao: { maxLength: 2000, style: '专业深度', hashtagStyle: 'SEO标签', emoji: false },
};

/** 宜昌同城标签 */
const LOCAL_TAGS = [
  '宜昌生活', '宜昌美业', '宜昌美容', '宜昌养生',
  '宜昌探店', '宜昌同城', '湖北宜昌', '宜昌好店',
];

/** 美业通用标签 */
const BEAUTY_TAGS = [
  '护肤', '美容', '养生', '精油', '芳疗',
  '中医美容', '体质调理', '肩颈护理', '面部SPA',
  '全身按摩', '经络疏通', '艾灸', '刮痧', '拔罐',
];

export default class ContentGenerator {
  constructor() {
    this.aiEndpoint = config.ai.endpoint;
    this.aiApiKey = config.ai.apiKey;
    this.storeLocation = {
      lat: config.store.latitude,
      lng: config.store.longitude,
      name: config.store.name,
      city: '宜昌',
    };

    logger.info('内容生成引擎已初始化', {
      store: this.storeLocation.name,
      city: this.storeLocation.city,
    });
  }

  /**
   * 生成营销文案
   *
   * @param {Object} options - 生成选项
   * @param {string} options.platform - 目标平台
   * @param {string} options.topic - 内容主题
   * @param {string} [options.constitution] - 体质类型
   * @param {string[]} [options.products] - 涉及产品
   * @param {string} [options.tone] - 文案调性
   * @returns {Promise<Object>} 生成的文案
   */
  async generateCopywriting(options) {
    const { platform, topic, constitution, products = [], tone = '专业温暖' } = options;
    const platformStyle = PLATFORM_STYLES[platform] || PLATFORM_STYLES.xiaohongshu;

    logger.info('开始生成营销文案', { platform, topic });

    try {
      /** 构建知识库上下文 */
      const knowledgeContext = this._buildKnowledgeContext(constitution, products);

      /** 生成 LBS 定位标签 */
      const lbsTags = this._generateLbsTags();

      /** 匹配话题标签 */
      const hashtags = this._matchHashtags(platform, topic, constitution);

      const prompt = `你是一名资深美业内容营销专家，为"${this.storeLocation.name}"（位于${this.storeLocation.city}）撰写${platformStyle.style}风格文案。

主题：${topic}
目标平台：${platform}（${platformStyle.style}）
文案调性：${tone}
知识参考：${knowledgeContext}
字数限制：${platformStyle.maxLength}字以内

要求：
1. 标题吸引人，前5个字抓眼球
2. 融入专业中医养生知识但不生硬
3. 自然提及门店所在城市（宜昌）
4. 结尾有软性引导，不硬广
5. ${platformStyle.emoji ? '适当使用表情符号' : '保持专业严谨'}
6. 包含以下标签：${hashtags.join(' ')}

请输出JSON格式：{"title": "...", "content": "...", "hashtags": [...]}`;

      const generated = complianceService.sanitizeFields(await this._callAI(prompt));

      /** 追加LBS标签 */
      const allTags = [...(generated.hashtags || []), ...lbsTags.slice(0, 3)];

      return {
        success: true,
        data: {
          title: generated.title || '',
          body: generated.content || '',
          hashtags: [...new Set(allTags)],
          platform,
          generatedAt: new Date().toISOString(),
        },
        message: '文案生成成功',
      };
    } catch (err) {
      logger.error('文案生成失败', { error: err.message, platform, topic });
      return this._fallbackCopywriting(platform, topic, constitution);
    }
  }

  /**
   * 生成短视频分镜脚本
   *
   * @param {Object} options - 生成选项
   * @param {string} options.topic - 视频主题
   * @param {number} [options.duration=60] - 视频时长(秒)
   * @param {string} options.platform - 目标平台
   * @returns {Promise<Object>} 分镜脚本
   */
  async generateVideoScript(options) {
    const { topic, duration = 60, platform } = options;

    logger.info('开始生成分镜脚本', { topic, duration, platform });

    try {
      const prompt = `你是一名短视频导演，为"${this.storeLocation.name}"设计一条${duration}秒的短视频分镜脚本。

主题：${topic}
平台：${platform}
时长：${duration}秒

请按5-8个镜头设计，每个镜头包含：
- 画面描述（场景、人物、动作）
- 台词/旁白
- 时长
- 运镜方式
- 特效/转场

开场前3秒必须抓眼球。结尾引导关注和到店体验。
请输出JSON格式：{"title": "...", "scenes": [{"number": 1, "description": "...", "narration": "...", "duration": 5, "camera": "...", "transition": "..."}]}`;

      const generated = await this._callAI(prompt);

      return {
        success: true,
        data: {
          title: generated.title || topic,
          scenes: generated.scenes || [],
          totalDuration: duration,
          platform,
        },
        message: '分镜脚本生成成功',
      };
    } catch (err) {
      logger.error('分镜脚本生成失败', { error: err.message });
      return { success: false, data: null, message: `生成失败: ${err.message}` };
    }
  }

  /**
   * 生成营销海报/配图描述
   *
   * @param {Object} options - 生成选项
   * @param {string} options.type - 海报类型 (promotion/education/branding)
   * @param {string} options.topic - 主题
   * @param {string} [options.product] - 产品名称
   * @returns {Promise<Object>} 海报描述
   */
  async generatePosterDescription(options) {
    const { type, topic, product } = options;

    logger.info('开始生成海报描述', { type, topic });

    try {
      const typeDescriptions = {
        promotion: '促销活动海报',
        education: '���识科普海报',
        branding: '品牌形象海报',
      };

      const prompt = `为"${this.storeLocation.name}"设计一张${typeDescriptions[type] || '营销海报'}。

主题：${topic}${product ? `\n产品：${product}` : ''}
类型：${type}

请描述：
1. 视觉风格（色彩、氛围）
2. 主标题文案（10字以内）
3. 副标题/卖点（20字以内）
4. 主体元素（图片/插画描述）
5. 排版布局建议
6. CTA按钮文案

请输出JSON格式：{"style": "...", "mainTitle": "...", "subTitle": "...", "visualElements": "...", "layout": "...", "cta": "..."}`;

      const generated = await this._callAI(prompt);

      return {
        success: true,
        data: {
          ...generated,
          type,
          store: this.storeLocation.name,
        },
        message: '海报描述生成成功',
      };
    } catch (err) {
      logger.error('海报描述生成失败', { error: err.message });
      return { success: false, data: null, message: `生成失败: ${err.message}` };
    }
  }

  /**
   * 智能匹配话题标签
   *
   * @param {string} platform - 目标平台
   * @param {string} topic - 内容主题
   * @param {string} [constitution] - 体质类型
   * @returns {string[]} 匹配的标签列表
   */
  _matchHashtags(platform, topic, constitution) {
    const tags = new Set();

    /** 同城标签 */
    tags.add(LOCAL_TAGS[Math.floor(Math.random() * LOCAL_TAGS.length)]);

    /** 美业通用标签 */
    const topicLower = topic.toLowerCase();
    for (const tag of BEAUTY_TAGS) {
      if (topicLower.includes(tag) || topicLower.includes(tag.replace('SPA', '').toLowerCase())) {
        tags.add(tag);
      }
    }

    /** 体质相关标签 */
    if (constitution && CONSTITUTION_KNOWLEDGE[constitution]) {
      const kw = CONSTITUTION_KNOWLEDGE[constitution].keywords;
      tags.add(kw[0]);
    }

    /** 平台热门标签 */
    const platformHotTags = {
      douyin: ['美容护肤', '养生日常', '宜昌'],
      xiaohongshu: ['护肤分享', '芳疗', '中医养生'],
      kuaishou: ['美容', '养生', '同城'],
      bilibili: ['科普', '中医', '护肤'],
      baijiahao: ['健康', '养生', '美容'],
    };

    const hot = platformHotTags[platform] || [];
    hot.forEach((t) => tags.add(t));

    /** 门店标签 */
    tags.add('中芳堂');
    tags.add('中医芳疗');

    return [...tags].slice(0, 8);
  }

  /**
   * 生成LBS精准定位标签
   *
   * @returns {string[]} LBS标签列表
   */
  _generateLbsTags() {
    const lbsTags = [...LOCAL_TAGS];

    /** 根据门店位置生成周边商圈标签 */
    const districtTags = ['宜昌CBD', '宜昌万达', '宜昌水悦城', '宜昌国贸'];
    lbsTags.push(districtTags[Math.floor(Math.random() * districtTags.length)]);

    return lbsTags;
  }

  /**
   * 构建知识库上下文
   *
   * @param {string} [constitution] - 体质类型
   * @param {string[]} [products] - 产品列表
   * @returns {string} 知识上下文
   */
  _buildKnowledgeContext(constitution, products = []) {
    const parts = [];

    if (constitution && CONSTITUTION_KNOWLEDGE[constitution]) {
      const ck = CONSTITUTION_KNOWLEDGE[constitution];
      parts.push(`体质类型：${constitution}，特征关键词：${ck.keywords.join('、')}，沟通调性：${ck.tone}`);
    }

    for (const product of products) {
      if (ESSENTIAL_OIL_KNOWLEDGE[product]) {
        const ek = ESSENTIAL_OIL_KNOWLEDGE[product];
        parts.push(`${product}精油：功效${ek.effects.join('、')}，适用场景${ek.scenarios.join('、')}`);
      }
    }

    return parts.join('；') || '通用中医养生美业知识';
  }

  /**
   * 调用AI模型生成内容
   *
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} AI生成的JSON结果
   */
  async _callAI(prompt) {
    /** 如果未配置API Key，返回模拟数据用于开发调试 */
    if (!this.aiApiKey) {
      logger.warn('AI API Key 未配置，使用模拟数据（低成本：配置硅基流动/DeepSeek免费额度即可真实调用）');
      return this._getMockResponse(prompt);
    }

    let lastError;
    for (let attempt = 1; attempt <= config.ai.request.maxRetries; attempt++) {
      try {
        // OpenAI 兼容格式（适配硅基流动/DeepSeek/通义千问兼容模式等免费模型）
        const response = await axios.post(
          `${this.aiEndpoint}/chat/completions`,
          {
            model: config.ai.models.text,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.aiApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: config.ai.request.timeout,
          },
        );

        const content = response.data?.choices?.[0]?.message?.content || '';
        return this._parseAIResponse(content);
      } catch (err) {
        lastError = err;
        logger.warn(`AI调用失败，第${attempt}次重试`, { error: err.message });
        if (attempt < config.ai.request.maxRetries) {
          await new Promise((r) => setTimeout(r, config.ai.request.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * 解析AI返回的JSON内容
   *
   * @param {string} content - AI返回文本
   * @returns {Object} 解析后的对象
   */
  _parseAIResponse(content) {
    const parsed = parseModelJSON(content);
    if (parsed && (parsed.title || parsed.content)) {
      return parsed;
    }
    logger.warn('AI返回内容JSON解析失败，使用文本原样');
    return {
      title: '',
      content,
      hashtags: [],
    };
  }

  /**
   * 获取模拟响应（开发调试用）
   *
   * @param {string} prompt - 提示词
   * @returns {Object} 模拟数据
   */
  _getMockResponse(prompt) {
    return {
      title: '【宜昌美业】中芳堂中医芳疗，给肌肤一次深呼吸',
      content: '在宜昌这座山水之城，中芳堂以千年中医智慧结合现代芳疗科技，'
        + '为您定制专属体质调理方案。无论是气虚乏力还是湿气困扰，'
        + '我们的九体辨识系统都能精准识别，搭配纯天然精油配方，'
        + '让您由内而外焕发光彩。\n\n'
        + '✨ 特色项目：九体辨识 | 精油SPA | 经络疏通\n'
        + '📍 宜昌中芳堂 · 预约体验请私信',
      hashtags: ['中医芳疗', '宜昌美业', '体质调理', '精油SPA', '中芳堂'],
    };
  }

  /**
   * 降级方案：使用模板生成文案
   *
   * @param {string} platform - 平台
   * @param {string} topic - 主题
   * @param {string} [constitution] - 体质
   * @returns {Object} 模板文案
   */
  _fallbackCopywriting(platform, topic, constitution) {
    logger.warn('使用降级模板生成文案', { platform, topic });

    const templates = [
      {
        title: `${this.storeLocation.name} | ${topic}`,
        body: `在宜昌，有一家专注中医芳疗的养生馆——${this.storeLocation.name}。`
          + `我们传承千年中医智慧，融合现代精油芳疗，为您带来${topic}的全新体验。`
          + `到店即可享受专业体质测评，定制专属调理方案。`
          + `地址：${config.store.address}，期待您的光临。`,
      },
    ];

    const tmpl = templates[0];
    const cleaned = complianceService.sanitizeFields({
      title: tmpl.title,
      body: tmpl.body,
      hashtags: this._matchHashtags(platform, topic, constitution),
    });
    return {
      success: true,
      data: {
        title: cleaned.title,
        body: cleaned.body,
        hashtags: cleaned.hashtags,
        platform,
        generatedAt: new Date().toISOString(),
        source: 'fallback-template',
      },
      message: '使用模板生成文案（AI服务暂不可用）',
    };
  }
}

export { CONSTITUTION_KNOWLEDGE, ESSENTIAL_OIL_KNOWLEDGE, PLATFORM_STYLES, LOCAL_TAGS, BEAUTY_TAGS };
