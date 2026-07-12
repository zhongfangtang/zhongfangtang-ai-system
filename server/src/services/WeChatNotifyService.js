/**
 * 微信公众号模板消息通知服务
 *
 * 利用已认证的服务号，给运营者/管理员发内部通知。
 * 替代企微未认证方案——公众号已加 IP 白名单、已验 token，
 * 模板消息开箱即用。
 *
 * 使用场景：
 *   - 内容生成完成通知
 *   - 发布成功/失败通知
 *   - 系统告警
 */

import axios from 'axios';
import config from '../../config/default.js';
import { getAccessToken } from './WeChatTokenService.js';
import logger from '../utils/logger.js';

const API_BASE = 'https://api.weixin.qq.com/cgi-bin';

/**
 * 发送模板消息
 * @param {object} opt
 * @param {string} opt.touser     接收者 openid（需关注服务号）
 * @param {string} opt.templateId 模板 ID（需在公众号后台预先创建）
 * @param {object} opt.data       模板数据 { key: { value, color? } }
 * @param {string} [opt.url]      点击跳转链接
 * @returns {Promise<{success:boolean, msgid?:string, error?:string}>}
 */
export async function sendTemplateMessage(opt = {}) {
  const { touser, templateId, data, url } = opt;
  if (!touser) return { success: false, error: '缺少接收者 openid (touser)' };
  if (!templateId) return { success: false, error: '缺少模板 ID (templateId)' };

  try {
    const token = await getAccessToken();
    const resp = await axios.post(
      `${API_BASE}/message/template/send`,
      {
        touser,
        template_id: templateId,
        url: url || '',
        data: data || {},
      },
      { params: { access_token: token }, timeout: 15000 }
    );
    const d = resp.data;
    if (d.errcode === 0) {
      logger.info('服务号模板消息已发送', { touser, msgid: d.msgid });
      return { success: true, msgid: d.msgid };
    }
    logger.warn('服务号模板消息发送失败', { errcode: d.errcode, errmsg: d.errmsg });
    return { success: false, error: `errcode=${d.errcode}: ${d.errmsg}` };
  } catch (err) {
    logger.error('服务号模板消息异常', { error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * 发送纯文本客服消息（不需要模板，更灵活）
 * 限制：48 小时内用户有过互动才能发
 * @param {object} opt
 * @param {string} opt.touser  接收者 openid
 * @param {string} opt.content 文本内容（≤2048 字节）
 */
export async function sendCustomText(opt = {}) {
  const { touser, content } = opt;
  if (!touser || !content) return { success: false, error: '缺少 touser 或 content' };

  try {
    const token = await getAccessToken();
    const resp = await axios.post(
      `${API_BASE}/message/custom/send`,
      {
        touser,
        msgtype: 'text',
        text: { content: String(content).slice(0, 2048) },
      },
      { params: { access_token: token }, timeout: 15000 }
    );
    const d = resp.data;
    if (d.errcode === 0) {
      logger.info('服务号客服消息已发送', { touser });
      return { success: true };
    }
    return { success: false, error: `errcode=${d.errcode}: ${d.errmsg}` };
  } catch (err) {
    logger.error('服务号客服消息异常', { error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * 系统通知：一键通知运营者（封装通用通知场景）
 * @param {object} opt
 * @param {string} opt.type     'content_ready' | 'publish_ok' | 'publish_fail' | 'alert'
 * @param {object} [opt.extra]  额外参数
 */
export async function notifyAdmin(opt = {}) {
  const { type, extra = {} } = opt;
  const openid = process.env.WEIXIN_ADMIN_OPENID || '';

  // 默认模板消息映射（正式使用时在公众号后台创建模板后替换 templateId）
  const NOTIFY_TEMPLATES = {
    content_ready: { templateId: process.env.WX_TEMPLATE_CONTENT_READY || '', dataKey: 'content_ready' },
    publish_ok:    { templateId: process.env.WX_TEMPLATE_PUBLISH_OK || '', dataKey: 'publish_ok' },
    publish_fail:  { templateId: process.env.WX_TEMPLATE_PUBLISH_FAIL || '', dataKey: 'publish_fail' },
    alert:         { templateId: process.env.WX_TEMPLATE_ALERT || '', dataKey: 'alert' },
  };

  const tpl = NOTIFY_TEMPLATES[type];
  if (!tpl) return { success: false, error: `未知通知类型: ${type}` };

  // 如果有模板 ID → 发模板消息；否则 → 发客服文本消息
  if (tpl.templateId && openid) {
    const data = buildTemplateData(type, extra);
    return sendTemplateMessage({ touser: openid, templateId: tpl.templateId, data, url: extra.url });
  }

  // 降级：客服文本消息
  if (openid) {
    const text = buildNotifyText(type, extra);
    return sendCustomText({ touser: openid, content: text });
  }

  return { success: false, error: '未配置接收者 openid (WEIXIN_ADMIN_OPENID)，请先关注服务号并获取 openid' };
}

function buildTemplateData(type, extra) {
  switch (type) {
    case 'content_ready':
      return {
        first:  { value: '📝 AI 内容已生成', color: '#3fb98a' },
        keyword1: { value: extra.title || '—' },
        keyword2: { value: extra.platform || '—' },
        keyword3: { value: new Date().toLocaleString('zh-CN') },
        remark: { value: '点击查看详情并发布', color: '#7878a0' },
      };
    case 'publish_ok':
      return {
        first:  { value: '✅ 内容发布成功', color: '#3fb98a' },
        keyword1: { value: extra.title || '—' },
        keyword2: { value: extra.platform || '—' },
        keyword3: { value: new Date().toLocaleString('zh-CN') },
        remark: { value: '已成功推送至平台', color: '#7878a0' },
      };
    case 'publish_fail':
      return {
        first:  { value: '❌ 内容发布失败', color: '#e06c6c' },
        keyword1: { value: extra.title || '—' },
        keyword2: { value: extra.platform || '—' },
        keyword3: { value: extra.error || '未知错误' },
        remark: { value: '请登录后台查看详情', color: '#e06c6c' },
      };
    case 'alert':
      return {
        first:  { value: '⚠️ 系统告警', color: '#d4a853' },
        keyword1: { value: extra.title || '—' },
        keyword2: { value: extra.level || 'warning' },
        keyword3: { value: new Date().toLocaleString('zh-CN') },
        remark: { value: extra.detail || '' },
      };
    default:
      return {};
  }
}

function buildNotifyText(type, extra) {
  switch (type) {
    case 'content_ready': return `📝 AI 内容已生成\n标题: ${extra.title || '—'}\n平台: ${extra.platform || '—'}\n时间: ${new Date().toLocaleString('zh-CN')}`;
    case 'publish_ok':   return `✅ 发布成功\n${extra.title || ''} → ${extra.platform || ''}`;
    case 'publish_fail': return `❌ 发布失败\n${extra.title || ''} → ${extra.platform || ''}\n原因: ${extra.error || '未知'}`;
    case 'alert':        return `⚠️ 系统告警\n${extra.title || ''}\n${extra.detail || ''}`;
    default:             return `中芳堂AI通知: ${JSON.stringify(extra)}`;
  }
}

export default { sendTemplateMessage, sendCustomText, notifyAdmin };
