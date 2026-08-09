// =============================================================
// 内容审核（本地关键词拦截）—— 无资质即可运行的基础防护
// 用途：在用户输入（睡眠备注、反馈等）落库前拦截违规内容，
//       重点拦截「医疗断言」（产品无医疗资质）与引流敏感词。
// 注意：本地关键词为第一道防线；接入生成式 AI / 后端后，
//       须叠加服务端内容安全审核（涉政/暴恐/违禁/医疗断言）。
// =============================================================

// 医疗断言类：产品无医疗资质，严禁任何治疗/疗效暗示
var MEDICAL_CLAIM_WORDS = [
  '治疗', '治愈', '根治', '疗效', '处方', '诊断', '疗程',
  '药到病除', '一觉治好', '失眠症治疗', '治好失眠', '疗效显著',
  '包治', '专治', '医疗', '医师', '开药'
]

// 引流/违规类敏感词
var SENSITIVE_WORDS = [
  '加微信', '加我微信', '微信同号', '私聊', '代购', '暴利',
  '扫码', '付款', '转账', '兼职', '刷单'
]

// 返回 { ok:true } 或 { ok:false, type, word, msg }
function auditText(text) {
  if (!text || !String(text).trim()) return { ok: true }
  var t = String(text)
  for (var i = 0; i < MEDICAL_CLAIM_WORDS.length; i++) {
    if (t.indexOf(MEDICAL_CLAIM_WORDS[i]) >= 0) {
      return {
        ok: false,
        type: 'medical_claim',
        word: MEDICAL_CLAIM_WORDS[i],
        msg: '内容包含医疗断言（「' + MEDICAL_CLAIM_WORDS[i] + '」），已被拦截。本产品为睡眠健康管理工具，不具备医疗资质。'
      }
    }
  }
  for (var j = 0; j < SENSITIVE_WORDS.length; j++) {
    if (t.indexOf(SENSITIVE_WORDS[j]) >= 0) {
      return {
        ok: false,
        type: 'sensitive',
        word: SENSITIVE_WORDS[j],
        msg: '内容包含敏感词（「' + SENSITIVE_WORDS[j] + '」），已被拦截。'
      }
    }
  }
  return { ok: true }
}

module.exports = { auditText: auditText }
