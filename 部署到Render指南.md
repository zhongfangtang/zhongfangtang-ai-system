# 中芳堂后端 · 部署到 Render（免费 PaaS）指南

> 目标：把后端公开部署，使 BI 看板从「真实数据快照」切换为**实时数据**。
> 域名策略：后端跑在 Render 免费档（自动给子域名），再把你已有的 `zft.51gaozhan.com` 用 CNAME 指过来 → 免费托管 + 自有域名。

---

## 一、前置准备（约 15 分钟，均免费）

| 项目 | 去哪弄 | 得到什么 |
|------|--------|----------|
| ① GitHub 仓库 | 你已有 | 推代码用（本机 `gh` 未登录，需你推） |
| ② MongoDB Atlas | https://cloud.mongodb.com → 建 M0 免费集群 | `MONGODB_URI` 连接串 |
| ③ Upstash Redis | https://upstash.com → 建免费 Redis | `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` |

---

## 二、部署步骤

### 步骤 1：推代码到 GitHub
本机已 `git init` 并提交，但 `gh` 未登录，由你执行推送：
```bash
cd zhongfangtang-ai-system
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```
（如尚未提交，本机已备好部署相关改动：CORS 可配置、render.yaml、.env.example 已更新）

### 步骤 2：Render 一键部署
1. 登录 https://render.com → **New** → **Blueprint**
2. 连接你的 GitHub 仓库，选中本仓库
3. Render 读取根目录 `render.yaml`，自动创建 `zhongfangtang-api` 服务（plan: free）
4. 点击 **Deploy**

### 步骤 3：填环境变量（🔴 必填）
在 Render 服务 → **Environment** 中，给以下 `sync: false` 的变量填值：
- `MONGODB_URI` ← ② 的 Atlas 连接串
- `REDIS_HOST` / `REDIS_PASSWORD` ← ③ 的 Upstash 值（`REDIS_PORT` 默认 6379）
- `JWT_SECRET` ← 任意随机长字符串（如 `openssl rand -hex 32`）
- `AI_MODEL_API_KEY` ← 硅基流动/DeepSeek 密钥（无则 AI 功能不可用，但系统照常启动）
- 6 组平台密钥、企微、小程序：按需填，不填走人工复核队列

### 步骤 4：绑定自定义域名 zft.51gaozhan.com（可选但推荐）
1. Render 服务 → **Settings** → **Custom Domains** → 添加 `zft.51gaozhan.com`
2. Render 给出目标（形如 `srv-xxx.onrender.com` 或 CNAME 目标）
3. 登录你的 **51gaozhan.com** 域名控制台，给 `zft` 子域加一条 **CNAME** 记录，指向该目标
4. 等待 DNS 生效 + Render 自动签发 HTTPS（Let's Encrypt）
> ⚠️ 当前 `zft.51gaozhan.com` 已在 HTTP 200 提供服务，改 CNAME 会把它指向本后端 API（覆盖原内容）。若想保留原内容，改用新子域如 `api.51gaozhan.com` 即可。

### 步骤 5：通知我接看板
后端上线后，把地址（Render 子域名 或 `zft.51gaozhan.com`）发我：
- 我把 BI 看板的 `apiBase` 改成该地址并重新部署
- 看板即从「快照」切为**实时**拉取真实后端数据

---

## 三、成本

| 项目 | 费用 |
|------|------|
| Render web 免费档 | ¥0（闲置会冷启动，预览足够） |
| MongoDB Atlas M0 | ¥0 |
| Upstash Redis | ¥0 |
| 域名 zft.51gaozhan.com | 你已持有，¥0 新增 |
| **合计** | **¥0** |

---

## 四、备选：Railway
若偏好 Railway：把仓库连到 https://railway.app → 用 `railway.json` 或直接在 Service 里设 `buildCommand: npm install` / `startCommand: node src/index.js`，环境变量同 render.yaml。Railway 也提供免费 Redis 插件，可直接用。
