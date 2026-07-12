/**
 * AI图片生成引擎 - ImageGenerator
 *
 * 支持多种免费/低成本方案：
 * 1. Nano Banana Pro (Gemini 3 Pro Image) - 免费
 * 2. 硅基流动 Stable Diffusion - ¥0.001/张
 * 3. Canvas API 本地模板生成 - 零成本降级
 *
 * @module engines/ImageGenerator
 */

import { createModuleLogger } from '../utils/logger.js';
import config from '../../config/default.js';

const logger = createModuleLogger('ImageGenerator');

/** 中芳堂海报模板 */
const POSTER_TEMPLATES = {
  promotion: {
    bg: '#1a1a2e', accent: '#d4a853', font: '#e8e8f0',
    layout: 'vertical',
  },
  education: {
    bg: '#0f2a1a', accent: '#3fb98a', font: '#e8e8f0',
    layout: 'vertical',
  },
  branding: {
    bg: '#1a1a2e', accent: '#d4a853', font: '#ffffff',
    layout: 'centered',
  },
};

export default class ImageGenerator {
  constructor() {
    this.aiEndpoint = config.ai.endpoint;
    this.aiApiKey = config.ai.apiKey;
    this.canUseAI = Boolean(config.ai.apiKey);
    logger.info('图片生成引擎已初始化', { aiAvailable: this.canUseAI });
  }

  /**
   * 生成营销海报
   * @param {Object} options - { type, topic, product, constitution }
   */
  async generatePoster(options) {
    const { type = 'promotion', topic, product, constitution } = options;

    // 尝试AI生成
    if (this.canUseAI) {
      try {
        const aiResult = await this._callImageAI({ type, topic, product, constitution });
        if (aiResult) return aiResult;
      } catch (e) {
        logger.warn('AI图片生成失败，降级模板', { error: e.message });
      }
    }

    // 降级：Canvas模板生成
    return this._generateTemplatePoster({ type, topic, product, constitution });
  }

  /**
   * 生成小红书封面图
   * @param {Object} options
   */
  async generateCover(options) {
    const { title, platform = 'xiaohongshu' } = options;
    return this.generatePoster({
      type: 'branding',
      topic: title,
      product: options.product,
    });
  }

  /**
   * 调用AI图片生成API（OpenAI兼容格式/Nano Banana Pro）
   */
  async _callImageAI(options) {
    const prompt = this._buildImagePrompt(options);

    try {
      const { default: axios } = await import('axios');
      const r = await axios.post(
        `${this.aiEndpoint}/images/generations`,
        {
          model: config.ai.models.image || 'gemini-2.5-pro-image',
          prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url',
        },
        {
          timeout: 60000,
          headers: { Authorization: `Bearer ${this.aiApiKey}` },
        }
      );
      return {
        success: true,
        source: 'ai',
        data: {
          imageUrl: r.data?.data?.[0]?.url || r.data?.url,
          prompt,
          type: options.type,
        },
      };
    } catch (err) {
      logger.warn('AI图片API调用失败', { error: err.message });
      return null;
    }
  }

  /**
   * 构建图片生成提示词
   */
  _buildImagePrompt(options) {
    const { type, topic, product, constitution } = options;
    const brand = '中芳堂中医芳香疗法';

    const prompts = {
      promotion: `Chinese traditional medicine aromatherapy promotional poster, elegant design, gold and dark theme, featuring essential oils and herbs, text "${topic}", brand "${brand}", professional beauty spa style, high quality, 4K`,
      education: `Educational infographic about Traditional Chinese Medicine body constitution types, clean professional design, featuring "${constitution || 'health'}" concept, Chinese medical herbs illustration, brand "${brand}", modern Chinese aesthetic`,
      branding: `Premium brand image for "${brand}", luxury spa atmosphere, essential oil bottles, Chinese medicine elements, warm golden lighting, elegant minimal design, professional photography style`,
    };

    return (prompts[type] || prompts.branding) + `, product: ${product || 'essential oils'}`;
  }

  /**
   * 降级：Canvas模板海报生成（纯本地，零成本）
   * 返回可渲染的HTML/SVG数据
   */
  _generateTemplatePoster(options) {
    const { type, topic, product, constitution } = options;
    const tmpl = POSTER_TEMPLATES[type] || POSTER_TEMPLATES.branding;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="${tmpl.bg}"/>
  <rect x="40" y="40" width="720" height="920" fill="none" stroke="${tmpl.accent}" stroke-width="2" rx="12"/>
  <!-- 品牌标识 -->
  <text x="400" y="120" text-anchor="middle" font-family="serif" font-size="48" fill="${tmpl.accent}" font-weight="bold">中芳堂</text>
  <text x="400" y="160" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${tmpl.font}" opacity="0.6">中医芳香疗法</text>
  <!-- 分隔线 -->
  <line x1="200" y1="190" x2="600" y2="190" stroke="${tmpl.accent}" stroke-width="1" opacity="0.5"/>
  <!-- 主题 -->
  <text x="400" y="260" text-anchor="middle" font-family="sans-serif" font-size="32" fill="${tmpl.font}" font-weight="bold">${topic || '九体辨识精油调理'}</text>
  <!-- 产品 -->
  <text x="400" y="320" text-anchor="middle" font-family="sans-serif" font-size="22" fill="${tmpl.accent}">${product || '九体辨识复方精油'}</text>
  <!-- 体质 -->
  ${constitution ? `<text x="400" y="370" text-anchor="middle" font-family="sans-serif" font-size="20" fill="${tmpl.font}" opacity="0.8">${constitution}专属调理方案</text>` : ''}
  <!-- 特色图标区域（文字模拟） -->
  <g transform="translate(150,420)">
    <text x="100" y="0" text-anchor="middle" font-size="48" fill="${tmpl.accent}">🌿</text>
    <text x="100" y="40" text-anchor="middle" font-size="16" fill="${tmpl.font}">纯天然精油</text>
  </g>
  <g transform="translate(400,420)">
    <text x="100" y="0" text-anchor="middle" font-size="48" fill="${tmpl.accent}">🧘</text>
    <text x="100" y="40" text-anchor="middle" font-size="16" fill="${tmpl.font}">中医辨证</text>
  </g>
  <g transform="translate(650,420)">
    <text x="100" y="0" text-anchor="middle" font-size="48" fill="${tmpl.accent}">💆</text>
    <text x="100" y="40" text-anchor="middle" font-size="16" fill="${tmpl.font}">专业手法</text>
  </g>
  <!-- CTA -->
  <rect x="250" y="580" width="300" height="60" rx="30" fill="${tmpl.accent}"/>
  <text x="400" y="618" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#1a1a2e" font-weight="bold">立即预约体验</text>
  <!-- 底部信息 -->
  <text x="400" y="700" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${tmpl.font}" opacity="0.6">📍 湖北省宜昌市 · 中芳堂门店</text>
  <text x="400" y="740" text-anchor="middle" font-family="sans-serif" font-size="14" fill="${tmpl.font}" opacity="0.4">扫码关注 · 到店有礼</text>
  <!-- 装饰 -->
  <circle cx="40" cy="40" r="30" fill="${tmpl.accent}" opacity="0.15"/>
  <circle cx="760" cy="960" r="40" fill="${tmpl.accent}" opacity="0.1"/>
</svg>`;

    return {
      success: true,
      source: 'template',
      data: {
        imageUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`,
        svgContent,
        type: options.type,
        format: 'svg',
      },
    };
  }
}
