/**
 * GEO搜索占位引擎 RESTful API 路由
 *
 * 为中芳堂全域AI智能体系统提供GEO搜索占位相关的API接口。
 * 所有接口需要JWT认证保护。
 *
 * @module geoRoutes
 * @author 中芳堂技术团队
 * @version 2.0.0
 * @since 2026-07
 */

const express = require('express');
const router = express.Router();

// 参数验证中间件
const { body, query, param, validationResult } = require('express-validator');

// 引入GEOEngine和知识库
const GEOEngine = require('../engines/GEOEngine');
const geoKB = require('../knowledge-base/geo-kb');

// 初始化引擎实例
const geoEngine = new GEOEngine({
  knowledgeBase: geoKB,
  cacheEnabled: true,
  defaultPlatform: 'baidu',
  localCity: '宜昌',
  brandName: '中芳堂',
  brandFullName: '中芳堂中医芳香疗法美容美体养生机构',
});

// ============================================================
// 中间件
// ============================================================

/**
 * JWT认证中间件
 * 验证请求是否携带有效的JWT Token
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        data: null,
        message: '缺少认证令牌，请在Authorization头中提供Bearer Token',
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: '认证令牌格式无效',
        timestamp: new Date().toISOString(),
      });
    }

    // 验证JWT Token
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'zhongfangtang-geo-secret-key-2026';
    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        message: '认证令牌已过期，请重新登录',
        timestamp: new Date().toISOString(),
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        data: null,
        message: '认证令牌无效',
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(500).json({
      success: false,
      data: null,
      message: '认证服务异常',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 参数验证错误处理中间件
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: errors.array(),
      message: '请求参数验证失败',
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

/**
 * API限流中间件（简单实现）
 */
const rateLimiter = (() => {
  const requests = new Map();
  const WINDOW_MS = 60000; // 1分钟窗口
  const MAX_REQUESTS = 100; // 每分钟最多100次

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key).filter((t) => t > windowStart);
    userRequests.push(now);
    requests.set(key, userRequests);

    if (userRequests.length > MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        data: null,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil(WINDOW_MS / 1000),
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
})();

// ============================================================
// API路由
// ============================================================

/**
 * @route   GET /api/v1/geo/status
 * @desc    获取GEO引擎状态
 * @access  Private (JWT)
 */
router.get('/status', authenticateJWT, (req, res) => {
  try {
    const status = geoEngine.getStatus();
    res.json({
      success: true,
      data: status,
      message: 'GEO引擎状态正常',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取引擎状态失败: ${error.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   POST /api/v1/geo/keyword-matrix
 * @desc    生成关键词矩阵（五层矩阵模型）
 * @access  Private (JWT)
 *
 * @body    {string} theme     - 业务主题，如"精油芳疗""中医调理""体质养生"
 * @body    {string} [platform] - 目标平台，默认'all'
 * @body    {boolean} [forceRefresh] - 是否强制刷新缓存
 *
 * @returns {Object} 关键词矩阵
 */
router.post(
  '/keyword-matrix',
  authenticateJWT,
  rateLimiter,
  [
    body('theme')
      .isString()
      .withMessage('主题(theme)必须为字符串')
      .isLength({ min: 2, max: 50 })
      .withMessage('主题长度应在2-50个字符之间')
      .trim(),
    body('platform')
      .optional()
      .isIn(['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili', 'all'])
      .withMessage('不支持的平台类型'),
    body('forceRefresh')
      .optional()
      .isBoolean()
      .withMessage('forceRefresh必须为布尔值'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { theme, platform = 'all', forceRefresh = false } = req.body;

      if (forceRefresh) {
        geoEngine.clearCache();
      }

      const result = await geoEngine.generateKeywordMatrix(theme, platform);
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `生成关键词矩阵失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/keyword-matrix/batch
 * @desc    批量生成关键词矩阵
 * @access  Private (JWT)
 *
 * @body    {string[]} themes   - 业务主题列表
 * @body    {string} [platform] - 目标平台
 */
router.post(
  '/keyword-matrix/batch',
  authenticateJWT,
  rateLimiter,
  [
    body('themes')
      .isArray({ min: 1, max: 10 })
      .withMessage('themes必须为非空数组，最多10个主题'),
    body('themes.*')
      .isString()
      .withMessage('每个主题必须为字符串')
      .isLength({ min: 2, max: 50 }),
    body('platform')
      .optional()
      .isIn(['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili', 'all']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { themes, platform = 'all' } = req.body;
      const result = await geoEngine.batchGenerateKeywordMatrices(themes, platform);
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `批量生成关键词矩阵失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/optimize-content
 * @desc    优化内容为GEO友好格式
 * @access  Private (JWT)
 *
 * @body    {Object} content      - 原始内容对象
 * @body    {string} content.title - 内容标题
 * @body    {string} content.body  - 内容正文
 * @body    {string[]} content.tags - 内容标签
 * @body    {Object[]} content.images - 图片列表
 * @body    {string[]} keywords    - 目标关键词列表
 *
 * @returns {Object} 优化后的内容及优化报告
 */
router.post(
  '/optimize-content',
  authenticateJWT,
  rateLimiter,
  [
    body('content')
      .isObject()
      .withMessage('content必须为对象'),
    body('content.title')
      .isString()
      .withMessage('标题必须为字符串')
      .isLength({ min: 1, max: 100 })
      .withMessage('标题长度应在1-100个字符之间'),
    body('content.body')
      .isString()
      .withMessage('正文必须为字符串')
      .isLength({ min: 1, max: 50000 })
      .withMessage('正文长度应在1-50000个字符之间'),
    body('content.tags')
      .optional()
      .isArray()
      .withMessage('标签必须为数组'),
    body('content.images')
      .optional()
      .isArray()
      .withMessage('图片必须为数组'),
    body('keywords')
      .isArray({ min: 1, max: 30 })
      .withMessage('关键词必须为非空数组，最多30个'),
    body('keywords.*')
      .isString()
      .withMessage('每个关键词必须为字符串'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { content, keywords } = req.body;
      const result = await geoEngine.optimizeContentForGEO(content, keywords);
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `内容优化失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   GET /api/v1/geo/ranking/:keyword
 * @desc    查询关键词排名
 * @access  Private (JWT)
 *
 * @param   {string} keyword - 要查询的关键词
 * @query   {string} [platform=all] - 查询平台
 * @query   {number} [topN=20] - 查询前N名
 *
 * @returns {Object} 排名查询结果
 */
router.get(
  '/ranking/:keyword',
  authenticateJWT,
  rateLimiter,
  [
    param('keyword')
      .isString()
      .withMessage('关键词必须为字符串')
      .isLength({ min: 1, max: 100 })
      .withMessage('关键词长度应在1-100个字符之间'),
    query('platform')
      .optional()
      .isIn(['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili', 'all'])
      .withMessage('不支持的平台类型'),
    query('topN')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('topN应在1-50之间'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { keyword } = req.params;
      const { platform = 'all', topN = 20 } = req.query;

      const result = await geoEngine.monitorRankings([keyword], {
        platform,
        topN: parseInt(topN, 10),
      });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `查询关键词排名失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/rankings/batch
 * @desc    批量查询关键词排名
 * @access  Private (JWT)
 *
 * @body    {string[]} keywords - 关键词列表
 * @body    {string} [platform=all] - 查询平台
 * @body    {number} [topN=20] - 查询前N名
 *
 * @returns {Object} 批量排名查询结果
 */
router.post(
  '/rankings/batch',
  authenticateJWT,
  rateLimiter,
  [
    body('keywords')
      .isArray({ min: 1, max: 20 })
      .withMessage('关键词必须为非空数组，最多20个'),
    body('keywords.*')
      .isString()
      .withMessage('每个关键词必须为字符串'),
    body('platform')
      .optional()
      .isIn(['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili', 'all']),
    body('topN')
      .optional()
      .isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { keywords, platform = 'all', topN = 20 } = req.body;
      const result = await geoEngine.monitorRankings(keywords, {
        platform,
        topN: parseInt(topN, 10),
      });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `批量查询排名失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/faq-generate
 * @desc    自动生成FAQ问答库
 * @access  Private (JWT)
 *
 * @body    {string} theme - 业务主题
 * @body    {boolean} [includeSchema] - 是否包含Schema标记
 *
 * @returns {Object} FAQ问答对列表
 */
router.post(
  '/faq-generate',
  authenticateJWT,
  rateLimiter,
  [
    body('theme')
      .isString()
      .withMessage('主题必须为字符串')
      .isLength({ min: 2, max: 50 })
      .withMessage('主题长度应在2-50个字符之间')
      .trim(),
    body('includeSchema')
      .optional()
      .isBoolean()
      .withMessage('includeSchema必须为布尔值'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { theme, includeSchema = false } = req.body;
      const result = await geoEngine.generateFAQBase(theme);

      // 如果需要Schema标记
      if (includeSchema && result.success && result.data && result.data.faqs) {
        const schemaResult = await geoEngine.addStructuredMarkup({
          title: `${theme}常见问题`,
          faqs: result.data.faqs,
          type: 'faq',
        }, { schemaTypes: ['faqPage'] });
        result.data.schema = schemaResult.success ? schemaResult.data : null;
      }

      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `生成FAQ失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   GET /api/v1/geo/performance
 * @desc    GEO占位效果分析
 * @access  Private (JWT)
 *
 * @query   {string} startDate - 开始日期 (YYYY-MM-DD)
 * @query   {string} endDate   - 结束日期 (YYYY-MM-DD)
 * @query   {string} [platform=all] - 分析平台
 *
 * @returns {Object} 效果分析报告
 */
router.get(
  '/performance',
  authenticateJWT,
  rateLimiter,
  [
    query('startDate')
      .isISO8601()
      .withMessage('开始日期格式无效，请使用YYYY-MM-DD格式'),
    query('endDate')
      .isISO8601()
      .withMessage('结束日期格式无效，请使用YYYY-MM-DD格式'),
    query('platform')
      .optional()
      .isIn(['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili', 'all'])
      .withMessage('不支持的平台类型'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { startDate, endDate, platform = 'all' } = req.query;

      // 验证日期范围
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          data: null,
          message: '结束日期不能早于开始日期',
          timestamp: new Date().toISOString(),
        });
      }
      const daysDiff = Math.ceil((end - start) / 86400000);
      if (daysDiff > 365) {
        return res.status(400).json({
          success: false,
          data: null,
          message: '日期范围不能超过365天',
          timestamp: new Date().toISOString(),
        });
      }

      const result = await geoEngine.analyzePerformance(startDate, endDate, {
        platform,
      });
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `效果分析失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   GET /api/v1/geo/platform-strategy
 * @desc    获取平台GEO策略
 * @access  Private (JWT)
 *
 * @query   {string} platform - 目标平台
 *
 * @returns {Object} 平台GEO策略详情
 */
router.get(
  '/platform-strategy',
  authenticateJWT,
  rateLimiter,
  [
    query('platform')
      .isIn(['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili', 'all'])
      .withMessage('platform必须为有效平台(baidu/douyin/xiaohongshu/weixin/bilibili/all)'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { platform } = req.query;

      if (platform === 'all') {
        // 返回所有平台策略
        const platforms = ['baidu', 'douyin', 'xiaohongshu', 'weixin', 'bilibili'];
        const results = {};
        for (const plat of platforms) {
          const strategyResult = await geoEngine.getPlatformStrategy(plat);
          results[plat] = strategyResult;
        }
        return res.json({
          success: true,
          data: results,
          message: '所有平台GEO策略获取成功',
          timestamp: new Date().toISOString(),
        });
      }

      const result = await geoEngine.getPlatformStrategy(platform);
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `获取平台策略失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/structured-markup
 * @desc    为内容添加结构化数据标记
 * @access  Private (JWT)
 *
 * @body    {Object} content     - 内容对象
 * @body    {string[]} [schemaTypes] - 需要的Schema类型
 *
 * @returns {Object} 包含结构化标记的内容
 */
router.post(
  '/structured-markup',
  authenticateJWT,
  rateLimiter,
  [
    body('content')
      .isObject()
      .withMessage('content必须为对象'),
    body('content.title')
      .optional()
      .isString()
      .withMessage('标题必须为字符串'),
    body('schemaTypes')
      .optional()
      .isArray()
      .withMessage('schemaTypes必须为数组'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { content, schemaTypes } = req.body;
      const options = schemaTypes ? { schemaTypes } : {};
      const result = await geoEngine.addStructuredMarkup(content, options);
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `添加结构化标记失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/search-intent
 * @desc    分析搜索意图
 * @access  Private (JWT)
 *
 * @body    {string} query - 搜索查询词
 *
 * @returns {Object} 搜索意图分析结果
 */
router.post(
  '/search-intent',
  authenticateJWT,
  rateLimiter,
  [
    body('query')
      .isString()
      .withMessage('查询词必须为字符串')
      .isLength({ min: 2, max: 200 })
      .withMessage('查询词长度应在2-200个字符之间')
      .trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { query: searchQuery } = req.body;
      const result = await geoEngine.matchSearchIntent(searchQuery);
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `搜索意图分析失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/search-intent/batch
 * @desc    批量分析搜索意图
 * @access  Private (JWT)
 *
 * @body    {string[]} queries - 搜索查询词列表
 *
 * @returns {Object} 批量意图分析结果
 */
router.post(
  '/search-intent/batch',
  authenticateJWT,
  rateLimiter,
  [
    body('queries')
      .isArray({ min: 1, max: 20 })
      .withMessage('queries必须为非空数组，最多20个'),
    body('queries.*')
      .isString()
      .withMessage('每个查询词必须为字符串'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { queries } = req.body;
      const results = {};
      for (const q of queries) {
        const result = await geoEngine.matchSearchIntent(q);
        results[q] = result;
      }
      res.json({
        success: true,
        data: results,
        message: `批量意图分析完成，共${queries.length}个查询`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `批量意图分析失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   GET /api/v1/geo/knowledge-base
 * @desc    获取GEO知识库（公开接口，但需要基础认证）
 * @access  Private (JWT)
 *
 * @query   {string} section - 知识库模块 (platformRules|keywordMatrix|contentTemplates|schemaMarkup|optimizationRules|intentClassifier)
 *
 * @returns {Object} 知识库内容
 */
router.get(
  '/knowledge-base',
  authenticateJWT,
  rateLimiter,
  [
    query('section')
      .optional()
      .isIn([
        'platformRules',
        'keywordMatrix',
        'contentTemplates',
        'schemaMarkup',
        'optimizationRules',
        'intentClassifier',
        'localSEOStrategy',
        'all',
      ])
      .withMessage('无效的知识库模块名称'),
  ],
  validateRequest,
  (req, res) => {
    try {
      const { section = 'all' } = req.query;

      if (section === 'all') {
        return res.json({
          success: true,
          data: geoKB,
          message: 'GEO知识库全部内容',
          timestamp: new Date().toISOString(),
        });
      }

      const data = geoKB[section];
      if (!data) {
        return res.status(404).json({
          success: false,
          data: null,
          message: `知识库模块"${section}"不存在`,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data,
        message: `GEO知识库 - ${section}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `获取知识库失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   GET /api/v1/geo/optimization-rules
 * @desc    获取GEO优化规则列表
 * @access  Private (JWT)
 *
 * @query   {string} [category] - 规则分类过滤
 * @query   {string} [priority] - 优先级过滤 (高/中/低)
 *
 * @returns {Array} 优化规则列表
 */
router.get(
  '/optimization-rules',
  authenticateJWT,
  rateLimiter,
  [
    query('category')
      .optional()
      .isString(),
    query('priority')
      .optional()
      .isIn(['高', '中', '低']),
  ],
  validateRequest,
  (req, res) => {
    try {
      let rules = [...geoKB.optimizationRules];
      const { category, priority } = req.query;

      if (category) {
        rules = rules.filter((r) => r.category === category);
      }
      if (priority) {
        rules = rules.filter((r) => r.priority === priority);
      }

      res.json({
        success: true,
        data: {
          total: rules.length,
          rules,
          categories: [...new Set(rules.map((r) => r.category))],
        },
        message: `获取优化规则成功，共${rules.length}条`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        message: `获取优化规则失败: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route   POST /api/v1/geo/cache/clear
 * @desc    清除GEO引擎缓存
 * @access  Private (JWT, Admin)
 */
router.post('/cache/clear', authenticateJWT, (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '需要管理员权限',
        timestamp: new Date().toISOString(),
      });
    }

    geoEngine.clearCache();
    res.json({
      success: true,
      data: null,
      message: 'GEO引擎缓存已清除',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `清除缓存失败: ${error.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================
// 错误处理中间件
// ============================================================

/**
 * 404处理
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 全局错误处理
 */
router.use((err, req, res, _next) => {
  console.error('GEO API 全局错误:', err);
  res.status(500).json({
    success: false,
    data: null,
    message: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : `服务器错误: ${err.message}`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
