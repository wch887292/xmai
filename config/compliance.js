// =============================================================
// 合规与功能开关 —— 所有受资质/备案约束的功能统一在此收口
// 设计原则：先合规、后扩展。无资质即可运行的基础防护默认开启；
//           受约束功能默认关闭，仅保留调用位与扩展点，待条件齐备再解锁。
// =============================================================

module.exports = {
  // 产品性质声明（无资质下必须坚守，避免医疗违规）
  PRODUCT_NATURE: '睡眠健康管理工具（非医疗、非诊疗、不提供诊断或治疗）',

  // ---------- ① 安心眠 / ③ 能量驿站：基础合规保护已落地，无资质可运行 ----------
  // 用户协议 + 隐私政策 + 内容审核，均为本地能力，无需任何许可。
  AGREEMENT: {
    required: true,
    userAgreementPath: '/pages/agreement/agreement',
    privacyPolicyPath: '/pages/privacy/privacy'
  },

  // ---------- 内容审核（基础防护，无资质即可运行）----------
  CONTENT_AUDIT: {
    enabled: true,
    // 医疗断言拦截：产品无医疗资质，任何「治疗/治愈」类表述均须拦截
    blockMedicalClaim: true
  },

  // ---------- 手机号登录（已接入真实后端：微信 getPhoneNumber 一键登录）----------
  LOGIN: {
    enabled: true,
    method: 'wechat_getPhoneNumber',
    smsVerification: false,
    note: '后端连上时：小程序 getPhoneNumber 拿 code → 服务端用 AppSecret 换手机号 → 生成 token。手机号仅存服务端，本机只留脱敏号与 token。后端未连时（BACKEND_SYNC.enabled=false）自动降级为「本地模式」登录，仅生成本机会话，不发起任何网络请求。'
  },

  // ---------- 生成式 AI（门控：须算法备案后开启）----------
  AI: {
    enabled: false,
    reason: '生成式AI功能须在完成算法备案后接入上线',
    preconditions: [
      '完成生成式人工智能服务算法备案（网信办）',
      '完成个人信息保护影响评估（PIPIA）',
      '接入内容安全审核（AI 输出同样过审核与免责标注）',
      '医疗相关输出加人工复核或显著免责声明，维持非诊疗定位'
    ],
    scope: '备案前仅展示入口与说明，不开放任何 AI 生成能力；备案后仅开放经备案的对话/建议类型',
    pagePath: '/pages/ai/ai'
  },

  // ---------- 后端/云同步 & 数据汇聚（后端已就绪：server/ 自建 Node 服务）----------
  // 当前为「本地模式」：前端暂不连接后端，所有数据仅存本机。
  // 部署腾讯云服务器后，只需把 enabled 改为 true 并将 apiBase 改成真实 HTTPS 域名，
  // 前端即自动连回后端（看板/登录页均按此开关分支，无需改业务代码）。
  BACKEND_SYNC: {
    enabled: false, // 临时断开：前端先不连后端，纯本地存储运行
    apiBase: 'https://your-cloud-server-domain', // TODO: 部署腾讯云服务器/云托管后替换为真实服务地址
    reason: '当前为本地模式：前端暂不连接后端，数据仅存本机。后端已就绪（server/），部署腾讯云后开启 enabled=true 并填 apiBase 即连回。',
    note: '数据仅按 token 隔离存储于服务端；跨设备同步已可用。切换回后端只需改此处两个字段。'
  }
}
