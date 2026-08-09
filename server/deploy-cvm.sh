#!/usr/bin/env bash
# =============================================================
# 星眠AI 后端 — 腾讯云服务器（CVM / 轻量应用服务器）一键初始化脚本
# 适用系统：Ubuntu 20.04+ / Debian 11+ / CentOS 7+（root 权限）
#
# 该脚本会：安装 Node.js 18 LTS → 安装 PM2 → 安装 Nginx →
#           配置反向代理 → 配置 systemd/PM2 开机自启 → 放通防火墙。
#
# 用法：
#   1) 先把本 server/ 目录上传到服务器，例如 /opt/xingmian-server
#   2) 填写环境变量：cp .env.example .env  然后编辑 .env 填入 WECHAT_SECRET
#   3) 以 root 运行：bash deploy-cvm.sh
#
# 注意：脚本不改业务代码，只装依赖与运维组件。域名/HTTPS 见下方说明。
# =============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/xingmian-server}"
PORT="${PORT:-3000}"
APP_USER="${APP_USER:-xingmian}"

echo "==> 部署目录: $APP_DIR"
if [ ! -d "$APP_DIR" ]; then
  echo "错误：目录 $APP_DIR 不存在。请先把 server/ 上传到该目录，或设置 APP_DIR 环境变量。" >&2
  exit 1
fi
cd "$APP_DIR"

# ---- 0. 检测包管理器 ----
if command -v apt-get >/dev/null 2>&1; then PM=apt; elif command -v yum >/dev/null 2>&1; then PM=yum; else echo "不支持的系统" >&2; exit 1; fi
echo "==> 包管理器: $PM"

# ---- 1. 安装 Node.js 18 LTS（NodeSource）----
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
  echo "==> 安装 Node.js 18 LTS ..."
  if [ "$PM" = "apt" ]; then
    apt-get update
    apt-get install -y curl ca-certificates gnupg
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
  else
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
  fi
fi
echo "==> Node: $(node -v), npm: $(npm -v)"

# ---- 2. 安装 PM2 ----
echo "==> 安装 PM2 ..."
npm install -g pm2

# ---- 3. 安装依赖 ----
echo "==> 安装后端依赖 ..."
npm install --omit=dev

# ---- 4. 校验 .env ----
if [ ! -f .env ]; then
  echo "==> 未找到 .env，已从模板复制，请务必编辑填入 WECHAT_SECRET（以及真实 WECHAT_APPID）。"
  cp .env.example .env
fi
if grep -q "在此填入你的小程序密钥" .env 2>/dev/null || grep -q "本地测试占位" .env 2>/dev/null; then
  echo "⚠️  警告：.env 中的 WECHAT_SECRET 仍是占位值。请编辑 .env 填入真实密钥，否则真实手机号登录会失败。"
fi
# 生产必须关闭 DEV_MODE
if grep -q "^DEV_MODE=true" .env; then
  sed -i 's/^DEV_MODE=true/DEV_MODE=false/' .env
  echo "==> 已将 DEV_MODE 强制改为 false（生产安全）。"
fi

# ---- 5. 创建运行用户并赋权 ----
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd -r -s /usr/sbin/nologin "$APP_USER" || useradd -r -s /sbin/nologin "$APP_USER"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ---- 6. 用 PM2 启动并设为开机自启 ----
echo "==> PM2 启动服务 ..."
pm2 delete xingmian-server 2>/dev/null || true
pm2 start server.js --name xingmian-server --env production
pm2 save
pm2 startup | tail -n 3

# ---- 7. 安装并配置 Nginx 反向代理 ----
echo "==> 安装 Nginx ..."
if [ "$PM" = "apt" ]; then apt-get install -y nginx; else yum install -y nginx; fi

NGINX_CONF="/etc/nginx/conf.d/xingmian.conf"
echo "==> 写入 Nginx 配置: $NGINX_CONF"
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name _;   # 部署后改成你的域名，如 sleep.example.com

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

nginx -t && (systemctl enable nginx && systemctl restart nginx)
echo "==> Nginx 已启动（HTTP 80 → 本机 ${PORT}）"

# ---- 8. 放通防火墙 ----
echo "==> 配置防火墙（80/443）..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; ufw --force enable || true
elif command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http; firewall-cmd --permanent --add-service=https; firewall-cmd --reload
fi

echo ""
echo "============================================================"
echo "✅ 初始化完成！当前已通过 HTTP 对外提供服务。"
echo ""
echo "下一步（非常重要）："
echo "  1) 在微信公众平台 → 开发设置 → 服务器域名 → request 合法域名"
echo "     增加你的后端 HTTPS 地址（见下方 HTTPS 说明）。"
echo "  2) 把前端 config/compliance.js 的 BACKEND_SYNC.enabled 改为 true，"
echo "     apiBase 改为 https://你的域名 ，小程序即可连回后端。"
echo ""
echo "HTTPS（二选一）："
echo "  A) 免费证书：bash setup-https.sh   # 用 Let's Encrypt 自动签发"
echo "  B) 腾讯云 SSL：在控制台下载 Nginx 证书，替换 $NGINX_CONF 中的证书路径并监听 443。"
echo "============================================================"
