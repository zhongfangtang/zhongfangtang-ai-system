/**
 * 通知与短信服务 - NotificationService
 *
 * 统一通知渠道，支持多渠道消息推送。
 * 预留接口：企业微信/短信/微信公众号模板消息/邮件/App Push
 *
 * 市场最佳实践：
 * - 企业微信：免费，适合内部运营通知
 * - 腾讯云短信：¥0.045/条，适合客户触达
 * - 微信公众号模板消息：免费，适合客户触达
 * - 邮件（Resend/SendGrid）：免费额度，适合报表
 *
 * @module services/NotificationService
 */

import { createModuleLogger } from '../utils/logger.js';
import config from '../../config/default.js';

const logger = createModuleLogger('NotificationService');

export default class NotificationService {
  constructor() {
    this.channels = {
      wework: Boolean(config.wework.corpId),
      sms: Boolean(config.sms?.apiKey),
      wechat: Boolean(config.miniprogram?.appId),
      email: Boolean(config.email?.apiKey),
    };
    logger.info('通知服务初始化', { channels: Object.keys(this.channels).filter(k => this.channels[k]) });
  }

  /**
   * 发送通知（自动选择最佳渠道）
   * @param {Object} options - { to, type, template, data, channels? }
   */
  async send(options) {
    const { to, type, template, data = {}, channels } = options;
    const results = [];
    const targetChannels = channels || Object.keys(this.channels).filter(k => this.channels[k]);

    for (const channel of targetChannels) {
      try {
        const result = await this._sendVia(channel, { to, type, template, data });
        results.push({ channel, success: true, ...result });
      } catch (err) {
        logger.warn(`通知发送失败: ${channel}`, { error: err.message });
        results.push({ channel, success: false, error: err.message });
      }
    }

    // 至少一个渠道成功
    const anySuccess = results.some(r => r.success);
    return { success: anySuccess, results };
  }

  /**
   * 发送短信验证码
   */
  async sendSMS(phone, code, ttl = 300) {
    return this.send({ to: phone, type: 'verification', template: 'sms_code', data: { code, ttl }, channels: ['sms'] });
  }

  /**
   * 发送客户关怀通知
   */
  async sendCareNotification(customerId, type, data) {
    const scenarios = {
      birthday: { template: '生日祝福', content: `亲爱的${data.name || '客户'}，中芳堂祝您生日快乐！🎂 到店享生日专属优惠～` },
      repurchase: { template: '复购提醒', content: `距上次护理已过${data.days || 21}天，是时候给自己安排一次精油SPA了 💆‍♀️` },
      points: { template: '积分变动', content: `您的积分已${data.change > 0 ? '增加' : '减少'}${Math.abs(data.change)}分，当前余额${data.balance}分` },
      promotion: { template: '活动通知', content: data.content || '中芳堂最新优惠活动已上线，点击查看 >>' },
    };

    const scenario = scenarios[type] || scenarios.promotion;
    return this.send({ to: customerId, type, template: scenario.template, data: { ...data, content: scenario.content } });
  }

  // ==================== 各渠道 ====================

  async _sendVia(channel, options) {
    switch (channel) {
      case 'wework': return this._sendWework(options);
      case 'sms': return this._sendSMSViaProvider(options);
      case 'wechat': return this._sendWechatTemplate(options);
      case 'email': return this._sendEmail(options);
      default: throw new Error(`未知通知渠道: ${channel}`);
    }
  }

  async _sendWework(options) {
    // 企业微信应用消息
    // 预留接口：https://qyapi.weixin.qq.com/cgi-bin/message/send
    logger.info(`[企微] 发送通知: ${options.type} -> ${options.to}`);
    return { messageId: `wework_${Date.now()}` };
  }

  async _sendSMSViaProvider(options) {
    // 腾讯云短信
    // 预留接口：https://sms.tencentcloudapi.com/
    logger.info(`[短信] 发送验证码: ${options.to}`);
    return { messageId: `sms_${Date.now()}` };
  }

  async _sendWechatTemplate(options) {
    // 微信公众号模板消息
    // 预留接口：https://api.weixin.qq.com/cgi-bin/message/template/send
    logger.info(`[微信] 发送模板消息: ${options.type} -> ${options.to}`);
    return { messageId: `wechat_${Date.now()}` };
  }

  async _sendEmail(options) {
    // 邮件服务（Resend/SendGrid）
    // 预留接口
    logger.info(`[邮件] 发送: ${options.type} -> ${options.to}`);
    return { messageId: `email_${Date.now()}` };
  }
}
