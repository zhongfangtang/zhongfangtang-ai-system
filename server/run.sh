#!/usr/bin/env bash
# 后端托管启动脚本（供 supervisord 调用）
# 作用：等待 MongoDB 端口就绪后再前台启动 node，避免沙箱休眠恢复后
#       后端先于数据库起来导致连接失败。exec 保证 node 成为被监管的进程。
set -u
MONGO_HOST="${MONGODB_HOST:-127.0.0.1}"
MONGO_PORT="${MONGODB_PORT:-27017}"
echo "[run.sh] 等待 MongoDB (${MONGO_HOST}:${MONGO_PORT}) 就绪..."
for i in $(seq 1 60); do
  if (exec 3<>/dev/tcp/${MONGO_HOST}/${MONGO_PORT}) 2>/dev/null; then
    exec 3>&- 2>/dev/null
    echo "[run.sh] MongoDB 已就绪，启动后端..."
    break
  fi
  sleep 1
done
exec node src/index.js
