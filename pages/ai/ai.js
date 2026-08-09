const compliance = require('../../config/compliance.js')

Page({
  data: {
    enabled: false,
    reason: '',
    preconditions: [],
    scope: ''
  },

  onLoad() {
    const ai = compliance.AI
    this.setData({
      enabled: ai.enabled,
      reason: ai.reason,
      preconditions: ai.preconditions,
      scope: ai.scope
    })
  },

  // 当前阶段：生成式 AI 未备案，任何进入生成流程的操作都被拦截
  onTryUse() {
    wx.showModal({
      title: '功能待合规上线',
      content: '生成式 AI 睡眠助手需在完成算法备案、个人信息保护影响评估与内容安全接入后开放。当前仅作说明展示。',
      showCancel: false
    })
  }
})
