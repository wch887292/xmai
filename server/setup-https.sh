#!/usr/bin/env bash
# =============================================================
# 为星眠AI 后端配置 HTTPS（Let's Encrypt 免费证书，certbot 自动签发+续期）
# 前置：deploy-cvm.sh 已运行；域名已解析到本服务器公网 IP。
# 用法：DOMAIN=sleep.example.com bash setup-https.sh
# =============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-}"
if [ -z "$DOMAIN" ]; then
  echo "用法：DOMAIN=你的域名 bash setup-https.sh" >&2
  exit 1
fi
PORT="${PORT:-3000}"
NGINX_CONF="/etc/nginx/conf.d/xingmian.conf"

echo "==> 安装 certbot ..."
if command -v apt-get >/dev/null 2>&1; then
  apt-get update && apt-get install -y certbot python3-certbot-nginx
else
  yum install -y certbot python3-certbot-nginx
fi

echo "==> 用 certbot 为 $DOMAIN 签发证书并自动改写 Nginx 配置 ..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@"$DOMAIN" --redirect

# 若 certbot 未自动改写，则手动补一段 443 配置
if ! grep -q "listen 443 ssl" "$NGINX_CONF"; then
cat >> "$NGINX_CONF" <<EOF

server {
    listen 443 ssl;
    server_name $DOMAIN;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
nginx -t && systemctl reload nginx
fi

echo "✅ HTTPS 已启用：https://$DOMAIN"
echo "证书 90 天有效期，certbot 已自动配置续期任务。"
