/**
 * AI密钥管理与模型路由服务 - AIModelRouter
 *
 * 统一管理多个AI模型的API密钥、自动路由、故障切换。
 * 支持：硅基流动(免费) / DeepSeek / 通义千问 / Gemini
 *
 * 市场最佳实践：
 * - 多模型自动降级（主模型故障→备用模型）
 * - 用量统计与限流
 * - 密钥轮换（避免单点泄漏）
 *
 * @module services/AIModelRouter
 */

import { createModuleLogger } from '../utils/logger.js';
import config from '../../config/default.js';

const logger = createModuleLogger('AIModelRouter');

/** 模型提供商配置 */
const PROVIDERS = {
  siliconflow: {
    name: '硅基流动',
    endpoint: 'https://api.siliconflow.cn/v1',
    models: {
      text: 'Qwen/Qwen2.5-7B-Instruct',
      image: 'stabilityai/stable-diffusion-xl-base-1.0',
      vision: 'Qwen/Qwen2-VL-72B-Instruct',
    },
    free: true,
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    models: {
      text: 'deepseek-chat',
      code: 'deepseek-coder',
    },
    free: false,
  },
  qwen: {
    name: '通义千问',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: {
      text: 'qwen-plus',
      image: 'wanx-v1',
    },
    free: false,
  },
  gemini: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    models: {
      text: 'gemini-2.5-pro',
      image: 'gemini-2.5-pro-image',
    },
    free: true,
  },
};

export default class AIModelRouter {
  constructor() {
    this.providers = {};
    this.usageStats = {};
    this.activeModel = null;

    // 初始化各提供商
    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const apiKey = config.ai[`${key}ApiKey`] || config.ai.apiKey;
      if (apiKey) {
        this.providers[key] = { ...provider, apiKey };
      }
    }

    // 默认使用配置的主模型
    this.activeModel = config.ai.provider || 'siliconflow';
    logger.info('AI模型路由初始化', {
      providers: Object.keys(this.providers).length,
      active: this.activeModel,
    });
  }

  /**
   * 调用AI模型（自动路由+故障切换）
   * @param {string} prompt - 提示词
   * @param {Object} options - { model, temperature, maxTokens, type }
   */
  async chat(prompt, options = {}) {
    const model = options.model || 'text';
    const providers = this._getProviderOrder();

    for (const providerKey of providers) {
      const provider = this.providers[providerKey];
      if (!provider) continue;

      try {
        const result = await this._callProvider(provider, prompt, model, options);
        this._recordUsage(providerKey, true);
        return { success: true, provider: providerKey, data: result };
      } catch (err) {
        logger.warn(`模型 ${providerKey} 调用失败`, { error: err.message });
        this._recordUsage(providerKey, false);
        continue; // 故障切换
      }
    }

    return { success: false, error: '所有AI模型不可用' };
  }

  /**
   * 生成图片
   */
  async generateImage(prompt, options = {}) {
    const providers = this._getProviderOrder();
    for (const providerKey of providers) {
      const provider = this.providers[providerKey];
      if (!provider || !provider.models.image) continue;
      try {
        const result = await this._callImageProvider(provider, prompt, options);
        return { success: true, provider: providerKey, data: result };
      } catch (err) {
        continue;
      }
    }
    return { success: false, error: '所有图片模型不可用' };
  }

  /**
   * 获取用量统计
   */
  getUsageStats() {
    return this.usageStats;
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels() {
    const models = [];
    for (const [key, provider] of Object.entries(this.providers)) {
      for (const [type, model] of Object.entries(provider.models)) {
        models.push({ provider: key, providerName: provider.name, type, model, free: provider.free });
      }
    }
    return models;
  }

  // 私有方法
  _getProviderOrder() {
    // 活跃模型优先，免费模型次之
    const order = [this.activeModel];
    for (const key of Object.keys(this.providers)) {
      if (key !== this.activeModel) order.push(key);
    }
    return order;
  }

  async _callProvider(provider, prompt, modelType, options) {
    const { default: axios } = await import('axios');
    const modelName = provider.models[modelType] || provider.models.text;
    const r = await axios.post(
      `${provider.endpoint}/chat/completions`,
      {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      },
      {
        timeout: options.timeout || 30000,
        headers: { Authorization: `Bearer ${provider.apiKey}` },
      }
    );
    return r.data?.choices?.[0]?.message?.content || '';
  }

  async _callImageProvider(provider, prompt, options) {
    const { default: axios } = await import('axios');
    const modelName = provider.models.image;
    const r = await axios.post(
      `${provider.endpoint}/images/generations`,
      { model: modelName, prompt, n: 1, size: options.size || '1024x1024' },
      { timeout: 60000, headers: { Authorization: `Bearer ${provider.apiKey}` } }
    );
    return { url: r.data?.data?.[0]?.url, prompt };
  }

  _recordUsage(provider, success) {
    if (!this.usageStats[provider]) {
      this.usageStats[provider] = { calls: 0, success: 0, fail: 0 };
    }
    this.usageStats[provider].calls++;
    if (success) this.usageStats[provider].success++;
    else this.usageStats[provider].fail++;
  }
}
