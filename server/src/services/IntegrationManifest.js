/**
 * 外部系统对接接口预留清单
 *
 * 本文档列出中芳堂AI智能体系统预留的所有外部对接接口，
 * 遵循"配置即启用"原则：填入密钥即生效，未填入则优雅降级。
 */

export const INTEGRATION_MANIFEST = {
  // ==================== AI模型 ====================
  ai: {
    siliconflow: { name: '硅基流动', url: 'https://siliconflow.cn', cost: '免费额度', priority: 1, envKey: 'SILICONFLOW_API_KEY' },
    deepseek: { name: 'DeepSeek', url: 'https://platform.deepseek.com', cost: '¥1/百万token', priority: 2, envKey: 'DEEPSEEK_API_KEY' },
    qwen: { name: '通义千问', url: 'https://dashscope.aliyun.com', cost: '¥4/百万token', priority: 3, envKey: 'QWEN_API_KEY' },
    gemini: { name: 'Google Gemini', url: 'https://aistudio.google.com', cost: '免费额度', priority: 4, envKey: 'GEMINI_API_KEY' },
  },

  // ==================== 平台发布 ====================
  platforms: {
    douyin: { name: '抖音来客(本地生活)', url: 'https://open.douyin.com', authType: 'OAuth2', mode: 'semi-auto', envKeys: ['DOUYIN_APP_ID', 'DOUYIN_APP_SECRET'] },
    xiaohongshu: { name: '小红书开放平台', url: 'https://open.xiaohongshu.com', authType: 'OAuth2', mode: 'semi-auto', envKey: 'XHS_ACCESS_TOKEN' },
    weixin: { name: '微信公众号(服务号)', url: 'https://mp.weixin.qq.com', authType: 'AppSecret', mode: 'full-auto', envKeys: ['WEIXIN_APP_ID', 'WEIXIN_APP_SECRET'] },
    kuaishou: { name: '快手开放平台', url: 'https://open.kuaishou.com', authType: 'OAuth2', mode: 'semi-auto', envKey: 'KUAISHOU_ACCESS_TOKEN' },
    bilibili: { name: 'B站创作中心', url: 'https://member.bilibili.com', authType: 'Cookie', mode: 'full-auto', envKey: 'BILIBILI_SESSDATA' },
    baijiahao: { name: '百家号', url: 'https://baijiahao.baidu.com', authType: 'Cookie', mode: 'full-auto', envKey: 'BAIJIAHAO_COOKIE' },
  },

  // ==================== 支付 ====================
  payment: {
    wechat: { name: '微信支付', url: 'https://pay.weixin.qq.com', cost: '0.6%费率', envKeys: ['WECHAT_MCH_ID', 'WECHAT_API_KEY'] },
    alipay: { name: '支付宝', url: 'https://open.alipay.com', cost: '0.6%费率', envKeys: ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY'] },
    installment: { name: '花呗分期', url: 'https://open.alipay.com', cost: '按费率', envKeys: [] },
    bnpl: { name: '先享后付(芝麻信用)', url: 'https://open.alipay.com', cost: '免费', envKeys: ['ALIPAY_APP_ID'] },
    ecny: { name: '数字人民币', url: 'https://www.ecny.gov.cn', cost: '免费', envKeys: ['ECNY_MERCHANT_ID'] },
  },

  // ==================== 通知 ====================
  notification: {
    sms: { name: '腾讯云短信', url: 'https://cloud.tencent.com/product/sms', cost: '¥0.045/条', envKeys: ['SMS_APP_ID', 'SMS_API_KEY'] },
    wework: { name: '企业微信', url: 'https://work.weixin.qq.com', cost: '免费', envKeys: ['WEWORK_CORP_ID', 'WEWORK_CORP_SECRET'] },
    email: { name: 'Resend邮件', url: 'https://resend.com', cost: '免费100封/天', envKeys: ['EMAIL_API_KEY'] },
    miniprogram: { name: '微信小程序订阅消息', url: 'https://developers.weixin.qq.com', cost: '免费', envKeys: ['MINIPROGRAM_APP_ID'] },
  },

  // ==================== 外部系统 ====================
  external: {
    erp: { name: '美业ERP(有赞/美团/客如云)', url: '', cost: '按服务商', envKeys: ['ERP_API_BASE', 'ERP_API_KEY'] },
    wanjiH1: { name: '腕家H1健康手表', url: '', cost: '硬件成本', envKeys: ['WANJIA_H1_APP_KEY'] },
    insurance: { name: '保险合作(众安/平安)', url: '', cost: '合作', envKeys: ['INSURANCE_API_KEY'] },
    mobile: { name: '移动合作(中国移动)', url: '', cost: '合作', envKeys: ['MOBILE_API_KEY'] },
    travel: { name: '旅游合作(携程/美团)', url: '', cost: '合作', envKeys: ['TRAVEL_API_KEY'] },
  },

  // ==================== 前沿模块 ====================
  cuttingEdge: {
    digitalHuman: { name: '数字人直播(硅基智能)', url: 'https://www.guiji.ai', cost: '¥500/月起', envKeys: ['DIGITALHUMAN_API_KEY'] },
    metaverse: { name: '元宇宙展厅(Three.js自建)', url: '', cost: '免费(自建)', envKeys: [] },
    ffmpeg: { name: 'FFmpeg视频处理', url: 'https://ffmpeg.org', cost: '免费开源', envKeys: [] },
    edgeTTS: { name: 'Edge TTS配音', url: '', cost: '免费', envKeys: [] },
  },

  // ==================== 监控告警 ====================
  monitoring: {
    health: { name: '健康检查', endpoint: '/health', cost: '免费' },
    metrics: { name: '系统指标', endpoint: '/api/v1/system/metrics', cost: '免费' },
    alert: { name: '告警Webhook(钉钉/飞书)', url: '', cost: '免费', envKeys: ['ALERT_WEBHOOK'] },
  },
};

/**
 * 检查哪些接口已配置
 */
export function getConfiguredIntegrations() {
  const configured = [];
  const flat = {};

  for (const [category, items] of Object.entries(INTEGRATION_MANIFEST)) {
    for (const [key, item] of Object.entries(items)) {
      const allKeys = item.envKeys || [item.envKey].filter(Boolean);
      // 占位符 __REPLACE_ME__ / 空值 视为未配置，避免误报"已配置"
      const isSet = (k) => {
        const v = process.env[k];
        return v && v !== '__REPLACE_ME__' && v.trim() !== '';
      };
      const configuredCount = allKeys.filter(isSet).length;
      const status = allKeys.length === 0 ? 'builtin' : configuredCount === allKeys.length ? 'configured' : configuredCount > 0 ? 'partial' : 'pending';
      configured.push({ category, key, name: item.name, status, cost: item.cost });
    }
  }

  return configured;
}
