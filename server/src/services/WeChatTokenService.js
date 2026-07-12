/**
 * 微信公众号/服务号 access_token 服务
 *
 * 公众号是「应用级」凭证：AppID + AppSecret 直接换 access_token，
 * 无需浏览器 OAuth 授权（与抖音来客不同）。
 * token 有效期 7200s，本服务做内存缓存，过期前 5 分钟自动刷新。
 *
 * 注意：视频号(Channels)走的是另一套接口，本服务仅覆盖公众号(cgi-bin)。
 */

import axios from 'axios';
import config from '../../config/default.js';
import logger from '../utils/logger.js';

let cache = { token: null, expiresAt: 0 };

/**
 * 获取有效的 access_token（缓存优先，过期前自动刷新）
 * @returns {Promise<string>}
 */
export async function getAccessToken() {
  if (cache.token && Date.now() < cache.expiresAt - 5 * 60 * 1000) {
    return cache.token;
  }
  const { appId, appSecret } = config.platforms.weixin;
  if (!appId || !appSecret) {
    throw new Error('微信 AppID/AppSecret 未配置（请先在 .env 填 WEIXIN_APP_ID/WEIXIN_APP_SECRET）');
  }
  const r = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
    params: { grant_type: 'client_credential', appid: appId, secret: appSecret },
    timeout: 15000,
  });
  const d = r.data;
  if (!d.access_token) {
    throw new Error('微信获取 access_token 失败：' + JSON.stringify(d));
  }
  cache = { token: d.access_token, expiresAt: Date.now() + (d.expires_in || 7200) * 1000 };
  logger.info('微信 access_token 已获取', { expiresIn: d.expires_in });
  return d.access_token;
}

/** 主动失效缓存（更换密钥后调用） */
export function invalidate() {
  cache = { token: null, expiresAt: 0 };
}

export default { getAccessToken, invalidate };
