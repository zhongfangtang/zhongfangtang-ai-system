# 中芳堂AI智能体 · 6平台API密钥配置指南

## 一、蚁小二（多平台一键分发）

蚁小二是第三方多平台分发工具，不需要API密钥对接。
系统已预留"蚁小二分发"模式：在运营后台 → 发布管理 → 选择内容 → 通过蚁小二分发。

对接方式：手动在蚁小二后台创建发布任务，系统生成的内容复制粘贴即可。

---

## 二、抖音来客（屈氏美容美体服务部）

**获取步骤：**
1. 打开 https://open.douyin.com（抖音开放平台）
2. 登录你的抖音来客账号
3. 进入「控制台」→「我的应用」→ 创建应用
4. 获取 AppID 和 AppSecret
5. 配置到 .env 文件：
```
DOUYIN_APP_ID=你的AppID
DOUYIN_APP_SECRET=你的AppSecret
```

---

## 三、小红书个人号

**获取步骤：**
1. 打开 https://open.xiaohongshu.com（小红书开放平台）
2. 登录你的小红书账号
3. 进入「开发者中心」→ 创建应用
4. 获取 AppID 和 AppSecret
5. 配置到 .env 文件：
```
XIAOHONGSHU_APP_ID=你的AppID
XIAOHONGSHU_APP_SECRET=你的AppSecret
```
> 注意：小红书个人号API权限有限，半自动模式即可

---

## 四、公众号服务号（已认证）

**获取步骤：**
1. 打开 https://mp.weixin.qq.com（微信公众平台）
2. 登录你的服务号
3. 「设置与开发」→「基本配置」→ 获取AppID和AppSecret
4. 配置到 .env 文件：
```
WEIXIN_APP_ID=你的AppID
WEIXIN_APP_SECRET=你的AppSecret
```

---

## 五、视频号（2个号）

视频号通过微信开放平台对接：
1. 打开 https://open.weixin.qq.com
2. 登录 → 「管理中心」→ 创建网站应用
3. 获取AppID和AppSecret
4. 配置同上WEIXIN_APP_ID/WEIXIN_APP_SECRET

视频号小店通过微信小商店API对接（另行配置）

---

## 六、快手个人号

**获取步骤：**
1. 打开 https://open.kuaishou.com
2. 注册开发者 → 创建应用
3. 获取AppID和AppSecret
4. 配置到 .env 文件：
```
KUAISHOU_APP_ID=你的AppID
KUAISHOU_APP_SECRET=你的AppSecret
```

---

## 七、B站个人号

B站通过SESSDATA Cookie对接：
1. 浏览器打开 https://member.bilibili.com
2. F12 → Application → Cookies → 找到 SESSDATA
3. 配置到 .env 文件：
```
BILIBILI_SESSDATA=你的SESSDATA
```

---

## 八、百家号

百家号通过Cookie对接：
1. 浏览器打开 https://baijiahao.baidu.com
2. F12 → Application → Cookies → 复制完整Cookie
3. 配置到 .env 文件：
```
BAIJIAHAO_COOKIE=你的完整Cookie字符串
```

---

## 配置后重启

所有密钥填入 `/workspace/zhongfangtang-ai-system/server/.env` 后：

```bash
fuser -k 3001/tcp
cd /workspace/zhongfangtang-ai-system/server
nohup node src/index.js > /tmp/zft-server.log 2>&1 &
```

---

## 当前状态：零密钥模式（已优雅降级）

✅ 无密钥时系统正常运作：
- 内容生成 → 保存到内容库
- 发布 → 进入审核队列（手动在蚁小二/各平台发布）
- 截流 → 手动录入模式
- 所有功能可用，只是发布环节需人工操作
