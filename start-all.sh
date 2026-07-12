#!/usr/bin/env bash
# 中芳堂 AI 系统 · 一键启动（容器 + 后端 + 公网隧道）
# 用途：沙箱休眠恢复后，一条命令拉起整套服务并输出可访问地址。
# 用法：bash start-all.sh
set -u
PROJ=/workspace/zhongfangtang-ai-system
SERVER=$PROJ/server
LOG=/tmp
CLOUDFLARED=$(command -v cloudflared 2>/dev/null || true)
[ -z "$CLOUDFLARED" ] && [ -x /tmp/cloudflared ] && CLOUDFLARED=/tmp/cloudflared
[ -z "$CLOUDFLARED" ] && CLOUDFLARED=$(find / -name cloudflared -type f 2>/dev/null | head -1)
[ -z "$CLOUDFLARED" ] && { echo "未找到 cloudflared，请先安装/放置到 /tmp/cloudflared"; exit 1; }

echo "==> [1/4] 启动 MongoDB + Redis 容器"
docker start zft-mongo zft-redis >/dev/null 2>&1 || true
for i in $(seq 1 30); do
  docker exec zft-mongo mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1 && break
  sleep 1
done
echo "    mongo/redis 就绪"

echo "==> [2/4] 启动后端 (node src/index.js)"
pkill -f "node src/index.js" 2>/dev/null || true
sleep 1
cd "$SERVER"
nohup node src/index.js >"$LOG/backend.log" 2>&1 &
for i in $(seq 1 30); do
  curl -s -m 2 http://localhost:3001/health >/dev/null 2>&1 && break
  sleep 1
done
echo "    后端 /health: $(curl -s -m 3 http://localhost:3001/health | head -c 140)"

echo "==> [3/4] 启动 Cloudflare 免费隧道 (免注册)"
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1
nohup "$CLOUDFLARED" tunnel --url http://localhost:3001 --no-autoupdate >"$LOG/tunnel.log" 2>&1 &
TUNNEL=""
for i in $(seq 1 40); do
  TUNNEL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG/tunnel.log" | head -1)
  [ -n "$TUNNEL" ] && break
  sleep 1
done
echo "$TUNNEL" >"$LOG/tunnel_url.txt"
echo "    隧道地址: ${TUNNEL:-获取失败，见 $LOG/tunnel.log}"

echo "==> [4/4] 完成 ✅"
echo "运营后台: ${TUNNEL}/console   (登录 admin / admin123)"
echo "BI 看板:   ${TUNNEL}/dashboard"
echo "统一门户:  ${TUNNEL}/portal"
