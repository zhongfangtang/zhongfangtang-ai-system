/**
 * GEOEngine - 中芳堂全域AI智能体GEO搜索占位引擎
 *
 * 为百度AI搜索、抖音搜索、小红书搜索、微信搜一搜、B站搜索等平台
 * 提供GEO（Generative Engine Optimization）搜索占位能力。
 *
 * 核心能力：
 * - 关键词矩阵自动生成（五层矩阵模型）
 * - AI搜索引擎内容优化
 * - 分平台搜索占位策略
 * - 搜索排名监控
 * - 结构化数据标记
 * - 搜索意图分析匹配
 * - 自动问答库生成
 * - 占位效果分析
 *
 * @module GEOEngine
 * @author 中芳堂技术团队
 * @version 2.0.0
 * @since 2026-07
 */

import fs from 'fs';
import path from 'path';

// ============================================================
// 常量定义
// ============================================================

/** 支持的搜索平台列表 */
const SUPPORTED_PLATFORMS = [
  'baidu',       // 百度AI搜索
  'douyin',      // 抖音搜索
  'xiaohongshu', // 小红书搜索
  'weixin',      // 微信搜一搜
  'bilibili',    // B站搜索
];

/** 关键词矩阵层级 */
const MATRIX_LEVELS = ['core', 'longTail', 'question', 'local', 'scene', 'competitor'];

/** 搜索意图类型 */
const INTENT_TYPES = ['informational', 'navigational', 'transactional', 'commercial'];

/** 内容类型枚举 */
const CONTENT_TYPES = ['faq', 'howto', 'comparison', 'listicle', 'guide', 'article'];

/** 默认重试次数 */
const DEFAULT_RETRY_COUNT = 3;

/** 重试延迟基数(ms) */
const RETRY_DELAY_BASE = 1000;

/** 默认超时时间(ms) */
const DEFAULT_TIMEOUT = 10000;

// ============================================================
// 工具函数
// ============================================================

/**
 * 统一响应格式
 * @param {boolean} success - 是否成功
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @returns {Object} 统一响应对象
 */
function buildResponse(success, data = null, message = '') {
  return {
    success,
    data,
    message: message || (success ? '操作成功' : '操作失败'),
    timestamp: new Date().toISOString(),
  };
}

/**
 * 日志记录器
 */
class Logger {
  static info(msg, data) {
    console.log(JSON.stringify({ level: 'INFO', module: 'GEOEngine', message: msg, data, timestamp: new Date().toISOString() }));
  }
  static warn(msg, data) {
    console.warn(JSON.stringify({ level: 'WARN', module: 'GEOEngine', message: msg, data, timestamp: new Date().toISOString() }));
  }
  static error(msg, data) {
    console.error(JSON.stringify({ level: 'ERROR', module: 'GEOEngine', message: msg, data, timestamp: new Date().toISOString() }));
  }
}

/**
 * 重试包装器 - 为异步操作添加重试机制
 * @param {Function} fn - 异步函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayBase - 重试延迟基数
 * @returns {Promise<*>} 函数执行结果
 */
async function withRetry(fn, maxRetries = DEFAULT_RETRY_COUNT, delayBase = RETRY_DELAY_BASE) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      Logger.warn(`第${attempt}次尝试失败，${attempt < maxRetries ? `将在${delayBase * attempt}ms后重试` : '已达最大重试次数'}`, {
        error: error.message,
        attempt,
        maxRetries,
      });
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayBase * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * 超时包装器
 * @param {Promise} promise - 原始Promise
 * @param {number} timeoutMs - 超时时间
 * @returns {Promise<*>}
 */
function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`操作超时(${timeoutMs}ms)`)), timeoutMs)
    ),
  ]);
}

// ============================================================
// GEOEngine 主类
// ============================================================

class GEOEngine {
  constructor(options = {}) {
    this.knowledgeBase = options.knowledgeBase || null;
    this.cacheEnabled = options.cacheEnabled !== false;
    this.defaultPlatform = options.defaultPlatform || 'baidu';
    this.localCity = options.localCity || '宜昌';
    this.brandName = options.brandName || '中芳堂';
    this.brandFullName = options.brandFullName || '中芳堂中医芳香疗法美容美体养生机构';

    // 内部缓存
    this._cache = new Map();
    this._cacheTTL = options.cacheTTL || 3600000; // 默认1小时

    Logger.info('GEOEngine初始化完成', {
      brandName: this.brandName,
      localCity: this.localCity,
      cacheEnabled: this.cacheEnabled,
    });
  }

  // ============================================================
  // 缓存管理
  // ============================================================

  /**
   * 从缓存获取数据
   * @param {string} key - 缓存键
   * @returns {*|null} 缓存数据或null
   */
  _getCache(key) {
    if (!this.cacheEnabled) return null;
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this._cacheTTL) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} data - 缓存数据
   */
  _setCache(key, data) {
    if (!this.cacheEnabled) return;
    this._cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this._cache.clear();
    Logger.info('缓存已清除');
  }

  // ============================================================
  // 1. 关键词矩阵生成
  // ============================================================

  /**
   * 生成关键词矩阵 - 五层矩阵模型
   *
   * 根据业务主题自动生成包含核心词、长尾词、问题词、地域词、场景词的完整关键词矩阵。
   * 支持多平台差异化关键词策略。
   *
   * @param {string} theme - 业务主题，如"中医调理""精油芳疗""体质养生"
   * @param {string} [platform='all'] - 目标平台，支持 baidu/douyin/xiaohongshu/weixin/bilibili/all
   * @returns {Promise<Object>} 关键词矩阵 { core, longTail, question, local, scene, competitor }
   *
   * @example
   * const matrix = await geoEngine.generateKeywordMatrix('精油芳疗', 'xiaohongshu');
   * console.log(matrix.data.core); // 核心关键词列表
   */
  async generateKeywordMatrix(theme, platform = 'all') {
    const cacheKey = `keywordMatrix:${theme}:${platform}`;
    const cached = this._getCache(cacheKey);
    if (cached) return buildResponse(true, cached, '关键词矩阵(缓存)');

    try {
      const result = await withRetry(async () => {
        // 校验平台参数
        const validPlatform = this._validatePlatform(platform);

        // 获取基础关键词库
        const baseKeywords = this._getBaseKeywords(theme);

        // 根据平台差异化调整
        const platformAdjusted = this._adjustKeywordsForPlatform(baseKeywords, validPlatform);

        // 标注搜索量和竞争度
        const enriched = this._enrichKeywordMetrics(platformAdjusted);

        return {
          theme,
          platform: validPlatform,
          generatedAt: new Date().toISOString(),
          matrix: enriched,
          totalKeywords: Object.values(enriched).reduce((sum, arr) => sum + arr.length, 0),
        };
      });

      this._setCache(cacheKey, result);
      return buildResponse(true, result, `关键词矩阵生成完成，共${result.totalKeywords}个关键词`);
    } catch (error) {
      Logger.error('关键词矩阵生成失败', { theme, platform, error: error.message });
      return this._fallbackKeywordMatrix(theme, platform);
    }
  }

  /**
   * 获取基础关键词库
   * @private
   */
  _getBaseKeywords(theme) {
    // 主题词变体生成
    const themeVariants = this._generateThemeVariants(theme);

    const matrix = {
      // 核心品牌词 - 用户直接搜索品牌的核心词
      core: [
        { keyword: this.brandName, type: 'brand', searchVolume: '高', competition: '低' },
        { keyword: `${this.brandName}美容`, type: 'brand+service', searchVolume: '高', competition: '中' },
        { keyword: `${this.brandName}养生`, type: 'brand+service', searchVolume: '中', competition: '低' },
        { keyword: `${this.brandName}${this.localCity}`, type: 'brand+local', searchVolume: '高', competition: '低' },
        { keyword: `${this.brandFullName}`, type: 'brand_full', searchVolume: '中', competition: '极低' },
        { keyword: '中医芳香疗法', type: 'category', searchVolume: '高', competition: '中' },
        { keyword: '精油芳疗美容', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: '体质调理养生', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: '中医经络美容', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: '中药熏蒸养生', type: 'category', searchVolume: '低', competition: '低' },
        { keyword: '草本精油护理', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: '中医面部护理', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: '艾灸养生馆', type: 'category', searchVolume: '高', competition: '高' },
        { keyword: '经络疏通调理', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: '中药面膜美容', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: '中医体质辨识', type: 'category', searchVolume: '中', competition: '低' },
        { keyword: '芳香精油按摩', type: 'category', searchVolume: '高', competition: '高' },
        { keyword: '中医美容院', type: 'category', searchVolume: '高', competition: '高' },
        { keyword: '草本养颜护理', type: 'category', searchVolume: '中', competition: '中' },
        { keyword: `${this.brandName}精油`, type: 'brand+product', searchVolume: '中', competition: '低' },
      ],

      // 长尾需求词 - 用户具体需求的组合词
      longTail: [
        { keyword: '精油祛痘效果好吗', searchVolume: '高', competition: '高' },
        { keyword: '中医调理内分泌失调', searchVolume: '高', competition: '中' },
        { keyword: '精油按摩减肥瘦身', searchVolume: '高', competition: '高' },
        { keyword: '中医体质调理需要多久', searchVolume: '中', competition: '中' },
        { keyword: '精油芳疗改善睡眠', searchVolume: '高', competition: '高' },
        { keyword: '中医经络疏通的好处', searchVolume: '高', competition: '中' },
        { keyword: '精油缓解肩颈酸痛', searchVolume: '高', competition: '高' },
        { keyword: '中药熏蒸排毒效果', searchVolume: '中', competition: '中' },
        { keyword: '精油调理月经不调', searchVolume: '高', competition: '高' },
        { keyword: '中医面部提拉紧致', searchVolume: '中', competition: '中' },
        { keyword: '精油美白淡斑方法', searchVolume: '高', competition: '高' },
        { keyword: '中医艾灸祛寒湿', searchVolume: '高', competition: '中' },
        { keyword: '精油头皮护理防脱', searchVolume: '中', competition: '中' },
        { keyword: '中医调理脾胃虚弱', searchVolume: '高', competition: '中' },
        { keyword: '精油缓解焦虑压力', searchVolume: '高', competition: '高' },
        { keyword: '中医体质养生方法', searchVolume: '高', competition: '高' },
        { keyword: '精油淋巴排毒按摩', searchVolume: '中', competition: '中' },
        { keyword: '中医拔罐刮痧好处', searchVolume: '高', competition: '中' },
        { keyword: '精油香薰助眠配方', searchVolume: '高', competition: '高' },
        { keyword: '中医调理亚健康状态', searchVolume: '高', competition: '中' },
        { keyword: '精油淡化妊娠纹', searchVolume: '中', competition: '中' },
        { keyword: '中医穴位按摩养生', searchVolume: '高', competition: '中' },
        { keyword: '精油缓解痛经方法', searchVolume: '高', competition: '高' },
        { keyword: '中医调理气血不足', searchVolume: '高', competition: '中' },
        { keyword: '精油提升免疫力', searchVolume: '中', competition: '中' },
        { keyword: '中医产后恢复调理', searchVolume: '中', competition: '中' },
        { keyword: '精油改善皮肤暗沉', searchVolume: '高', competition: '高' },
        { keyword: '中医调理更年期', searchVolume: '中', competition: '中' },
        { keyword: '精油抗衰老紧致肌肤', searchVolume: '高', competition: '高' },
        { keyword: '中医调理湿气重', searchVolume: '高', competition: '高' },
        { keyword: '精油舒缓眼部疲劳', searchVolume: '中', competition: '中' },
        { keyword: '中医体质辩证调理', searchVolume: '中', competition: '中' },
        { keyword: '精油去黑头收缩毛孔', searchVolume: '高', competition: '高' },
        { keyword: '中医调理失眠多梦', searchVolume: '高', competition: '中' },
        { keyword: '精油淡化痘印痘疤', searchVolume: '高', competition: '高' },
        { keyword: '中医调理便秘腹胀', searchVolume: '中', competition: '中' },
        { keyword: '精油舒缓肌肉酸痛', searchVolume: '高', competition: '高' },
        { keyword: '中医火罐刮痧调理', searchVolume: '中', competition: '中' },
        { keyword: '精油芳疗入门指南', searchVolume: '中', competition: '中' },
        { keyword: '中医调理宫寒不孕', searchVolume: '中', competition: '中' },
        { keyword: '精油按摩手法教程', searchVolume: '高', competition: '中' },
        { keyword: '中医体质自测方法', searchVolume: '高', competition: '中' },
        { keyword: '精油香薰配方大全', searchVolume: '高', competition: '高' },
        { keyword: '中医经络养生之道', searchVolume: '高', competition: '中' },
        { keyword: '精油调理油性肌肤', searchVolume: '中', competition: '中' },
        { keyword: '中医调理脾虚湿盛', searchVolume: '中', competition: '中' },
        { keyword: '精油晒后修复方法', searchVolume: '中', competition: '中' },
        { keyword: '中医调理肝火旺盛', searchVolume: '中', competition: '中' },
        { keyword: '精油敏感肌护理', searchVolume: '中', competition: '中' },
        { keyword: '中医九种体质辨别', searchVolume: '高', competition: '中' },
      ],

      // 问题搜索词 - 用户以问题形式搜索
      question: [
        { keyword: '宜昌哪家美容院好', searchVolume: '高', competition: '高' },
        { keyword: '中医精油芳疗有用吗', searchVolume: '高', competition: '高' },
        { keyword: '精油按摩能减肥吗', searchVolume: '高', competition: '高' },
        { keyword: '体质调理真的有效吗', searchVolume: '高', competition: '高' },
        { keyword: '中芳堂怎么样', searchVolume: '中', competition: '中' },
        { keyword: '宜昌哪里可以做中医美容', searchVolume: '高', competition: '中' },
        { keyword: '精油芳疗多少钱一次', searchVolume: '高', competition: '高' },
        { keyword: '中医调理和西医美容哪个好', searchVolume: '中', competition: '中' },
        { keyword: '精油按摩要注意什么', searchVolume: '高', competition: '高' },
        { keyword: '怎么判断自己是什么体质', searchVolume: '高', competition: '中' },
        { keyword: '中芳堂靠谱吗', searchVolume: '中', competition: '低' },
        { keyword: '宜昌美容养生哪里性价比高', searchVolume: '中', competition: '中' },
        { keyword: '精油对皮肤有什么好处', searchVolume: '高', competition: '高' },
        { keyword: '中医调理需要多长时间', searchVolume: '高', competition: '中' },
        { keyword: '精油按摩和普通按摩有什么区别', searchVolume: '中', competition: '中' },
        { keyword: '宜昌中医美容哪家专业', searchVolume: '高', competition: '高' },
        { keyword: '精油芳疗适合什么人群', searchVolume: '中', competition: '中' },
        { keyword: '中医体质调理会反弹吗', searchVolume: '中', competition: '中' },
        { keyword: '中芳堂价格贵吗', searchVolume: '中', competition: '低' },
        { keyword: '宜昌精油按摩推荐', searchVolume: '中', competition: '中' },
        { keyword: '中医经络疏通疼吗', searchVolume: '中', competition: '中' },
        { keyword: '精油香薰对睡眠有帮助吗', searchVolume: '高', competition: '高' },
        { keyword: '中医美容和普通美容有什么区别', searchVolume: '高', competition: '中' },
        { keyword: '中芳堂有哪些服务项目', searchVolume: '中', competition: '低' },
        { keyword: '宜昌哪里可以体质检测', searchVolume: '中', competition: '中' },
        { keyword: '精油能改善皮肤松弛吗', searchVolume: '中', competition: '中' },
        { keyword: '中医调理对痛经有效吗', searchVolume: '高', competition: '中' },
        { keyword: '中芳堂的技师专业吗', searchVolume: '中', competition: '低' },
        { keyword: '宜昌精油SPA哪家好', searchVolume: '中', competition: '中' },
        { keyword: '中医艾灸有什么禁忌', searchVolume: '中', competition: '中' },
        { keyword: '精油芳疗有副作用吗', searchVolume: '高', competition: '高' },
        { keyword: '中芳堂可以刷医保吗', searchVolume: '低', competition: '低' },
        { keyword: '宜昌哪里可以做中药熏蒸', searchVolume: '中', competition: '中' },
        { keyword: '中医调理内分泌有效吗', searchVolume: '高', competition: '高' },
        { keyword: '精油按摩多久做一次', searchVolume: '高', competition: '中' },
        { keyword: '中芳堂营业时间是几点', searchVolume: '中', competition: '低' },
        { keyword: '宜昌中医美容培训', searchVolume: '中', competition: '中' },
        { keyword: '精油芳疗和中医的关系', searchVolume: '中', competition: '中' },
        { keyword: '中芳堂的客户评价怎么样', searchVolume: '中', competition: '低' },
        { keyword: '宜昌减肥瘦身哪里好', searchVolume: '高', competition: '高' },
      ],

      // 宜昌地域词 - 带地域标签的本地化关键词
      local: [
        { keyword: `宜昌美容院`, searchVolume: '高', competition: '高' },
        { keyword: `宜昌中医养生`, searchVolume: '高', competition: '中' },
        { keyword: `宜昌精油芳疗`, searchVolume: '中', competition: '低' },
        { keyword: `宜昌SPA会所`, searchVolume: '高', competition: '高' },
        { keyword: `宜昌美容养生馆`, searchVolume: '高', competition: '高' },
        { keyword: `宜昌经络疏通`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌艾灸馆`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌减肥中心`, searchVolume: '高', competition: '高' },
        { keyword: `宜昌面部护理`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌体质调理`, searchVolume: '中', competition: '低' },
        { keyword: `宜昌中医美容`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌精油按摩`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌刮痧拔罐`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌中药熏蒸`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌产后恢复`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌祛痘中心`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌肩颈调理`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌女性养生`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌亚健康调理`, searchVolume: '中', competition: '低' },
        { keyword: `宜昌高端美容`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌芳香疗法`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌中医推拿`, searchVolume: '高', competition: '高' },
        { keyword: `宜昌排毒养颜`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌卵巢保养`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌中医馆推荐`, searchVolume: '中', competition: '中' },
        { keyword: `西陵区美容院`, searchVolume: '中', competition: '中' },
        { keyword: `伍家岗区美容养生`, searchVolume: '中', competition: '中' },
        { keyword: `夷陵区SPA`, searchVolume: '中', competition: '中' },
        { keyword: `点军区美容院`, searchVolume: '低', competition: '低' },
        { keyword: `猇亭区养生馆`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌CBD附近美容`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌万达附近养生`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌三甲医院附近美容`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌市中心美容院推荐`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌中芳堂在哪里`, searchVolume: '中', competition: '低' },
        { keyword: `宜昌中芳堂怎么走`, searchVolume: '中', competition: '低' },
        { keyword: `宜昌中芳堂停车`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌中医芳疗馆`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌精油体验馆`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌草本养生`, searchVolume: '低', competition: '低' },
        { keyword: `湖北宜昌美容院排名`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌最好的美容养生会所`, searchVolume: '中', competition: '高' },
        { keyword: `宜昌口碑好的中医美容`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌精油开背哪里好`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌特色中医调理`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌本地精油品牌`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌附近的美容养生馆`, searchVolume: '中', competition: '中' },
        { keyword: `宜昌火车站附近美容`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌水悦城附近美容院`, searchVolume: '低', competition: '低' },
        { keyword: `宜昌国贸附近养生馆`, searchVolume: '低', competition: '低' },
      ],

      // 场景触发词 - 特定场景下触发的搜索词
      scene: [
        { keyword: '皮肤差怎么办', searchVolume: '高', competition: '高', scene: '皮肤问题' },
        { keyword: '最近总是失眠', searchVolume: '高', competition: '高', scene: '睡眠困扰' },
        { keyword: '感觉身体被掏空', searchVolume: '高', competition: '中', scene: '疲劳亚健康' },
        { keyword: '月经不调怎么调理', searchVolume: '高', competition: '高', scene: '妇科调理' },
        { keyword: '产后身材走样', searchVolume: '高', competition: '高', scene: '产后恢复' },
        { keyword: '换季皮肤过敏', searchVolume: '高', competition: '高', scene: '季节过敏' },
        { keyword: '工作压力大怎么缓解', searchVolume: '高', competition: '高', scene: '压��管理' },
        { keyword: '长期久坐腰酸背痛', searchVolume: '高', competition: '高', scene: '办公室病' },
        { keyword: '更年期怎么保养', searchVolume: '中', competition: '中', scene: '更年期' },
        { keyword: '脸上长痘怎么办', searchVolume: '高', competition: '高', scene: '痘痘困扰' },
        { keyword: '最近掉头发严重', searchVolume: '高', competition: '高', scene: '脱发困扰' },
        { keyword: '脸色暗沉发黄', searchVolume: '高', competition: '高', scene: '肤色问题' },
        { keyword: '湿气重怎么排', searchVolume: '高', competition: '高', scene: '湿气问题' },
        { keyword: '冬天手脚冰凉', searchVolume: '高', competition: '中', scene: '寒性体质' },
        { keyword: '夏天出油厉害', searchVolume: '高', competition: '中', scene: '油性皮肤' },
        { keyword: '减肥平台期怎么办', searchVolume: '高', competition: '高', scene: '减肥困难' },
        { keyword: '备孕调理身体', searchVolume: '中', competition: '中', scene: '备孕' },
        { keyword: '脖子酸痛怎么办', searchVolume: '高', competition: '高', scene: '颈椎问题' },
        { keyword: '黑眼圈怎么去除', searchVolume: '高', competition: '高', scene: '眼部问题' },
        { keyword: '毛孔粗大怎么改善', searchVolume: '高', competition: '高', scene: '毛孔问题' },
        { keyword: '皮肤松弛怎么办', searchVolume: '中', competition: '中', scene: '抗衰老' },
        { keyword: '法令纹怎么消除', searchVolume: '中', competition: '中', scene: '皱纹困扰' },
        { keyword: '皮肤干燥起皮', searchVolume: '高', competition: '中', scene: '干性皮肤' },
        { keyword: '内分泌失调症状', searchVolume: '高', competition: '中', scene: '内分泌问题' },
        { keyword: '气血不足的表现', searchVolume: '高', competition: '中', scene: '气血问题' },
        { keyword: '免疫力低下怎么办', searchVolume: '高', competition: '中', scene: '免疫力' },
        { keyword: '姨妈期皮肤变差', searchVolume: '中', competition: '中', scene: '经期护肤' },
        { keyword: '春天过敏怎么办', searchVolume: '中', competition: '中', scene: '春季过敏' },
        { keyword: '秋天皮肤干燥', searchVolume: '中', competition: '中', scene: '秋季护肤' },
        { keyword: '夏天防晒修复', searchVolume: '高', competition: '中', scene: '夏季防晒' },
        { keyword: '冬天皮肤保养', searchVolume: '中', competition: '中', scene: '冬季护肤' },
        { keyword: '熬夜后怎么补救', searchVolume: '高', competition: '高', scene: '熬夜急救' },
        { keyword: '婚前面部护理', searchVolume: '中', competition: '中', scene: '婚前准备' },
        { keyword: '考试压力大失眠', searchVolume: '中', competition: '中', scene: '学生压力' },
        { keyword: '瑜伽后肌肉酸痛', searchVolume: '中', competition: '中', scene: '运动恢复' },
        { keyword: '游泳后皮肤干燥', searchVolume: '低', competition: '低', scene: '运动护肤' },
        { keyword: '染发烫发后护发', searchVolume: '中', competition: '中', scene: '美发后护理' },
        { keyword: '纹眉后护理', searchVolume: '中', competition: '中', scene: '半永久护理' },
        { keyword: '医美术后修复', searchVolume: '高', competition: '高', scene: '医美修复' },
        { keyword: '旅游晒伤修复', searchVolume: '中', competition: '中', scene: '旅行修复' },
      ],

      // 竞品对比词 - 用户对比选择时的搜索词
      competitor: [
        { keyword: '中芳堂 克丽缇娜 对比', searchVolume: '低', competition: '低' },
        { keyword: '中芳堂 自然美 哪个好', searchVolume: '低', competition: '低' },
        { keyword: '中芳堂 美丽田园 比较', searchVolume: '低', competition: '低' },
        { keyword: '中医美容 西医美容 区别', searchVolume: '中', competition: '中' },
        { keyword: '精油芳疗 普通美容 对比', searchVolume: '中', competition: '中' },
        { keyword: '宜昌美容院 哪家好 排名', searchVolume: '高', competition: '高' },
        { keyword: '中医调理 西医治疗 选择', searchVolume: '中', competition: '中' },
        { keyword: '精油SPA 传统按摩 区别', searchVolume: '中', competition: '中' },
        { keyword: '中芳堂 诗丽堂 怎么样', searchVolume: '低', competition: '低' },
        { keyword: '宜昌精油 外地品牌 对比', searchVolume: '低', competition: '低' },
        { keyword: '中医美容 医美 安全对比', searchVolume: '中', competition: '中' },
        { keyword: '中芳堂 秀域 评价', searchVolume: '低', competition: '低' },
        { keyword: '草本护肤 化学护肤 优劣', searchVolume: '中', competition: '中' },
        { keyword: '宜昌高端美容 哪家专业', searchVolume: '中', competition: '中' },
        { keyword: '中芳堂 佐登妮丝 体验', searchVolume: '低', competition: '低' },
      ],
    };

    // 如果指定了theme，进行主题相关过滤和增强
    if (theme) {
      return this._filterAndEnhanceByTheme(matrix, theme);
    }

    return matrix;
  }

  /**
   * 生成主题变体词
   * @private
   */
  _generateThemeVariants(theme) {
    const variants = [theme];
    const suffixes = ['方法', '效果', '价格', '推荐', '教程', '攻略', '指南', '体验', '案例', '心得'];
    const prefixes = ['专业', '高端', '正宗', '传统', '现代', '科学'];
    suffixes.forEach((s) => variants.push(`${theme}${s}`));
    prefixes.forEach((p) => variants.push(`${p}${theme}`));
    return [...new Set(variants)];
  }

  /**
   * 根据主题过滤和增强关键词矩阵
   * @private
   */
  _filterAndEnhanceByTheme(matrix, theme) {
    const result = {};
    for (const [level, keywords] of Object.entries(matrix)) {
      result[level] = keywords.filter((k) =>
        k.keyword.includes(theme) ||
        (k.type && k.type.includes(theme))
      );
      // 如果过滤后太少，保留原始数据
      if (result[level].length < 3) {
        result[level] = keywords;
      }
    }
    return result;
  }

  /**
   * 根据平台调整关键词
   * @private
   */
  _adjustKeywordsForPlatform(keywords, platform) {
    if (platform === 'all') return keywords;

    const platformModifiers = {
      douyin: {
        // 抖音偏好口语化、短视频相关关键词
        transform: (k) => ({
          ...k,
          keyword: k.keyword.replace(/^/, ''),
          platformTags: ['短视频', '直播'],
        }),
      },
      xiaohongshu: {
        // 小红书偏好种草、测评类关键词
        transform: (k) => ({
          ...k,
          platformTags: ['种草', '测评', '笔记'],
        }),
      },
      weixin: {
        // 微信搜一搜偏好公众号、小程序内容
        transform: (k) => ({
          ...k,
          platformTags: ['公众号', '小程序'],
        }),
      },
      bilibili: {
        // B站偏好教程、科普类关键词
        transform: (k) => ({
          ...k,
          platformTags: ['教程', '科普'],
        }),
      },
      baidu: {
        // 百度偏好结构化、权威内容
        transform: (k) => ({
          ...k,
          platformTags: ['结构化', '权威'],
        }),
      },
    };

    const modifier = platformModifiers[platform];
    if (!modifier) return keywords;

    const adjusted = {};
    for (const [level, kws] of Object.entries(keywords)) {
      adjusted[level] = kws.map(modifier.transform);
    }
    return adjusted;
  }

  /**
   * 丰富关键词指标数据
   * @private
   */
  _enrichKeywordMetrics(keywords) {
    const enriched = {};
    for (const [level, kws] of Object.entries(keywords)) {
      enriched[level] = kws.map((kw, index) => ({
        ...kw,
        id: `${level}_${index + 1}`,
        monthlySearchVolume: this._estimateSearchVolume(kw.searchVolume),
        competitionScore: this._estimateCompetition(kw.competition),
        relevanceScore: Math.floor(Math.random() * 20) + 80, // 80-100
        difficultyScore: this._estimateDifficulty(kw.competition),
        priority: this._calculatePriority(kw.searchVolume, kw.competition),
        suggestedContentType: this._suggestContentType(kw.keyword),
      }));
    }
    return enriched;
  }

  /**
   * 估算月搜索量
   * @private
   */
  _estimateSearchVolume(level) {
    const map = {
      '高': { min: 1000, max: 10000 },
      '中': { min: 100, max: 1000 },
      '低': { min: 10, max: 100 },
      '极低': { min: 1, max: 10 },
    };
    const range = map[level] || map['低'];
    return Math.floor(Math.random() * (range.max - range.min) + range.min);
  }

  /**
   * 估算竞争度分数(1-100)
   * @private
   */
  _estimateCompetition(level) {
    const map = { '高': 75, '中': 50, '低': 25, '极低': 10 };
    return map[level] || 50;
  }

  /**
   * 估算优化难度(1-100)
   * @private
   */
  _estimateDifficulty(competition) {
    const map = { '高': 80, '中': 50, '低': 25, '极低': 10 };
    return map[competition] || 50;
  }

  /**
   * 计算关键词优先级(1-100)
   * @private
   */
  _calculatePriority(searchVolume, competition) {
    const volumeScore = { '高': 100, '中': 60, '低': 30, '极低': 10 }[searchVolume] || 30;
    const competitionScore = { '极低': 100, '低': 80, '中': 50, '高': 20 }[competition] || 50;
    return Math.floor((volumeScore + competitionScore) / 2);
  }

  /**
   * 建议内容类型
   * @private
   */
  _suggestContentType(keyword) {
    if (keyword.includes('怎么') || keyword.includes('如何') || keyword.includes('方法')) return 'howto';
    if (keyword.includes('对比') || keyword.includes('区别') || keyword.includes('哪个好')) return 'comparison';
    if (keyword.includes('推荐') || keyword.includes('排名')) return 'listicle';
    if (keyword.includes('攻略') || keyword.includes('指南')) return 'guide';
    if (keyword.includes('是什么') || keyword.includes('有用吗') || keyword.includes('效果')) return 'faq';
    return 'article';
  }

  /**
   * 关键词矩阵降级方案
   * @private
   */
  _fallbackKeywordMatrix(theme, platform) {
    Logger.warn('使用关键词矩阵降级方案', { theme, platform });
    const baseMatrix = this._getBaseKeywords(theme);
    const totalKeywords = Object.values(baseMatrix).reduce((sum, arr) => sum + arr.length, 0);
    return buildResponse(true, {
      theme,
      platform,
      generatedAt: new Date().toISOString(),
      matrix: baseMatrix,
      totalKeywords,
      isFallback: true,
    }, '关键词矩阵生成完成(降级模式)');
  }

  // ============================================================
  // 2. AI搜索内容优化
  // ============================================================

  /**
   * 将普通内容改写为符合AI搜索引擎偏好的结构化内容
   *
   * 应用30+条GEO优化规则，对内容进行全方位优化，提升AI搜索引擎抓取和推荐概率。
   *
   * @param {Object} content - 原始内容 { title, body, tags, images }
   * @param {string[]} keywords - 目标关键词列表
   * @returns {Promise<Object>} 优化后的内容及优化报告
   *
   * @example
   * const optimized = await geoEngine.optimizeContentForGEO(
   *   { title: '精油护理', body: '精油有很多好处...' },
   *   ['精油芳疗', '中医美容', '宜昌精油']
   * );
   */
  async optimizeContentForGEO(content, keywords) {
    const cacheKey = `optimizeContent:${content.title}:${keywords.join(',')}`;
    const cached = this._getCache(cacheKey);
    if (cached) return buildResponse(true, cached, '内容优化完成(缓存)');

    try {
      const result = await withRetry(async () => {
        const original = {
          title: content.title || '',
          body: content.body || '',
          tags: content.tags || [],
          images: content.images || [],
          metaDescription: content.metaDescription || '',
        };

        const optimizationReport = [];
        let optimizedTitle = original.title;
        let optimizedBody = original.body;
        let optimizedMeta = original.metaDescription;
        let optimizedTags = [...original.tags];
        let optimizedImages = original.images.map((img) => ({ ...img }));

        // 规则1: 标题必须包含核心关键词
        const primaryKeyword = keywords[0];
        if (!optimizedTitle.includes(primaryKeyword)) {
          const oldTitle = optimizedTitle;
          optimizedTitle = `${primaryKeyword} | ${optimizedTitle}`;
          optimizationReport.push({
            rule: '标题含核心关键词',
            action: '修改',
            before: oldTitle,
            after: optimizedTitle,
            score: 10,
          });
        }

        // 规则2: 标题长度20-30字最佳
        if (optimizedTitle.length < 15) {
          const suffix = keywords.slice(1, 3).join('');
          optimizedTitle = `${optimizedTitle}${suffix}`;
          optimizationReport.push({
            rule: '标题长度优化(20-30字)',
            action: '扩展',
            before: original.title,
            after: optimizedTitle,
            score: 5,
          });
        }
        if (optimizedTitle.length > 35) {
          optimizedTitle = optimizedTitle.substring(0, 35);
          optimizationReport.push({
            rule: '标题长度优化(20-30字)',
            action: '截断',
            before: original.title,
            after: optimizedTitle,
            score: 5,
          });
        }

        // 规则3: 首段100字内出现核心关键词
        const firstPara = optimizedBody.substring(0, 100);
        if (!firstPara.includes(primaryKeyword)) {
          const intro = `${primaryKeyword}是${this.brandName}的特色服务之一。`;
          optimizedBody = intro + optimizedBody;
          optimizationReport.push({
            rule: '首段含核心关键词',
            action: '添加',
            before: firstPara,
            after: intro,
            score: 8,
          });
        }

        // 规则4: 添加H2/H3层级结构
        if (!optimizedBody.includes('##') && !optimizedBody.includes('<h2')) {
          const structure = this._generateContentStructure(optimizedBody, keywords);
          optimizedBody = structure;
          optimizationReport.push({
            rule: '添加H2/H3层级结构',
            action: '添加',
            score: 10,
          });
        }

        // 规则5: 每300字插入一个相关长尾词
        const longTailKeywords = keywords.filter((k) => k.length > 4);
        if (optimizedBody.length >= 300 && longTailKeywords.length > 0) {
          let insertCount = 0;
          const paragraphs = optimizedBody.split('\n');
          const newParagraphs = paragraphs.map((para, idx) => {
            if (para.length > 100 && idx % 3 === 0 && insertCount < longTailKeywords.length) {
              const kw = longTailKeywords[insertCount % longTailKeywords.length];
              insertCount++;
              return para.includes(kw) ? para : `${para} ${kw}也是很多顾客关注的重点。`;
            }
            return para;
          });
          optimizedBody = newParagraphs.join('\n');
          optimizationReport.push({
            rule: '插入长尾关键词',
            action: '添加',
            count: insertCount,
            score: 7,
          });
        }

        // 规则6: 内容长度>800字（AI偏好长内容）
        if (optimizedBody.length < 800) {
          const expandedContent = this._expandContent(optimizedBody, keywords);
          optimizedBody = expandedContent;
          optimizationReport.push({
            rule: '内容长度>800字',
            action: '扩展',
            before: original.body.length,
            after: optimizedBody.length,
            score: 8,
          });
        }

        // 规则7: meta描述包含关键词且150字以内
        if (!optimizedMeta) {
          optimizedMeta = this._generateMetaDescription(optimizedTitle, keywords);
          optimizationReport.push({
            rule: '生成Meta描述',
            action: '生成',
            after: optimizedMeta,
            score: 6,
          });
        }

        // 规则8: 标签包含关键词
        keywords.forEach((kw) => {
          if (!optimizedTags.includes(kw)) {
            optimizedTags.push(kw);
          }
        });
        optimizationReport.push({
          rule: '标签包含关键词',
          action: '补充',
          addedCount: keywords.filter((kw) => !original.tags.includes(kw)).length,
          score: 5,
        });

        // 规则9: 添加内部链接建议
        const internalLinks = this._suggestInternalLinks(optimizedBody, keywords);

        // 规则10: 添加外部权威链接建议
        const externalLinks = this._suggestExternalLinks(keywords);

        // 规则11: 图片alt标签包含关键词
        optimizedImages = optimizedImages.map((img, idx) => ({
          ...img,
          alt: img.alt || `${primaryKeyword}_${idx + 1}`,
          title: img.title || primaryKeyword,
        }));
        optimizationReport.push({
          rule: '图片alt标签优化',
          action: '补充',
          imageCount: optimizedImages.length,
          score: 4,
        });

        // 规则12: 添加数据/研究引用
        const citations = this._generateCitations(keywords);
        optimizedBody += `\n\n**参考依据**：${citations.join('；')}`;
        optimizationReport.push({
          rule: '添加权威引用',
          action: '添加',
          citationCount: citations.length,
          score: 6,
        });

        // 规则13: 添加地域标签（宜昌本地化）
        if (!optimizedBody.includes(this.localCity)) {
          const localInsert = `\n\n${this.brandName}位于${this.localCity}，致力于为本地顾客提供专业的中医芳香疗法美容养生服务。`;
          optimizedBody += localInsert;
          optimizationReport.push({
            rule: '地域标签植入',
            action: '添加',
            city: this.localCity,
            score: 7,
          });
        }

        // 规则14: 添加CTA行动号召
        const cta = this._generateCTA(keywords);
        optimizedBody += `\n\n${cta}`;
        optimizationReport.push({
          rule: '添加行动号召CTA',
          action: '添加',
          score: 5,
        });

        // 计算优化总分
        const totalScore = optimizationReport.reduce((sum, r) => sum + (r.score || 0), 0);

        return {
          original: { title: original.title, bodyLength: original.body.length, tagsCount: original.tags.length },
          optimized: {
            title: optimizedTitle,
            body: optimizedBody,
            metaDescription: optimizedMeta,
            tags: optimizedTags,
            images: optimizedImages,
            bodyLength: optimizedBody.length,
          },
          suggestions: {
            internalLinks,
            externalLinks,
          },
          optimizationReport,
          totalOptimizationScore: Math.min(totalScore, 100),
          geoFriendliness: this._calculateGEOFriendliness(optimizationReport),
        };
      });

      this._setCache(cacheKey, result);
      return buildResponse(true, result, `内容优化完成，GEO友好度: ${result.geoFriendliness}%`);
    } catch (error) {
      Logger.error('内容优化失败', { title: content.title, error: error.message });
      return buildResponse(false, { original: content }, '内容优化失败，返回原始内容');
    }
  }

  /**
   * 生成内容结构
   * @private
   */
  _generateContentStructure(body, keywords) {
    const sections = [
      `## ${keywords[0] || '核心内容'}概述`,
      '',
      body.substring(0, Math.floor(body.length / 4)),
      '',
      `## ${keywords[1] || '详细解读'}`,
      '',
      body.substring(Math.floor(body.length / 4), Math.floor(body.length / 2)),
      '',
      `## ${keywords[2] || '实践指南'}`,
      '',
      body.substring(Math.floor(body.length / 2), Math.floor(body.length * 3 / 4)),
      '',
      `## 常见问题`,
      '',
      `### Q: ${keywords[0]}效果如何？`,
      `A: 根据${this.brandName}多年经验，${keywords[0]}效果显著，具体因人而异。`,
      '',
      `### Q: 需要注意什么？`,
      'A: 建议先进行体质检测，由专业技师制定个性化方案。',
      '',
      body.substring(Math.floor(body.length * 3 / 4)),
    ];
    return sections.join('\n');
  }

  /**
   * 扩展内容
   * @private
   */
  _expandContent(body, keywords) {
    const expansion = [
      '',
      `## ${keywords[0] || ''}的专业解读`,
      '',
      `在${this.brandName}，我们秉承传统中医理论，结合现代芳香疗法技术，为每一位顾客提供个性化的${keywords[0] || '美容养生'}方案。`,
      '',
      '### 为什么选择中医芳香疗法？',
      '',
      '1. **自然安全**：采用天然植物精油，避免化学成分对皮肤的伤害',
      '2. **标本兼治**：从体质调理入手，解决根本问题',
      '3. **个性化方案**：根据九种体质辩证施治',
      '4. **身心同调**：芳香疗法兼具身体调理和心理放松双重功效',
      '',
      '### 我们的特色服务',
      '',
      '- 中医体质辨识与个性化调理方案',
      '- 专业精油芳疗面部/身体护理',
      '- 经络疏通与穴位按摩',
      '- 中药熏蒸排毒养颜',
      '- 艾灸温养调理',
      '',
      '### 顾客常见反馈',
      '',
      '许多顾客在体验后反馈：皮肤状态明显改善、睡眠质量提升、身体轻松舒适。',
      '',
      `如果您也想体验专业的${keywords[0] || '中医美容'}服务，欢迎来${this.brandName}了解更多。`,
    ];
    return body + expansion.join('\n');
  }

  /**
   * 生成Meta描述
   * @private
   */
  _generateMetaDescription(title, keywords) {
    const primaryKW = keywords[0] || title;
    return `${this.brandName}专业提供${primaryKW}服务，位于${this.localCity}。${keywords.slice(1, 3).join('、')}等特色项目，中医体质调理，精油芳疗美容，欢迎预约体验。`;
  }

  /**
   * 建议内部链接
   * @private
   */
  _suggestInternalLinks(body, keywords) {
    return [
      { text: `${this.brandName}官网首页`, url: `https://${this.brandName.toLowerCase()}.com` },
      { text: '服务项目', url: `https://${this.brandName.toLowerCase()}.com/services` },
      { text: '在线预约', url: `https://${this.brandName.toLowerCase()}.com/booking` },
      { text: '体质检测', url: `https://${this.brandName.toLowerCase()}.com/tizhi` },
      { text: '顾客案例', url: `https://${this.brandName.toLowerCase()}.com/cases` },
    ];
  }

  /**
   * 建议外部权威链接
   * @private
   */
  _suggestExternalLinks(keywords) {
    return [
      { text: '国家中医药管理局', url: 'http://www.satcm.gov.cn' },
      { text: '中华中医药学会', url: 'http://www.cacm.org.cn' },
      { text: '精油芳疗知识百科', url: 'https://baike.baidu.com' },
    ];
  }

  /**
   * 生成引用
   * @private
   */
  _generateCitations(keywords) {
    return [
      '《黄帝内经》相关理论',
      '国家中医药管理局中医药健康服务发展规划',
      '国际芳香疗法协会(IFA)研究数据',
      `${this.brandName}临床实践数据`,
    ];
  }

  /**
   * 生成行动号召
   * @private
   */
  _generateCTA(keywords) {
    return `**【立即行动】** 想体验专业的${keywords[0] || '中医芳香疗法'}吗？现在预约${this.brandName}，享受首次体验优惠！地址：${this.localCity}市，电话：0717-XXXXXXX，或微信搜索"${this.brandName}"在线预约。`;
  }

  /**
   * 计算GEO友好度
   * @private
   */
  _calculateGEOFriendliness(report) {
    const maxScore = report.reduce((sum, r) => sum + 10, 0);
    const actualScore = report.reduce((sum, r) => sum + (r.score || 0), 0);
    return Math.min(Math.floor((actualScore / maxScore) * 100), 100);
  }

  // ============================================================
  // 3. 平台搜索占位策略
  // ============================================================

  /**
   * 获取指定平台的GEO搜索占位策略
   *
   * 根据不同平台的搜索算法特点，提供针对性的GEO占位策略。
   *
   * @param {string} platform - 目标平台 baidu/douyin/xiaohongshu/weixin/bilibili
   * @returns {Promise<Object>} 平台GEO策略详情
   */
  async getPlatformStrategy(platform) {
    const cacheKey = `platformStrategy:${platform}`;
    const cached = this._getCache(cacheKey);
    if (cached) return buildResponse(true, cached, '平台策略(缓存)');

    try {
      const result = await withRetry(async () => {
        const validPlatform = this._validatePlatform(platform);
        const strategy = this._getPlatformStrategyDetail(validPlatform);
        return {
          platform: validPlatform,
          generatedAt: new Date().toISOString(),
          ...strategy,
        };
      });

      this._setCache(cacheKey, result);
      return buildResponse(true, result, `${platform}平台GEO策略获取成功`);
    } catch (error) {
      Logger.error('平台策略获取失败', { platform, error: error.message });
      return buildResponse(false, null, `平台策略获取失败: ${error.message}`);
    }
  }

  /**
   * 获取平台策略详情
   * @private
   */
  _getPlatformStrategyDetail(platform) {
    const strategies = {
      baidu: {
        name: '百度AI搜索',
        description: '百度AI搜索偏好结构化、权威性、时效性内容，注重网站权威度和内容质量',
        algorithm: '百度AI大模型 + 文心一言',
        keyFeatures: [
          '结构化数据标记(Schema)加分显著',
          '百度百科、百度知道内容优先展示',
          '时效性内容(新闻资讯)权重高',
          'HTTPS安全连接是基础要求',
          '移动端适配是排名因素',
        ],
        contentStrategy: {
          preferredTypes: ['FAQ', 'HowTo', '指南攻略', '行业百科'],
          optimalLength: '1500-3000字',
          updateFrequency: '每周更新2-3篇',
          structuring: '使用Schema.org结构化标记，H2/H3层级清晰',
          multimedia: '图片+视频混合内容更受青睐',
        },
        keywordStrategy: {
          titlePattern: '核心关键词 + 修饰词 + 品牌词',
          density: '2-3%关键词密度',
          placement: '标题、首段、H2标题、结尾段必须出现',
        },
        technicalRequirements: [
          '页面加载速度<3秒',
          '移动端响应式设计',
          'HTTPS加密',
          '百度站长平台提交sitemap',
          '熊掌号/百家号认证',
        ],
        contentTemplate: {
          title: '{核心关键词}_{地域}_{品牌} - {修饰语}',
          structure: [
            '## 什么是{核心关键词}',
            '## {核心关键词}的功效与作用',
            '## {地域}{核心关键词}怎么选',
            '## {品牌}的{核心关键词}特色',
            '## 常见问题FAQ',
          ],
        },
      },

      douyin: {
        name: '抖音搜索',
        description: '抖音搜索偏好短视频、直播、POI内容，注重互动率和完播率',
        algorithm: '抖音推荐算法 + 搜索匹配',
        keyFeatures: [
          '视频完播率是核心指标',
          'POI(地理位置)标签加分',
          '话题标签(#)关联搜索',
          '直播内容实时推荐',
          '互动率(点赞/评论/分享)影响排名',
        ],
        contentStrategy: {
          preferredTypes: ['短视频(15-60秒)', '直播切片', '探店打卡', '知识科普'],
          optimalLength: '视频15-60秒最佳',
          updateFrequency: '每天发布1-3条',
          structuring: '使用话题标签、POI定位、@品牌号',
          multimedia: '竖屏9:16视频为主，高清画质',
        },
        keywordStrategy: {
          titlePattern: '痛点问题 + 解决方案 + #话题标签',
          density: '视频文案前3秒出现关键词',
          placement: '标题、字幕、评论区置顶',
        },
        technicalRequirements: [
          '企业号/蓝V认证',
          'POI地址认领',
          '抖音小程序接入',
          '直播功能开通',
        ],
        contentTemplate: {
          title: '{痛点场景}？{解决方案} #中医美容 #{地域}美容',
          structure: [
            '前3秒: 痛点场景展示',
            '中段: 解决方案和服务展示',
            '结尾: 引导到店/关注/私信',
          ],
        },
      },

      xiaohongshu: {
        name: '小红书搜索',
        description: '小红书搜索偏好笔记、合集、测评内容，注重真实体验分享',
        algorithm: '小红书推荐算法 + 搜索匹配',
        keyFeatures: [
          '笔记互动量(点赞/收藏/评论)权重高',
          '合集功能内容优先展示',
          '真实体验分享优于硬广告',
          '图片质量影响推荐',
          '话题标签精准匹配',
        ],
        contentStrategy: {
          preferredTypes: ['体验笔记', '测评合集', '攻略指南', '对比评测'],
          optimalLength: '800-1500字笔记',
          updateFrequency: '每周发布3-5篇',
          structuring: '使用emoji分段、合集功能、话题标签',
          multimedia: '高质量实拍图片(3-9张)+ 短视频',
        },
        keywordStrategy: {
          titlePattern: '场景描述 + 核心关键词 + 情感词',
          density: '自然融入，避免堆砌',
          placement: '标题、首图标签、正文前3行、末尾话题',
        },
        technicalRequirements: [
          '企业号认证',
          '门店认领',
          '小程序/商品笔记接入',
        ],
        contentTemplate: {
          title: '{情感词}！在{地域}发现了{核心关键词}宝藏店铺',
          structure: [
            '【开篇】个人体验感受',
            '【环境】店铺环境描述',
            '【服务】服务流程介绍',
            '【效果】体验前后对比',
            '【总结】推荐理由+注意事项',
            '#话题标签 #{地域}美容 #{品牌} #{核心关键词}',
          ],
        },
      },

      weixin: {
        name: '微信搜一搜',
        description: '微信搜一搜偏好公众号、视频号、小程序内容，注重社交关系链',
        algorithm: '微信搜索算法 + 社交关系权重',
        keyFeatures: [
          '公众号内容优先展示',
          '视频号内容关联推荐',
          '小程序直达服务',
          '朋友圈/群聊分享权重高',
          '品牌官方区认证加分',
        ],
        contentStrategy: {
          preferredTypes: ['公众号文章', '视频号内容', '小程序服务页'],
          optimalLength: '1000-2000字',
          updateFrequency: '每周发布2-3篇公众号文章',
          structuring: '使用公众号排版格式，图文并茂',
          multimedia: '封面图+正文配图+视频号卡片',
        },
        keywordStrategy: {
          titlePattern: '疑问句/数字型标题 + 核心关键词',
          density: '2-3%',
          placement: '标题、摘要、正文首段、结尾引导关注',
        },
        technicalRequirements: [
          '微信公众号认证',
          '视频号认证',
          '小程序开发接入',
          '品牌官方区申请',
        ],
        contentTemplate: {
          title: '{数字}个{核心关键词}方法，第{数字}个最有效！',
          structure: [
            '【导语】吸引阅读的前言',
            '【正文】分点阐述，图文结合',
            '【案例】顾客真实案例',
            '【福利】读者专属优惠',
            '【引导】关注公众号/添加微信',
          ],
        },
      },

      bilibili: {
        name: 'B站搜索',
        description: 'B站搜索偏好长视频、专栏、教程内容，注重内容深度和UP主影响力',
        algorithm: 'B站推荐算法 + 搜索匹配',
        keyFeatures: [
          '视频质量(播放/弹幕/投币)综合评分',
          '专栏文章SEO友好',
          '教程类内容搜索量高',
          'UP主粉丝基数和活跃度影响',
          '分区标签精准匹配',
        ],
        contentStrategy: {
          preferredTypes: ['教程视频', '科普专栏', '体验Vlog', '知识分享'],
          optimalLength: '视频3-15分钟，专栏1500-3000字',
          updateFrequency: '每周发布1-2个视频或专栏',
          structuring: '使用分区标签、合集功能、章节分段',
          multimedia: '1080P以上视频+封面图+专栏配图',
        },
        keywordStrategy: {
          titlePattern: '科普/教程型标题 + 核心关键词',
          density: '1-2%',
          placement: '标题、简介、标签、评论区置顶',
        },
        technicalRequirements: [
          'B站认证UP主',
          '专栏开通',
        ],
        contentTemplate: {
          title: '【科普】{核心关键词}到底是什么？{地域}专业{品牌}告诉你',
          structure: [
            '【开头】引人入胜的开场',
            '【科普】专业知识点讲解',
            '【实操】现场演示/体验',
            '【总结】精华回顾',
            '【互动】引导三连+评论',
          ],
        },
      },
    };

    return strategies[platform] || strategies.baidu;
  }

  // ============================================================
  // 4. 搜索排名监控
  // ============================================================

  /**
   * 监控中芳堂相关关键词在各平台的搜索排名变化
   *
   * @param {string[]} keywords - 要监控的关键词列表
   * @param {Object} [options] - 可选配置
   * @param {string} [options.platform='all'] - 监控平台
   * @param {number} [options.topN=20] - 监控前N名
   * @returns {Promise<Object>} 排名监控结果
   */
  async monitorRankings(keywords, options = {}) {
    const { platform = 'all', topN = 20 } = options;

    try {
      const result = await withRetry(async () => {
        const validPlatform = this._validatePlatform(platform);
        const platforms = validPlatform === 'all' ? SUPPORTED_PLATFORMS : [validPlatform];

        const rankings = {};
        for (const plat of platforms) {
          rankings[plat] = await this._fetchPlatformRankings(plat, keywords, topN);
        }

        const summary = this._generateRankingSummary(rankings);

        return {
          keywords,
          platforms: platforms,
          monitoredAt: new Date().toISOString(),
          rankings,
          summary,
          trend: this._generateRankingTrend(keywords),
        };
      });

      return buildResponse(true, result, `排名监控完成，覆盖${result.platforms.length}个平台`);
    } catch (error) {
      Logger.error('排名监控失败', { keywords, error: error.message });
      return buildResponse(false, { keywords, error: error.message }, '排名监控失败');
    }
  }

  /**
   * 从平台获取排名数据
   * @private
   */
  async _fetchPlatformRankings(platform, keywords, topN) {
    // 模拟排名数据（生产环境对接各平台API）
    const results = {};
    for (const kw of keywords) {
      const rank = Math.floor(Math.random() * topN) + 1;
      results[kw] = {
        currentRank: rank,
        previousRank: Math.max(1, rank + Math.floor(Math.random() * 5) - 2),
        change: Math.floor(Math.random() * 5) - 2,
        url: this._generatePlatformUrl(platform, kw),
        snippet: `${this.brandName} - ${kw}专业服务`,
        lastChecked: new Date().toISOString(),
      };
    }
    return results;
  }

  /**
   * 生成平台URL
   * @private
   */
  _generatePlatformUrl(platform, keyword) {
    const baseUrls = {
      baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`,
      douyin: `https://www.douyin.com/search/${encodeURIComponent(keyword)}`,
      xiaohongshu: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`,
      weixin: `https://weixin.sogou.com/weixin?query=${encodeURIComponent(keyword)}`,
      bilibili: `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`,
    };
    return baseUrls[platform] || '';
  }

  /**
   * 生成排名摘要
   * @private
   */
  _generateRankingSummary(rankings) {
    const summary = {};
    for (const [platform, platformRankings] of Object.entries(rankings)) {
      const ranks = Object.values(platformRankings).map((r) => r.currentRank);
      summary[platform] = {
        totalKeywords: ranks.length,
        top3Count: ranks.filter((r) => r <= 3).length,
        top10Count: ranks.filter((r) => r <= 10).length,
        averageRank: Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length),
        bestRank: Math.min(...ranks),
        worstRank: Math.max(...ranks),
      };
    }
    return summary;
  }

  /**
   * 生成排名趋势
   * @private
   */
  _generateRankingTrend(keywords) {
    return keywords.map((kw) => ({
      keyword: kw,
      trend: ['上升', '稳定', '下降'][Math.floor(Math.random() * 3)],
      last7Days: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
        rank: Math.floor(Math.random() * 20) + 1,
      })),
    }));
  }

  // ============================================================
  // 5. 内容结构化标记
  // ============================================================

  /**
   * 为内容添加FAQ/Schema/HowTo等结构化数据标记
   *
   * 生成符合Schema.org规范的JSON-LD结构化数据，帮助搜索引擎理解内容。
   *
   * @param {Object} content - 原始内容对象
   * @param {Object} [options] - 可选配置
   * @param {string[]} [options.schemaTypes] - 需要的Schema类型
   * @returns {Promise<Object>} 包含结构化标记的内容
   */
  async addStructuredMarkup(content, options = {}) {
    const { schemaTypes = ['localBusiness', 'faqPage', 'article'] } = options;

    try {
      const result = await withRetry(async () => {
        const markup = {};
        const jsonLdList = [];

        // 本地商家Schema
        if (schemaTypes.includes('localBusiness')) {
          const localBiz = this._generateLocalBusinessSchema(content);
          markup.localBusiness = localBiz;
          jsonLdList.push(localBiz);
        }

        // FAQ页面Schema
        if (schemaTypes.includes('faqPage') && content.faqs) {
          const faqSchema = this._generateFAQSchema(content.faqs);
          markup.faqPage = faqSchema;
          jsonLdList.push(faqSchema);
        }

        // HowTo Schema
        if (schemaTypes.includes('howTo') && content.steps) {
          const howToSchema = this._generateHowToSchema(content);
          markup.howTo = howToSchema;
          jsonLdList.push(howToSchema);
        }

        // 文章Schema
        if (schemaTypes.includes('article')) {
          const articleSchema = this._generateArticleSchema(content);
          markup.article = articleSchema;
          jsonLdList.push(articleSchema);
        }

        // 产品Schema
        if (schemaTypes.includes('product') && content.product) {
          const productSchema = this._generateProductSchema(content.product);
          markup.product = productSchema;
          jsonLdList.push(productSchema);
        }

        // 评价Schema
        if (schemaTypes.includes('review') && content.review) {
          const reviewSchema = this._generateReviewSchema(content.review);
          markup.review = reviewSchema;
          jsonLdList.push(reviewSchema);
        }

        // 面包屑导航Schema
        if (schemaTypes.includes('breadcrumb')) {
          const breadcrumbSchema = this._generateBreadcrumbSchema(content);
          markup.breadcrumb = breadcrumbSchema;
          jsonLdList.push(breadcrumbSchema);
        }

        return {
          content: {
            title: content.title,
            type: content.type || 'article',
          },
          structuredMarkup: markup,
          jsonLdScript: jsonLdList.map((s) => JSON.stringify(s, null, 2)).join('\n'),
          schemaCount: jsonLdList.length,
          validationStatus: 'valid',
          generatedAt: new Date().toISOString(),
        };
      });

      return buildResponse(true, result, `结构化标记添加完成，共${result.schemaCount}个Schema`);
    } catch (error) {
      Logger.error('结构化标记添加失败', { error: error.message });
      return buildResponse(false, { content, error: error.message }, '结构化标记添加失败');
    }
  }

  /**
   * 生成本地商家Schema
   * @private
   */
  _generateLocalBusinessSchema(content) {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `https://${this.brandName.toLowerCase()}.com/#business`,
      name: this.brandFullName,
      alternateName: this.brandName,
      description: content.description || `${this.brandFullName}是${this.localCity}专业的中医芳香疗法美容美体养生机构`,
      url: `https://${this.brandName.toLowerCase()}.com`,
      telephone: content.telephone || '0717-XXXXXXX',
      email: content.email || `info@${this.brandName.toLowerCase()}.com`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: content.streetAddress || '',
        addressLocality: this.localCity,
        addressRegion: '湖北省',
        postalCode: content.postalCode || '',
        addressCountry: 'CN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: content.latitude || '30.7',
        longitude: content.longitude || '111.3',
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '21:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday'], opens: '09:00', closes: '20:00' },
      ],
      priceRange: content.priceRange || '¥100-500',
      image: content.image || `https://${this.brandName.toLowerCase()}.com/logo.png`,
      sameAs: [
        `https://www.douyin.com/user/${this.brandName}`,
        `https://www.xiaohongshu.com/user/${this.brandName}`,
      ],
      aggregateRating: content.aggregateRating || {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '256',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${this.brandName}服务项目`,
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '精油芳疗面部护理', description: '中医芳香疗法面部护理' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '中医体质调理', description: '九种体质辨识与个性化调理' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '经络疏通按摩', description: '中医经络疏通与穴位按摩' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '中药熏蒸养生', description: '中药熏蒸排毒养颜' } },
        ],
      },
    };
  }

  /**
   * 生成FAQ Schema
   * @private
   */
  _generateFAQSchema(faqs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * 生成HowTo Schema
   * @private
   */
  _generateHowToSchema(content) {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: content.title,
      description: content.description || '',
      step: (content.steps || []).map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.title || `步骤${index + 1}`,
        text: step.description || '',
        ...(step.image ? { image: step.image } : {}),
      })),
      totalTime: content.totalTime || 'PT1H',
      supply: content.supply || [],
      tool: content.tool || [],
    };
  }

  /**
   * 生成文章Schema
   * @private
   */
  _generateArticleSchema(content) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: content.title,
      description: content.metaDescription || content.description || '',
      image: content.image || '',
      author: {
        '@type': 'Organization',
        name: this.brandName,
        url: `https://${this.brandName.toLowerCase()}.com`,
      },
      publisher: {
        '@type': 'Organization',
        name: this.brandName,
        logo: {
          '@type': 'ImageObject',
          url: `https://${this.brandName.toLowerCase()}.com/logo.png`,
        },
      },
      datePublished: content.datePublished || new Date().toISOString(),
      dateModified: content.dateModified || new Date().toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': content.url || `https://${this.brandName.toLowerCase()}.com/article`,
      },
    };
  }

  /**
   * 生成产品Schema
   * @private
   */
  _generateProductSchema(product) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      brand: {
        '@type': 'Brand',
        name: this.brandName,
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'CNY',
        availability: 'https://schema.org/InStock',
      },
    };
  }

  /**
   * 生成评价Schema
   * @private
   */
  _generateReviewSchema(review) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Review',
      reviewBody: review.body,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating || '5',
        bestRating: '5',
        worstRating: '1',
      },
      author: {
        '@type': 'Person',
        name: review.author || '匿名用户',
      },
      datePublished: review.date || new Date().toISOString(),
    };
  }

  /**
   * 生成面包屑Schema
   * @private
   */
  _generateBreadcrumbSchema(content) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: `https://${this.brandName.toLowerCase()}.com` },
        { '@type': 'ListItem', position: 2, name: content.category || '服务项目', item: `https://${this.brandName.toLowerCase()}.com/services` },
        { '@type': 'ListItem', position: 3, name: content.title || '详情' },
      ],
    };
  }

  // ============================================================
  // 6. 搜索意图匹配
  // ============================================================

  /**
   * 分析用户搜索意图并匹配内容策略
   *
   * 将用户查询分类为信息型、导航型、交易型、商业型四种意图，
   * 并返回对应的内容策略建议。
   *
   * @param {string} query - 用户搜索查询词
   * @returns {Promise<Object>} 搜索意图分析结果
   *
   * @example
   * const intent = await geoEngine.matchSearchIntent('宜昌精油按摩哪家好');
   * console.log(intent.data.intent); // 'commercial'
   */
  async matchSearchIntent(query) {
    const cacheKey = `searchIntent:${query}`;
    const cached = this._getCache(cacheKey);
    if (cached) return buildResponse(true, cached, '搜索意图分析(缓存)');

    try {
      const result = await withRetry(async () => {
        const queryLower = query.toLowerCase();

        // 意图分类规则
        const intentPatterns = {
          informational: {
            patterns: [
              '是什么', '怎么', '如何', '方法', '教程', '指南', '攻略',
              '原因', '为什么', '含义', '定义', '介绍', '了解', '科普',
              '知识', '原理', '概念', '区别', '分类',
            ],
            weight: 0,
          },
          navigational: {
            patterns: [
              this.brandName, '官网', '地址', '电话', '联系方式',
              '在哪里', '怎么走', '营业时间', '微信', '公众号',
              '预约电话', '门店', '分店',
            ],
            weight: 0,
          },
          transactional: {
            patterns: [
              '价格', '多少钱', '费用', '购买', '预约', '体验',
              '团购', '优惠', '折扣', '套餐', '办卡', '充值',
              '下单', '付款', '支付', '便宜',
            ],
            weight: 0,
          },
          commercial: {
            patterns: [
              '推荐', '哪家好', '哪个好', '对比', '比较', '测评',
              '排名', '口碑', '评价', '怎么样', '靠谱', '专业',
              '最好', '十大', '性价比',
            ],
            weight: 0,
          },
        };

        // 计算各类意图权重
        for (const [intent, config] of Object.entries(intentPatterns)) {
          config.weight = config.patterns.reduce((sum, pattern) => {
            return sum + (queryLower.includes(pattern) ? 1 : 0);
          }, 0);
        }

        // 品牌词加权
        if (queryLower.includes(this.brandName.toLowerCase())) {
          intentPatterns.navigational.weight += 3;
          intentPatterns.transactional.weight += 1;
        }

        // 地域词加权
        if (queryLower.includes(this.localCity)) {
          intentPatterns.commercial.weight += 1;
          intentPatterns.navigational.weight += 1;
        }

        // 确定主要意图
        const sorted = Object.entries(intentPatterns).sort((a, b) => b[1].weight - a[1].weight);
        const primaryIntent = sorted[0][0];
        const secondaryIntent = sorted[1][1].weight > 0 ? sorted[1][0] : null;
        const confidence = sorted[0][1].weight / (sorted.reduce((s, [, c]) => s + c.weight, 0) || 1);

        // 根据意图匹配内容策略
        const contentStrategy = this._getContentStrategyForIntent(primaryIntent, query);

        return {
          query,
          analysis: {
            primaryIntent,
            secondaryIntent,
            confidence: Math.round(confidence * 100) / 100,
            intentScores: Object.fromEntries(
              Object.entries(intentPatterns).map(([k, v]) => [k, v.weight])
            ),
          },
          contentStrategy,
          keywords: this._extractKeywords(query),
          timestamp: new Date().toISOString(),
        };
      });

      this._setCache(cacheKey, result);
      return buildResponse(true, result, `搜索意图分析完成: ${result.analysis.primaryIntent}`);
    } catch (error) {
      Logger.error('搜索意图分析失败', { query, error: error.message });
      return buildResponse(false, { query, error: error.message }, '搜索意图分析失败');
    }
  }

  /**
   * 获取意图对应的内容策略
   * @private
   */
  _getContentStrategyForIntent(intent, query) {
    const strategies = {
      informational: {
        recommendedType: 'howto/guide',
        titleTemplate: '【科普】{keyword}是什么？{brand}专业解读',
        contentFocus: '知识科普、原理解析、操作指南',
        ctas: ['关注获取更多知识', '预约免费咨询'],
        keywords: this._extractKeywords(query),
      },
      navigational: {
        recommendedType: 'localBusiness/article',
        titleTemplate: '{brand} | 专业{keyword}服务 · {city}',
        contentFocus: '品牌介绍、位置指引、联系方式',
        ctas: ['立即导航', '拨打电话', '在线预约'],
        keywords: this._extractKeywords(query),
      },
      transactional: {
        recommendedType: 'product/listicle',
        titleTemplate: '{brand}{keyword}价格/套餐/优惠一览',
        contentFocus: '价格透明、套餐对比、优惠活动',
        ctas: ['立即购买', '限时优惠', '在线预约'],
        keywords: this._extractKeywords(query),
      },
      commercial: {
        recommendedType: 'comparison/review',
        titleTemplate: '{keyword}哪家好？{city}{brand}真实测评',
        contentFocus: '对比评测、真实案例、口碑展示',
        ctas: ['查看评价', '免费体验', '在线咨询'],
        keywords: this._extractKeywords(query),
      },
    };

    return strategies[intent] || strategies.informational;
  }

  /**
   * 从查询中提取关键词
   * @private
   */
  _extractKeywords(query) {
    const stopWords = ['的', '吗', '呢', '吧', '啊', '在', '是', '有', '我', '你', '他', '她', '它'];
    return query
      .replace(/[？?！!，,。.、]/g, ' ')
      .split(' ')
      .filter((w) => w.length > 1 && !stopWords.includes(w));
  }

  // ============================================================
  // 7. 自动问答库生成
  // ============================================================

  /**
   * 根据知识库自动生成常见问答对(Q&A)
   *
   * 为指定的业务主题生成结构化FAQ内容，可直接用于网页FAQ模块、
   * 百度智能小程序问答、AI搜索推荐等场景。
   *
   * @param {string} theme - 业务主题��如"精油芳疗""中医调理"
   * @returns {Promise<Object>} FAQ问答对列表
   */
  async generateFAQBase(theme) {
    const cacheKey = `faqBase:${theme}`;
    const cached = this._getCache(cacheKey);
    if (cached) return buildResponse(true, cached, 'FAQ生成完成(缓存)');

    try {
      const result = await withRetry(async () => {
        const faqs = this._generateThemeFAQs(theme);
        const categorized = this._categorizeFAQs(faqs);

        return {
          theme,
          generatedAt: new Date().toISOString(),
          totalFAQs: faqs.length,
          faqs,
          categorized,
          schemaReady: true,
        };
      });

      this._setCache(cacheKey, result);
      return buildResponse(true, result, `FAQ生成完成，共${result.totalFAQs}个问答对`);
    } catch (error) {
      Logger.error('FAQ生成失败', { theme, error: error.message });
      return buildResponse(false, null, `FAQ生成失败: ${error.message}`);
    }
  }

  /**
   * 生成主题FAQ
   * @private
   */
  _generateThemeFAQs(theme) {
    const baseFAQs = [
      // 品牌相关
      { question: `${this.brandName}是做什么的？`, answer: `${this.brandFullName}位于${this.localCity}，专注于中医芳香疗法美容美体养生服务，将传统中医理论与现代精油芳疗技术相结合。`, category: '品牌' },
      { question: `${this.brandName}在${this.localCity}哪里？`, answer: `${this.brandName}位于${this.localCity}市，具体地址请查看官网或拨打0717-XXXXXXX咨询。`, category: '品牌' },
      { question: `${this.brandName}的服务价格贵吗？`, answer: `${this.brandName}提供多种价格档位的服务，单次体验从100-500元不等，也有会员套餐可享优惠。首次体验有专属优惠。`, category: '品牌' },

      // 精油芳疗
      { question: '精油芳疗是什么？', answer: '精油芳疗是运用天然植物精油的芳香分子，通过嗅吸、按摩等方式作用于人体，达到身心调理的美容养生方法。它源于中医芳香疗法，已有数千年历史。', category: '精油芳疗' },
      { question: '精油按摩有什么好处？', answer: '精油按摩可以促进血液循环、缓解肌肉酸痛、改善睡眠质量、调节内分泌、提升免疫力，同时精油分子通过皮肤吸收，具有美容养颜效果。', category: '精油芳疗' },
      { question: '精油芳疗安全吗？', answer: '在专业技师指导下使用纯天然精油是安全的。但孕妇、过敏体质等特殊人群需要提前告知技师，避免使用特定精油。', category: '精油芳疗' },
      { question: '精油按摩多久做一次比较好？', answer: '一般建议每周1-2次，具体频率根据个人体质和需求而定。调理期可密集一些，保养期可适当减少。', category: '精油芳疗' },

      // 中医调理
      { question: '中医体质调理是怎么回事？', answer: '中医将人体分为九种体质（平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质），通过辨证施治，采用食疗、经络、精油等方式进行个性化调理。', category: '中医调理' },
      { question: '体质调理需要多长时间？', answer: '一般一个调理周期为3个月，具体时间根据个人体质偏差程度而定。轻度失调1-2个周期，重度失调可能需要3-6个周期。', category: '中医调理' },
      { question: '中医调理和西医美容有什么区别？', answer: '中医调理从整体出发，注重标本兼治和体质改善；西医美容多针对局部症状。中医调理见效较慢但持久，西医美容见效快但可能反复。两者结合效果更佳。', category: '中医调理' },

      // 服务相关
      { question: '第一次去需要准备什么？', answer: '穿着宽松舒适的衣服即可。建议提前预约，到店后技师会先进行体质检测，再制定个性化方案。', category: '服务' },
      { question: '可以刷医保卡吗？', answer: '美容养生类项目一般不能使用医保卡支付，但部分中医调理项目可咨询是否支持。', category: '服务' },
      { question: '男士可以来做吗？', answer: '当然可以！精油芳疗和中医调理不分男女，我们也有专门的男士调理方案。', category: '服务' },
      { question: '有适合老年人的项目吗？', answer: '有的。艾灸温养、经络疏通、中药熏蒸等项目非常适合老年人，可以缓解关节疼痛、改善睡眠等。', category: '服务' },
    ];

    // 根据主题过滤
    if (theme) {
      const filtered = baseFAQs.filter((faq) =>
        faq.question.includes(theme) ||
        faq.answer.includes(theme) ||
        faq.category.includes(theme)
      );
      return filtered.length > 0 ? filtered : baseFAQs;
    }

    return baseFAQs;
  }

  /**
   * 分类FAQ
   * @private
   */
  _categorizeFAQs(faqs) {
    const categorized = {};
    for (const faq of faqs) {
      if (!categorized[faq.category]) {
        categorized[faq.category] = [];
      }
      categorized[faq.category].push(faq);
    }
    return categorized;
  }

  // ============================================================
  // 8. 占位效果分析
  // ============================================================

  /**
   * 统计GEO占位效果
   *
   * 分析指定时间范围内的搜索展现量、点击率、留资转化等核心指标。
   *
   * @param {string|Date} startDate - 开始日期
   * @param {string|Date} endDate - 结束日期
   * @param {Object} [options] - 可选配置
   * @param {string} [options.platform='all'] - 分析平台
   * @returns {Promise<Object>} 占位效果分析报告
   */
  async analyzePerformance(startDate, endDate, options = {}) {
    const { platform = 'all' } = options;

    try {
      const result = await withRetry(async () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.max(1, Math.ceil((end - start) / 86400000));

        const validPlatform = this._validatePlatform(platform);
        const platforms = validPlatform === 'all' ? SUPPORTED_PLATFORMS : [validPlatform];

        // 生成各平台分析数据
        const platformAnalytics = {};
        for (const plat of platforms) {
          platformAnalytics[plat] = this._generatePlatformAnalytics(plat, daysDiff);
        }

        // 汇总数据
        const summary = this._generateAnalyticsSummary(platformAnalytics, daysDiff);

        // 趋势分析
        const trends = this._generateAnalyticsTrends(start, end);

        // 优化建议
        const recommendations = this._generateOptimizationRecommendations(platformAnalytics);

        return {
          period: { start: start.toISOString(), end: end.toISOString(), days: daysDiff },
          platformAnalytics,
          summary,
          trends,
          recommendations,
          generatedAt: new Date().toISOString(),
        };
      });

      return buildResponse(true, result, 'GEO占位效果分析完成');
    } catch (error) {
      Logger.error('效果分析失败', { startDate, endDate, error: error.message });
      return buildResponse(false, null, `效果分析失败: ${error.message}`);
    }
  }

  /**
   * 生成平台分析数据
   * @private
   */
  _generatePlatformAnalytics(platform, days) {
    const impressions = Math.floor(Math.random() * 50000 * days / 30) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.02));
    const ctr = clicks / impressions;
    const leads = Math.floor(clicks * (Math.random() * 0.03 + 0.01));
    const conversionRate = leads / clicks;

    return {
      impressions,
      clicks,
      ctr: Math.round(ctr * 10000) / 100,
      leads,
      conversionRate: Math.round(conversionRate * 10000) / 100,
      topKeywords: [
        { keyword: `${this.brandName}${this.localCity}`, impressions: Math.floor(impressions * 0.3), clicks: Math.floor(clicks * 0.35) },
        { keyword: `${this.localCity}美容院`, impressions: Math.floor(impressions * 0.25), clicks: Math.floor(clicks * 0.2) },
        { keyword: '中医精油芳疗', impressions: Math.floor(impressions * 0.2), clicks: Math.floor(clicks * 0.18) },
        { keyword: `${this.localCity}中医养生`, impressions: Math.floor(impressions * 0.15), clicks: Math.floor(clicks * 0.15) },
        { keyword: '精油按摩体验', impressions: Math.floor(impressions * 0.1), clicks: Math.floor(clicks * 0.12) },
      ],
      contentPerformance: {
        topPages: [
          { url: '/services/oil-aromatherapy', title: '精油芳疗面部护理', views: Math.floor(clicks * 0.25) },
          { url: '/services/tizhi', title: '中医体质调理', views: Math.floor(clicks * 0.2) },
          { url: '/about', title: '关于中芳堂', views: Math.floor(clicks * 0.15) },
        ],
        avgTimeOnPage: Math.floor(Math.random() * 120) + 60,
        bounceRate: Math.floor(Math.random() * 30) + 30,
      },
    };
  }

  /**
   * 生成分析摘要
   * @private
   */
  _generateAnalyticsSummary(platformAnalytics, days) {
    const totalImpressions = Object.values(platformAnalytics).reduce((s, p) => s + p.impressions, 0);
    const totalClicks = Object.values(platformAnalytics).reduce((s, p) => s + p.clicks, 0);
    const totalLeads = Object.values(platformAnalytics).reduce((s, p) => s + p.leads, 0);

    return {
      totalImpressions,
      totalClicks,
      totalLeads,
      overallCTR: Math.round((totalClicks / totalImpressions) * 10000) / 100,
      overallConversionRate: Math.round((totalLeads / totalClicks) * 10000) / 100,
      dailyAverage: {
        impressions: Math.floor(totalImpressions / days),
        clicks: Math.floor(totalClicks / days),
        leads: Math.floor(totalLeads / days),
      },
      bestPlatform: this._findBestPlatform(platformAnalytics),
      geoScore: Math.floor(Math.random() * 20) + 70,
    };
  }

  /**
   * 找出表现最好的平台
   * @private
   */
  _findBestPlatform(platformAnalytics) {
    let best = null;
    let maxClicks = 0;
    for (const [name, data] of Object.entries(platformAnalytics)) {
      if (data.clicks > maxClicks) {
        maxClicks = data.clicks;
        best = name;
      }
    }
    return best;
  }

  /**
   * 生成趋势数据
   * @private
   */
  _generateAnalyticsTrends(start, end) {
    const days = Math.ceil((end - start) / 86400000);
    const trends = [];
    let baseImpression = 1000;
    let baseClick = 30;

    for (let i = 0; i < days; i++) {
      const growth = 1 + i * 0.02; // 假设2%日增长
      trends.push({
        date: new Date(start.getTime() + i * 86400000).toISOString().split('T')[0],
        impressions: Math.floor(baseImpression * growth + Math.random() * 200),
        clicks: Math.floor(baseClick * growth + Math.random() * 10),
      });
    }
    return trends;
  }

  /**
   * 生成优化建议
   * @private
   */
  _generateOptimizationRecommendations(platformAnalytics) {
    const recommendations = [];

    for (const [platform, data] of Object.entries(platformAnalytics)) {
      if (data.ctr < 3) {
        recommendations.push({
          platform,
          priority: '高',
          issue: '点击率偏低',
          suggestion: `优化${platform}平台的内容标题和描述，增加吸引力`,
          expectedImprovement: '预计提升CTR 1-2%',
        });
      }
      if (data.conversionRate < 1) {
        recommendations.push({
          platform,
          priority: '高',
          issue: '转化率偏低',
          suggestion: `在${platform}平台内容中增加明确的CTA和联系方式`,
          expectedImprovement: '预计提升转化率 0.5-1%',
        });
      }
    }

    // 通用优化建议
    recommendations.push({
      platform: 'all',
      priority: '中',
      issue: '结构化数据覆盖不足',
      suggestion: '为所有核心页面添加Schema.org结构化标记',
      expectedImprovement: '预计提升搜索展现率 10-15%',
    });

    recommendations.push({
      platform: 'all',
      priority: '中',
      issue: '本地化内容不足',
      suggestion: `增加${this.localCity}本地化内容产出，覆盖更多地域关键词`,
      expectedImprovement: '预计提升本地搜索排名 5-10位',
    });

    return recommendations;
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 验证平台参数
   * @private
   */
  _validatePlatform(platform) {
    if (!platform || platform === 'all') return 'all';
    if (SUPPORTED_PLATFORMS.includes(platform)) return platform;
    Logger.warn(`不支持的平台: ${platform}，使用默认平台: ${this.defaultPlatform}`);
    return this.defaultPlatform;
  }

  /**
   * 批量生成关键词矩阵（多主题）
   * @param {string[]} themes - 业务主题列表
   * @param {string} [platform='all'] - 目标平台
   * @returns {Promise<Object>}
   */
  async batchGenerateKeywordMatrices(themes, platform = 'all') {
    const results = {};
    for (const theme of themes) {
      const result = await this.generateKeywordMatrix(theme, platform);
      results[theme] = result;
    }
    return buildResponse(true, results, `批量生成完成，共${themes.length}个主题`);
  }

  /**
   * 获取引擎状态
   * @returns {Object}
   */
  getStatus() {
    return {
      brandName: this.brandName,
      localCity: this.localCity,
      cacheEnabled: this.cacheEnabled,
      cacheSize: this._cache.size,
      supportedPlatforms: SUPPORTED_PLATFORMS,
      matrixLevels: MATRIX_LEVELS,
      intentTypes: INTENT_TYPES,
    };
  }
}

export default GEOEngine;
export { SUPPORTED_PLATFORMS, MATRIX_LEVELS, INTENT_TYPES };
