# 星眠AI 后端 — 部署到腾讯云服务器（CVM / 轻量应用服务器）

本文档面向「腾讯云服务器」（云服务器 CVM 或轻量应用服务器），把已开发好的 Node 后端跑起来，
随后让微信小程序前端连回它。**前端当前处于「本地模式」（不连后端），部署完成后只需改一个开关即可连回。**

---

## 一、准备

1. 在腾讯云购买并初始化一台 Linux 服务器（Ubuntu 22.04 / Debian 12 推荐，2C2G 起）。
2. 在**微信公众平台 → 开发 → 开发设置 → 服务器域名 → request 合法域名** 预留一个 HTTPS 域名
   （如 `https://sleep.yourdomain.com`）。需先备好域名并完成 ICP 备案（国内服务器必须）。
3. 把本 `server/` 目录上传到服务器，例如 `/opt/xingmian-server`
   （用 `scp -r server/ root@<公网IP>:/opt/xingmian-server`，或用 Git 拉取）。

---

## 二、一键初始化（推荐）

```bash
# 1) 进入上传后的目录
ssh root@<公网IP>
cd /opt/xingmian-server

# 2) 填好生产环境变量（务必替换 WECHAT_SECRET 为真实小程序密钥）
cp .env.example .env
vi .env            # 把 WECHAT_SECRET 改成真实值，DEV_MODE 保持 false

# 3) 一键安装 Node/PM2/Nginx + 反向代理 + 开机自启 + 放通防火墙
bash deploy-cvm.sh
```

脚本会：
- 安装 Node.js 18 LTS、PM2、Nginx；
- `npm install --omit=dev` 装生产依赖；
- 用 PM2 启动 `server.js` 并设为开机自启；
- 写入 Nginx 反向代理（80 → 127.0.0.1:3000）并放通 80/443 防火墙。

启动后可用 `pm2 logs xingmian-server` 看日志，`pm2 restart xingmian-server` 重启。

---

## 三、开启 HTTPS（必做，否则 request 合法域名过不了）

```bash
# Let's Encrypt 免费证书（需域名已解析到本机）
DOMAIN=sleep.yourdomain.com bash setup-https.sh
```

或走**腾讯云 SSL**：在控制台申请/上传证书，下载 Nginx 版，把证书文件放到服务器，
修改 `/etc/nginx/conf.d/xingmian.conf` 增加 `listen 443 ssl` 与证书路径，`nginx -t && systemctl reload nginx`。

---

## 四、让小程序连回后端（关键一步）

后端就绪并拿到 HTTPS 域名后，在**小程序工程**里改一个文件即可：

`config/compliance.js`
```js
BACKEND_SYNC: {
  enabled: true,                                              // 由 false 改为 true
  apiBase: 'https://sleep.yourdomain.com',                    // 改成你的真实域名
  ...
}
```

然后：
1. 微信公众平台 → 开发设置 → **服务器域名 → request 合法域名** 增加 `https://sleep.yourdomain.com`。
2. 微信开发者工具「清缓存 → 重新编译」，用真机预览登录 → 自动走 `getPhoneNumber` 真登录 + 云端同步。

> 前端所有登录/同步代码已按该开关分支，**无需改动业务代码**。

---

## 五、本地先验证（开发机，不依赖云）

```bash
cd server
cp .env.example .env      # DEV_MODE=true（已默认），用 devPhone 旁路登录
npm install
npm run dev              # 监听 3000
# 另一个终端：
curl -X POST localhost:3000/api/auth/phone-login -H 'Content-Type: application/json' -d '{"devPhone":"13800001234"}'
# 拿到 token 后带 Authorization: Bearer <token> 测试 /api/sync 的 pull/push
```

---

## 六、备选：用 Docker 跑（若你更习惯容器）

本目录已含 `Dockerfile`（原用于 CloudBase 云托管，同样适用于 CVM 上的 Docker）：
```bash
docker build -t xingmian-server .
docker run -d --name xm -p 3000:3000 \
  -e WECHAT_APPID=wx0000000000000000 \   # 占位示例：替换为你自己的 AppID
  -e WECHAT_SECRET=<真实密钥> \
  -e DEV_MODE=false \
  -v xm-data:/app/data \
  xingmian-server
# 前面再套一层 Nginx（同第二节）即可
```

---

## 七、运维与安全提醒

- **WECHAT_SECRET 仅存在于服务端环境变量 / .env，绝不进前端或仓库**（`.env` 已在 .gitignore）。
- **DEV_MODE 生产必须 false**，否则任何人可用任意手机号伪造登录。
- 当前用 `data/` 目录下的 JSON 文件存储，适合 MVP；多实例或正式商用请挂载持久卷，
  并迁移到云数据库（如 TencentDB MySQL/PostgreSQL）避免数据不一致。
- 手机号/睡眠数据属《个人信息保护法》敏感信息，正式商用前需落实访问控制、日志脱敏与等保要求。
- 微信 `getPhoneNumber` 返回的手机号需服务端用 AppSecret 换，确保 AppSecret 安全。
- 监控：`pm2 monit`；日志轮转可接 `pm2-logrotate`。
