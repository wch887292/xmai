# 星眠AI · 睡眠健康管理微信小程序

> 面向失眠 / 过劳人群的个人睡眠健康管家，配套企业端「倦怠雷达」与数据资产「能量驿站」，形成 **个人养数据 → 匿名聚合 → 企业出收入** 的产品矩阵。

![微信小程序](https://img.shields.io/badge/平台-微信小程序-07C160)

![后端](https://img.shields.io/badge/后端-Node%20%2B%20Express-339933)

![部署](https://img.shields.io/badge/部署-腾讯云%20CVM%20%2F%20CloudBase-blue)

![最后提交](https://img.shields.io/github/last-commit/wch887292/xmai)

![许可证](https://img.shields.io/badge/授权-商用%20请联合作者-orange)



---

## ✨ 项目亮点

- **四大睡眠核心模块**：睡眠记录、作息打卡、睡眠看板（手写图表趋势）、助眠计时器，覆盖「记录—节律—洞察—放松」闭环。
- **能量驿站（数据飞轮起点）**：把睡眠记录 / 打卡量化为「数据能量」与「数据资产」，让用户在无后端时也能感知自己在积累有价值的健康数据。
- **合规优先**：隐私授权弹窗、内容审核拦截（禁医疗断言）、用户协议 / 隐私政策全文，无资质即可合规上线。
- **可私有部署的后端**：零原生依赖的 Node + Express 服务（JSON 文件存储），自带腾讯云 CVM 一键部署脚本，数据握在自己手里。
- **本地模式 ↔ 真后端无缝切换**：前端按一个开关（`config/compliance.js`）即可在「纯本地」与「手机号真登录 + 云端同步」之间切换，业务代码不动。

## 📷 界面预览

| 首页 | 睡眠记录 | 能量驿站 |
| :---: | :---: | :---: |
| ![首页](./docs/screenshots/home.png) | ![睡眠记录](./docs/screenshots/record.png) | ![能量驿站](./docs/screenshots/energy.png) |
| **作息打卡** | **睡眠看板** | **助眠计时** |
| ![作息打卡](./docs/screenshots/routine.png) | ![睡眠看板](./docs/screenshots/dashboard.png) | ![助眠计时](./docs/screenshots/timer.png) |

---

## 🧩 产品矩阵

| 产品         | 定位                                        | 状态               |
| ---------- | ----------------------------------------- | ---------------- |
| ① **安心眠**  | 个人端睡眠健康管理（记录 / 打卡 / 看板 / 计时器），长期合规壁垒，单独推进 | ✅ MVP-1 已发布形态    |
| ② **倦怠雷达** | 企业端员工倦怠风险预警（问卷 + 热力图 + 预警闭环），出收入现金牛       | 🔜 需等保 + DPA 后立项 |
| ③ **能量驿站** | 个人端数据资产可视化（能量 / 等级 / 账本），养数据飞轮            | ✅ 已落地（本地模式）      |

**闭环逻辑**：个人养数据 → 匿名聚合 → 企业出收入 → 反哺个人 / 加固壁垒。

---

## 🛠 技术架构

```
┌─────────────────────┐         HTTPS / Bearer Token         ┌──────────────────────┐
│   微信小程序（前端）   │  ───────────────────────────────▶  │   Node + Express 后端  │
│  原生 WXML/WXSS/JS   │  ◀───────────────────────────────  │  JSON 文件存储         │
│  本地优先 / 可连后端   │        （本地模式时全程不联网）        │  腾讯云 CVM / CloudBase │
└─────────────────────┘                                     └──────────────────────┘
```

- **前端**：微信原生小程序（无框架，规避 SWC 转译坑），数据优先存本机 `wx.setStorageSync`。
- **后端**：`server/` 零原生依赖 Express，按手机号隔离存储，AppSecret 仅走环境变量。
- **部署**：前端走微信开发者工具上传；后端走 `server/deploy-cvm.sh` 一键部署到腾讯云。

---

## 🚀 快速开始

### 小程序前端（微信开发者工具）

1. 用微信开发者工具打开本仓库根目录。
2. 在 `project.config.json` 填入你的小程序 AppID（当前为 `wxe32f899ba0d86bf3`，请替换为你自己的）。
3. 编译预览即可运行；默认 **本地模式**，数据存本机。

### 后端（本地验证）

```bash
cd server
cp .env.example .env        # 本地测试可保持 DEV_MODE=true（允许 devPhone 旁路登录）
npm install
npm start                  # 默认 http://localhost:3000
# 健康检查：curl http://localhost:3000/
```

### 连回真后端（前端切换）

改 `config/compliance.js`：

```js
BACKEND_SYNC: { enabled: true, apiBase: 'https://你的域名' }
```

并在微信后台「服务器域名 → request 合法域名」加入该域名。

---

## 📁 目录结构

```
.
├── app.js / app.json / app.wxss      # 小程序入口与全局配置
├── pages/                           # 页面：index/record/routine/dashboard/timer/energy/ai/agreement/privacy/login
├── utils/                           # api.js（请求封装）/ audit.js（内容审核）/ energy.js（能量计算）
├── config/compliance.js             # 统一合规 / 功能开关（本地模式 ↔ 真后端 收口于此）
├── cloudfunctions/syncSleep/        # 云函数占位
├── server/                          # 后端：Express + JSON 存储 + 腾讯云 CVM 部署脚本
│   ├── server.js / src/             # 入口与路由 / 配置 / 存储 / 微信解密 / 中间件
│   ├── deploy-cvm.sh / setup-https.sh / DEPLOY-CVM.md
│   └── README.md
├── 一体化产品矩阵-产品开发与合规文档.md   # 战略 + 合规基线
└── 分阶段开发实施计划.md               # 工程落地路线
```

---

## 🔐 合规说明

- **无资质即可上线部分（已完成）**：隐私保护指引发布、单独同意弹窗、内容审核拦截、用户协议 / 隐私政策、合规开关收口。
- **待资质 / 备案后开放**：生成式 AI 睡眠助手（需算法备案）；企业端倦怠雷达（需等保 + 数据处理协议 DPA + 员工单独同意）；① 安心眠持证路线（SaMD 二类申报前禁「治疗」宣称）。
- 法律结论需经执业律师 / 合规顾问最终确认；市场数据为公开资料推演，落地前需一手验证。

---

## 📦 部署到腾讯云服务器

详见 [`server/DEPLOY-CVM.md`](./server/DEPLOY-CVM.md)：购买 CVM / 轻量 → 上传 `server/` → `bash deploy-cvm.sh` → `DOMAIN=你的域名 bash setup-https.sh` → 前端改开关连回。

---

## 🗺 开发路线

| 阶段        | 范围                      | 状态             |
| --------- | ----------------------- | -------------- |
| Phase 0   | 合规基座（协议 / 弹窗 / 审核 / 开关） | ✅ 已完成          |
| Phase 1   | ③ 能量驿站 + ① 安心眠增强        | ✅ 已完成          |
| Phase 1.5 | 生成式 AI 睡眠助手             | 🔜 算法备案后开放（占位） |
| Phase 2   | ② 倦怠雷达（企业端）             | 🔜 需立项 / 等保    |
| Phase 3   | 跨设备同步 / 数据汇聚            | 🔜 需立项         |

---

## 🏢 开发与版权

- **开发主体**：晋江市飞虹智科技企业管理有限公司 · 飞扬企源研发中心
- **负责人**：吴赐虹
- **项目**：星眠AI（微信小程序 + 可私有部署 Node 后端）

> 版权归晋江市飞虹智科技企业管理有限公司所有。

---

## 🌐 官方站点与关联开源项目

本仓库由 **晋江市飞虹智科技企业管理有限公司 · 飞扬企源研发中心** 维护，是飞虹智 klAI 开源生态的一部分。

- 🏠 **官方网站**：[https://klai.top](https://klai.top) — 飞虹智 klAI · 泉州制造业 AI 服务商
- 📦 **开源矩阵**：[https://klai.top/opensource.html](https://klai.top/opensource.html) — 全部开源项目一览
- 📚 **AI 知识库**：[https://kb.klai.top](https://kb.klai.top) — 产品文档与智能问答（MaxKB 驱动）

**关联项目**：

| 项目 | 简介 |
|------|------|
| [GEO-SaaS](https://github.com/wch887292/geo-saa) | AI 驱动的全域 GEO 搜索优化平台 |
| [飞虹智·企业AI平台](https://github.com/wch887292/fyqy-ai-agent) | 中小制造企业 AI 原生一体化管理平台 |
| [FyqyClaw](https://github.com/wch887292/FyqyClaw) | 全流程 AI 驱动开发工具（IDE + AI Agent） |
| [星眠AI](https://github.com/wch887292/xmai) | 睡眠健康管理微信小程序 + 私有部署后端（本仓库） |

> ⭐ 如果这个项目对你有帮助，欢迎 **Star** 并分享，让更多人发现飞虹智开源生态！



---

## 🤝 社区支持

关注飞虹智 klAI 动态，获取最新开源项目更新与技术教程：

![社区支持二维码](https://github.com/xmai/releases/download/v1.0.0-community/qrcode-community.png)

扫码加入 **飞虹智企微小助手**，获取：
- 技术答疑与部署指导
- 开源项目更新通知
- 本地化服务预约（泉州地区）
- 企业 AI 数字化咨询

---

*晋江市飞虹智科技企业管理有限公司 · 飞扬企源研发中心 · 负责人：吴赐虹*

## 📄 授权与联系

当前为**商用项目**，代码授权请联合作者。欢迎就睡眠健康产品 / 企业倦怠管理方案交流合作。

> 项目原名「AI睡觉小助手」，已统一更名为 **星眠AI**；「能量银行」已更名为 **能量驿站**。
