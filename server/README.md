# 星眠AI 后端服务（server/）

自建 Node + Express 后端，零原生依赖（JSON 文件存储），适配 **CloudBase 云托管** 一键容器部署，
也可部署到 **腾讯云服务器（CVM / 轻量应用服务器）**（见 [DEPLOY-CVM.md](./DEPLOY-CVM.md)）。

> **当前前端状态**：小程序 `config/compliance.js` 中 `BACKEND_SYNC.enabled = false`（本地模式），
> 前端暂不连接后端、数据仅存本机。后端已就绪，部署到腾讯云并把该开关改为 `true` + 填 `apiBase` 即连回。

## 功能
1. **微信手机号一键登录** `POST /api/auth/phone-login`
   - 小程序 `getPhoneNumber` 拿到 `code` → 服务端用 `AppSecret` 换手机号 → 生成 `token` 返回。
   - `AppSecret` 仅存服务端环境变量，绝不进前端代码或仓库。
2. **睡眠数据同步** `GET/POST /api/sync`
   - 按 `Bearer token` 隔离用户，整体读写 `sleep_records / routine_config / routine_checkins`。

## 目录结构
```
server/
├── server.js              # 入口（Express，端口可配）
├── package.json
├── Dockerfile             # 云托管构建用
├── .env.example           # 环境变量模板（复制为 .env 后填写）
├── .dockerignore
└── src/
    ├── config.js          # 读取环境变量（含极简 .env 加载）
    ├── store.js           # 用户 JSON 存储（无数据库依赖）
    ├── wechat.js          # access_token 缓存 + getuserphonenumber 解密
    ├── middleware.js      # Bearer token 校验
    └── routes/
        ├── auth.js        # 手机号登录
        └── sync.js        # 数据同步
```

## 本地运行（开发用）
```bash
cd server
npm install
# 复制并填写环境变量（DEV_MODE=true 可绕过微信直接登录测试）
cp .env.example .env
npm run dev          # DEV_MODE=true，可用 {"devPhone":"13800001234"} 直接登录
# 或
node server.js      # 生产模式（DEV_MODE=false）
```
健康检查：`GET http://localhost:3000/`

## 部署到 CloudBase 云托管
1. 腾讯云控制台开通「云开发 / 云托管」，创建环境。
2. 安装并登录 CloudBase CLI：
   ```bash
   npm i -g @cloudbase/cli
   tcb login        # 浏览器扫码授权
   ```
3. 在控制台「云托管 → 新建服务」，服务类型选 **Web 服务**，监听端口填 `3000`，上传本 `server/` 目录（已含 Dockerfile，平台会自动构建镜像）。
4. 在服务「环境变量」中配置（**不要写进代码**）：
   - `WECHAT_APPID` = `你的小程序AppID`（形如 `wx` 开头的一串字符，勿提交真实值）
   - `WECHAT_SECRET` = 你的小程序密钥（建议先在微信后台重置一个全新值）
   - `DEV_MODE` = `false`（务必关闭，否则任何人可伪造登录）
   - `DATA_DIR` = `/app/data`，并为该目录**挂载持久化存储卷**（保证数据不随实例回收丢失；生产建议改用云数据库）。
5. 部署完成后获得服务域名（HTTPS），将其填入小程序 `config/compliance.js` 的 `BACKEND_SYNC.apiBase`。
6. 微信公众平台 → 开发 → 开发设置 → **服务器域名** → `request 合法域名` 增加该 HTTPS 域名。

## 小程序前端配置
- 前端连接后端的总开关是 `config/compliance.js` 里的 `BACKEND_SYNC.enabled`：
  - `false`（当前）= 本地模式，前端不发起任何网络请求，数据仅存本机（登录降级为「本地模式」）。
  - `true` = 连接后端，需同时把 `apiBase` 改成真实 HTTPS 域名。
- 登录页用 `button open-type="getPhoneNumber"` 调起微信授权；登录后自动 `pull` 云端数据，首页「云端同步」条可手动备份/恢复。
- 切换回后端只需改 `enabled` + `apiBase` 两个字段，业务代码无需改动。

## 部署到腾讯云服务器（CVM / 轻量应用服务器）
另见 **[DEPLOY-CVM.md](./DEPLOY-CVM.md)**，含一键脚本 `deploy-cvm.sh`（装 Node/PM2/Nginx + 反向代理 + 开机自启 + 防火墙）与 HTTPS 脚本 `setup-https.sh`。
简要步骤：
1. 把本 `server/` 上传到服务器 `/opt/xingmian-server`，`cp .env.example .env` 并填好 `WECHAT_SECRET`、`DEV_MODE=false`。
2. `bash deploy-cvm.sh` 一键初始化；`DOMAIN=你的域名 bash setup-https.sh` 开 HTTPS。
3. 前端 `BACKEND_SYNC.enabled = true` + `apiBase = https://你的域名`，并在微信后台把该域名加入 request 合法域名。

## 接口说明
| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/auth/phone-login` | body `{code}` 或开发期 `{devPhone}` | 否 |
| GET  | `/api/sync` | 拉取当前用户同步数据 | Bearer token |
| POST | `/api/sync` | body `{sync:{sleep_records,routine_config,routine_checkins}}` 覆盖写 | Bearer token |

## 安全与合规提示
- `AppSecret` 属敏感凭据，仅服务端环境变量，已泄露的旧值请去微信后台重置。
- `DEV_MODE=true` 仅用于本地测试，生产部署**必须 false**。
- 当前用本地 JSON 文件存储，适合 MVP；多实例部署请挂载持久卷或迁移到云数据库，避免数据不一致。
- 手机号/睡眠数据属《个保法》敏感个人信息，服务端需落实访问控制、日志脱敏与等保要求后再正式商用。
