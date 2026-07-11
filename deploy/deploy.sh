#!/bin/bash
# =============================================================
# 中芳堂美业全域AI智能体系统 - 一键部署脚本
# =============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

# 检查前置条件
check_prerequisites() {
  log_step "检查前置条件..."

  command -v node &>/dev/null || { log_error "请安装 Node.js 18+"; exit 1; }
  command -v npm  &>/dev/null || { log_error "请安装 npm"; exit 1; }
  command -v mongod &>/dev/null || log_warn "MongoDB 未安装，请确保远程数据库可用"

  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "需要 Node.js 18+，当前版本: $(node -v)"
    exit 1
  fi

  log_info "前置条件检查通过"
}

# 安装依赖
install_dependencies() {
  log_step "安装后端依赖..."
  cd "$PROJECT_DIR/server"
  npm install --production
  log_info "后端依赖安装完成"
}

# 配置环境变量
setup_env() {
  log_step "配置环境变量..."
  if [ ! -f "$PROJECT_DIR/server/.env" ]; then
    cp "$PROJECT_DIR/server/.env.example" "$PROJECT_DIR/server/.env"
    log_warn "已创建 .env 文件，请编辑填入真实配置"
    log_warn "文件位置: $PROJECT_DIR/server/.env"
  else
    log_info ".env 文件已存在，跳过"
  fi
}

# 初始化数据库
init_database() {
  log_step "初始化数据库..."
  if command -v mongosh &>/dev/null; then
    mongosh --eval "
      use zhongfangtang;
      db.createCollection('contents');
      db.createCollection('publish_records');
      db.createCollection('interception_leads');
      db.createCollection('customers');
      db.createCollection('orders');
      db.createCollection('analytics_daily');
      db.createCollection('sync_logs');
      db.createCollection('platform_accounts');
      print('数据库初始化完成');
    " 2>/dev/null || log_warn "数据库初始化失败，请手动执行"
  else
    log_warn "mongosh 未安装，请手动创建数据库和集合"
  fi
}

# 启动服务
start_service() {
  log_step "启动服务..."
  cd "$PROJECT_DIR/server"

  if command -v pm2 &>/dev/null; then
    pm2 start src/index.js --name zhongfangtang-ai --time
    pm2 save
    log_info "服务已通过 PM2 启动"
  else
    log_warn "PM2 未安装，使用 nohup 启动"
    nohup node src/index.js > /var/log/zhongfangtang-ai.log 2>&1 &
    log_info "服务已通过 nohup 启动 (PID: $!)"
  fi
}

# 部署 BI Dashboard
deploy_dashboard() {
  log_step "部署 BI 数据中台..."
  DASHBOARD_DIR="$PROJECT_DIR/dashboard"
  WEB_DIR="/var/www/zhongfangtang-dashboard"

  if [ -d /var/www ]; then
    mkdir -p "$WEB_DIR"
    cp -r "$DASHBOARD_DIR"/* "$WEB_DIR/"
    log_info "BI Dashboard 已部署到 $WEB_DIR"
    log_info "请配置 Nginx 反向代理指向该目录"
  else
    log_warn "/var/www 不存在，Dashboard 文件位于: $DASHBOARD_DIR"
  fi
}

# 显示部署信息
show_info() {
  echo ""
  echo "============================================"
  echo "  中芳堂美业全域AI智能体系统"
  echo "  部署完成"
  echo "============================================"
  echo ""
  echo "  后端服务:  http://localhost:3001"
  echo "  健康检查:  http://localhost:3001/health"
  echo "  API 前缀:  http://localhost:3001/api/v1"
  echo "  WebSocket: ws://localhost:3001/ws"
  echo "  BI 中台:   打开 dashboard/index.html"
  echo ""
  echo "  配置文件:  server/.env"
  echo "  日志目录:  server/logs/"
  echo ""
  echo "  下一步:"
  echo "  1. 编辑 server/.env 填入各平台 API 密钥"
  echo "  2. 配置 Nginx 反向代理 (参考 deploy/nginx.conf)"
  echo "  3. 设置 PM2 开机自启: pm2 startup"
  echo "============================================"
}

# 主流程
main() {
  echo ""
  echo "============================================"
  echo "  中芳堂美业全域AI智能体系统"
  echo "  一键部署脚本"
  echo "============================================"
  echo ""

  check_prerequisites
  install_dependencies
  setup_env
  init_database

  # 询问是否启动
  read -rp "是否立即启动服务? (y/N): " START_NOW
  if [ "${START_NOW,,}" = "y" ]; then
    start_service
    deploy_dashboard
    show_info
  else
    log_info "部署准备完成，可手动执行: cd server && node src/index.js"
    log_info "或使用: pm2 start server/src/index.js --name zhongfangtang-ai"
  fi
}

main "$@"
