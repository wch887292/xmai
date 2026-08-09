const app = getApp()
const energyUtil = require('../../utils/energy.js')
const compliance = require('../../config/compliance.js')

Page({
  data: {
    total: 0,
    level: '',
    icon: '',
    nextLevel: '',
    nextIcon: '',
    toNext: 0,
    progress: 0,
    ledger: [],
    asset: { nights: 0, healthyNights: 0, avgQuality: '0.0', checkins: 0, onTimeRate: 0 },
    backendEnabled: false,
    aiEnabled: false
  },

  onShow() { this.refresh() },

  refresh() {
    const records = wx.getStorageSync('sleep_records') || []
    const checkins = wx.getStorageSync('routine_checkins') || []
    const r = energyUtil.calcEnergy(records, checkins)
    this.setData({
      total: r.total,
      level: r.level,
      icon: r.icon,
      nextLevel: r.nextLevel,
      nextIcon: r.nextIcon,
      toNext: r.toNext,
      progress: r.progress,
      ledger: r.ledger,
      asset: r.asset,
      backendEnabled: compliance.BACKEND_SYNC.enabled,
      aiEnabled: compliance.AI.enabled
    })
  },

  goRecord() { wx.switchTab({ url: '/pages/record/record' }) },
  goRoutine() { wx.switchTab({ url: '/pages/routine/routine' }) },
  goAgreement() { wx.navigateTo({ url: compliance.AGREEMENT.userAgreementPath }) },
  goPrivacy() { wx.navigateTo({ url: compliance.AGREEMENT.privacyPolicyPath }) },

  // 扩展点：数据贡献换权益（当前未开放）
  onContribute() {
    if (!this.data.backendEnabled) {
      wx.showModal({
        title: '暂未开放',
        content: '数据贡献与跨设备同步将在隐私政策发布并完成等保后合规开放，当前数据仅保存在本机。',
        showCancel: false
      })
      return
    }
    // TODO(Phase 3): 调用 cloudfunctions/syncSleep，提交匿名聚合数据换取权益
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})
