/**
 * 抖音来客（抖音开放平台）OAuth 授权服务
 *
 * 标准「授权码模式」：
 *   1) buildAuthUrl  → 拼接授权跳转地址（前端打开，用户扫码/登录授权）
 *   2) 抖音 302 跳回 redirect_uri?code=xxx&state=yyy
 *   3) completeAuth  → 用 code 换 access_token / refresh_token，落库 + 写内存 + 持久化 .env
 *   4) refreshAndStore → refresh_token 过期前刷新
 *
 * 回调地址默认取 .env 的 DOUYIN_REDIRECT_URI；前端可传 ?redirect_uri=覆盖，
 * 这样无论沙箱预览域名还是生产域名都能直接用，无需为环境改配置。
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../config/default.js';
import logger from '../utils/logger.js';
import { PlatformAccount } from '../services/DatabaseService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/src/services → server/.env
const ENV_PATH = path.resolve(__dirname, '../../.env');

const AUTHORIZE_URL = 'https://open.douyin.com/platform/oauth/connect/';
const TOKEN_URL = 'https://open.douyin.com/oauth/access_token/';
const REFRESH_URL = 'https://open.douyin.com/oauth/refresh_token/';

/**
 * 拼接授权跳转地址
 * @param {string} [state]
 * @param {string} [redirectUri] 覆盖用（前端传当前页面 origin + /callback/douyin）
 */
export function buildAuthUrl(state, redirectUri) {
  const clientKey = config.platforms.douyin.appId;
  const redirect = redirectUri || config.platforms.douyin.redirectUri;
  if (!clientKey) throw new Error('抖音 AppID 未配置（请先在 .env 填 DOUYIN_APP_ID）');
  if (!redirect) throw new Error('抖音回调地址未配置（DOUYIN_REDIRECT_URI）');

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    redirect_uri: redirect,
    state: state || 'zft',
  });
  const scope = config.platforms.douyin.scope;
  if (scope) params.set('scope', scope);

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * 用授权码换取 token
 * @param {string} code
 */
export async function exchangeCode(code) {
  const { appId, appSecret } = config.platforms.douyin;
  const r = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      client_key: appId,
      client_secret: appSecret,
      code,
      grant_type: 'authorization_code',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  const d = r.data?.data;
  if (!d || !d.access_token) {
    throw new Error('换取 access_token 失败：' + JSON.stringify(r.data).slice(0, 200));
  }
  return d; // { access_token, expires_in, open_id, refresh_token, scope }
}

/**
 * 获取账号基本信息（尽力而为，失败不计）
 */
export async function getAccountInfo(accessToken) {
  try {
    const r = await axios.get('https://open.douyin.com/oauth/account/info/', {
      params: { access_token: accessToken },
      timeout: 10000,
    });
    return r.data?.data || null; // { name, avatar, open_id }
  } catch {
    return null;
  }
}

/**
 * 刷新 token
 */
export async function refreshToken(refreshToken) {
  const r = await axios.post(
    REFRESH_URL,
    new URLSearchParams({
      client_key: config.platforms.douyin.appId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  const d = r.data?.data;
  if (!d || !d.access_token) {
    throw new Error('刷新 token 失败：' + JSON.stringify(r.data).slice(0, 200));
  }
  return d;
}

/**
 * 完整授权闭环：换码 → 落库 → 写内存 → 持久化 .env
 * @param {string} code
 * @returns {Promise<{account:object, token:object}>}
 */
export async function completeAuth(code) {
  const token = await exchangeCode(code);
  let info = null;
  try {
    info = await getAccountInfo(token.access_token);
  } catch {
    /* 忽略 */
  }

  const openId = token.open_id || info?.open_id || '';
  const accountName = info?.name || `抖音账号${(openId || '').slice(-6) || '（待命名）'}`;

  const account = await PlatformAccount.findOneAndUpdate(
    { platform: 'douyin', accountId: openId },
    {
      platform: 'douyin',
      accountName,
      accountId: openId,
      avatar: info?.avatar || '',
      accessToken: token.access_token,
      refreshToken: token.refresh_token || '',
      tokenExpiresAt: new Date(Date.now() + (token.expires_in || 1296000) * 1000),
      status: 'active',
      metadata: { scope: token.scope, from: 'oauth' },
    },
    { upsert: true, new: true }
  );

  // 立即生效（发布器读取内存中的 accessToken）
  config.platforms.douyin.accessToken = token.access_token;
  // 重启后依然有效
  await persistEnv('DOUYIN_ACCESS_TOKEN', token.access_token);

  logger.info('抖音来客 OAuth 授权完成', { openId, accountName });
  return { account, token };
}

/**
 * 刷新并落库（供定时任务/手动触发）
 */
export async function refreshAndStore(refreshTokenValue) {
  const t = await refreshToken(refreshTokenValue);
  const account = await PlatformAccount.findOneAndUpdate(
    { platform: 'douyin', refreshToken: refreshTokenValue },
    {
      accessToken: t.access_token,
      refreshToken: t.refresh_token || refreshTokenValue,
      tokenExpiresAt: new Date(Date.now() + (t.expires_in || 1296000) * 1000),
      status: 'active',
    },
    { new: true }
  );
  config.platforms.douyin.accessToken = t.access_token;
  await persistEnv('DOUYIN_ACCESS_TOKEN', t.access_token);
  return account;
}

/**
 * 把键值写回 .env（仅更新指定 key，不动其他密钥）
 */
async function persistEnv(key, value) {
  try {
    if (!fs.existsSync(ENV_PATH)) return;
    let txt = fs.readFileSync(ENV_PATH, 'utf8');
    const re = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    if (re.test(txt)) txt = txt.replace(re, line);
    else txt += `\n${line}\n`;
    fs.writeFileSync(ENV_PATH, txt);
    logger.info('抖音 access_token 已持久化到 .env');
  } catch (e) {
    logger.warn('持久化 .env 失败（不影响本次运行）', { error: e.message });
  }
}

export default {
  buildAuthUrl,
  exchangeCode,
  getAccountInfo,
  refreshToken,
  completeAuth,
  refreshAndStore,
};
