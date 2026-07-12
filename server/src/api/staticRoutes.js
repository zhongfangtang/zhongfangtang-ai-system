/**
 * 静态页面路由（同源自托管）
 *
 * 运营后台 / BI 看板由后端同源提供，前端使用「相对地址」调用 API，
 * 因此无论 Cloudflare 隧道地址如何变化，页面都能自动连上后端，
 * 无需在页面里写死公网地址、也无需每次重启都重新部署。
 *
 * @module api/staticRoutes
 */
import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();
const ROOT = path.resolve(process.cwd(), '..'); // 项目根目录

// 运营后台（API_BASE 为空 → 相对地址，同源调用）
router.get('/console', (req, res) => {
  res.sendFile(path.join(ROOT, 'console', 'index.html'));
});

// 融合门户（同源提供，BI 用相对地址）
router.get('/portal', (req, res) => {
  const f = '/tmp/deploy/portal.html';
  if (fs.existsSync(f)) return res.sendFile(f);
  res.status(404).send('portal 未构建');
});

// BI 数据中台（baseURL 为空 → 相对地址，同源调用）
router.get('/dashboard', (req, res) => {
  const f = '/tmp/deploy/dashboard.html';
  if (fs.existsSync(f)) return res.sendFile(f);
  res.status(404).send('dashboard 未构建');
});

// 根路径重定向到运营后台
router.get('/', (req, res) => res.redirect('/console'));

export default router;
