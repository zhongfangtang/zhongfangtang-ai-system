#!/usr/bin/env bash
# =============================================================
# 中芳堂美业全域AI智能体系统 · 一键启动脚本
# =============================================================
#
# 用法：
#   ./scripts/start.sh                 # 本地模式启动（Node 直跑，依赖本地 Mongo/Redis）
#   ./scripts/start.sh --docker        # Docker Compose 模式（自动拉起 Mongo/Redis/API/Dashboard）
#   ./scripts/start.sh stop            # 停止服务
#   ./scripts/start.sh restart         # 重启
#   ./scripts/start.sh status          # 查看运行状态
#   ./scripts/start.sh logs            # 查看日志（本地模式 tail -f）
#   ./scripts/start.sh health          # 健康检查
#
# 前置：
#   本地模式：Node.js 18+ 且本地已运行 MongoDB / Redis（或用 Docker 仅跑这两个）
#   Docker 模式：已安装 docker + docker compose
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_DIR/server"
ENV_FILE="$SERVER_DIR/.env"
COMPOSE_FILE="$PROJECT_DIR/deploy/docker-compose.yml"

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $*"; }

MODE="local"
[[ "${1:-}" == "--docker" ]] && MODE="docker"
ACTION="${1:-start}"

# -------- 依赖检测 --------
check_node() {
  if ! command -v node &>/dev/null; then
    log_error "未检测到 Node.js，请先安装 18+：https://nodejs.org"
    exit 1
  fi
  local NV
  NV=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NV" -lt 18 ]; then
    log_error "Node.js 版本过低（当前 $(node -v)），需 18+"
    exit 1
  fi
  log_info "Node.js $(node -v) 检测通过"
}

check_docker() {
  if ! command -v docker &>/dev/null; then
    log_error "未检测到 docker，请先安装：https://docs.docker.com/get-docker/"
    exit 1
  fi
  if ! docker compose version &>/dev/null 2>&1 && ! docker-compose version &>/dev/null 2>&1; then
    log_error "未检测到 docker compose 插件"
    exit 1
  fi
  log_info "Docker / Compose 检测通过"
}

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    log_warn "未找到 server/.env，已从 .env.example 复制（请按需替换🔴必填项）"
    cp "$SERVER_DIR/.env.example" "$ENV_FILE"
  else
    log_info "server/.env 已存在，跳过"
  fi
}

install_deps() {
  if [ ! -d "$SERVER_DIR/node_modules" ] || [ ! -f "$SERVER_DIR/node_modules/.package-lock.json" ]; then
    log_step "安装后端依赖（首次较慢）..."
    (cd "$SERVER_DIR" && npm install --production)
  else
    log_info "依赖已就绪（node_modules 存在）"
  fi
}

health_check() {
  local url="http://localhost:${PORT:-3001}/health"
  log_step "健康检查：$url"
  for i in $(seq 1 20); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log_info "✅ 服务已就绪"
      curl -fsS "$url"
      echo
      return 0
    fi
    sleep 1
  done
  log_error "❌ 健康检查失败（20s 内无响应），请查看日志排查"
  return 1
}

# -------- 本地模式 --------
local_start() {
  check_node
  ensure_env
  # 读取 PORT
  PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d '"' || true)
  PORT="${PORT:-3001}"
  install_deps
  log_step "以本地模式启动服务 (PORT=$PORT) ..."
  if command -v pm2 &>/dev/null; then
    pm2 delete zhongfangtang-ai >/dev/null 2>&1 || true
    pm2 start "$SERVER_DIR/src/index.js" --name zhongfangtang-ai --time
    pm2 save >/dev/null 2>&1 || true
    log_info "已通过 PM2 启动"
  else
    log_warn "未安装 PM2，使用 nohup 后台启动"
    nohup node "$SERVER_DIR/src/index.js" > "$SERVER_DIR/logs/app.log" 2>&1 &
    echo $! > "$SERVER_DIR/logs/app.pid"
    log_info "已启动 (PID $(cat "$SERVER_DIR/logs/app.pid"))"
  fi
  health_check
}

local_stop() {
  if command -v pm2 &>/dev/null; then
    pm2 delete zhongfangtang-ai >/dev/null 2>&1 || true
    log_info "已停止（PM2）"
  elif [ -f "$SERVER_DIR/logs/app.pid" ]; then
    kill "$(cat "$SERVER_DIR/logs/app.pid")" 2>/dev/null || true
    rm -f "$SERVER_DIR/logs/app.pid"
    log_info "已停止（PID）"
  else
    pkill -f "node $SERVER_DIR/src/index.js" 2>/dev/null || true
    log_info "已尝试停止相关进程"
  fi
}

local_status() {
  if command -v pm2 &>/dev/null; then
    pm2 list | grep -i zhongfangtang || log_warn "未运行"
  else
    pgrep -af "node $SERVER_DIR/src/index.js" || log_warn "未运行"
  fi
}

local_logs() {
  if command -v pm2 &>/dev/null; then
    pm2 logs zhongfangtang-ai
  else
    tail -f "$SERVER_DIR/logs/app.log"
  fi
}

# -------- Docker 模式 --------
docker_up() {
  check_docker
  ensure_env
  log_step "以 Docker Compose 模式启动（api + mongo + redis + dashboard + worker）..."
  docker compose -f "$COMPOSE_FILE" up -d --build
  PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d '"' || true)
  PORT="${PORT:-3001}"
  health_check
}

docker_down() {
  check_docker
  log_step "停止并移除容器（保留数据卷）..."
  docker compose -f "$COMPOSE_FILE" down
}

docker_logs() {
  check_docker
  docker compose -f "$COMPOSE_FILE" logs -f api
}

docker_status() {
  check_docker
  docker compose -f "$COMPOSE_FILE" ps
}

# -------- 主分发 --------
main() {
  case "$MODE" in
    docker)
      case "$ACTION" in
        start)   docker_up ;;
        stop)    docker_down ;;
        restart) docker_down; docker_up ;;
        status)  docker_status ;;
        logs)    docker_logs ;;
        health)  health_check ;;
        *) log_error "未知动作：$ACTION"; exit 1 ;;
      esac
      ;;
    local)
      case "$ACTION" in
        start)   local_start ;;
        stop)    local_stop ;;
        restart) local_stop; sleep 1; local_start ;;
        status)  local_status ;;
        logs)    local_logs ;;
        health)  health_check ;;
        *) log_error "未知动作：$ACTION"; exit 1 ;;
      esac
      ;;
  esac
}

main "$@"
