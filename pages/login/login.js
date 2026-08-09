const compliance = require('../../config/compliance.js')
const api = require('../../utils/api.js')

Page({
  data: {
    agreed: false,
    loggedIn: false,
    maskedPhone: '',
    localMode: false,
    backendEnabled: true,
    aiEnabled: false
  },

  onShow() {
    this.refreshStatus()
  },

  refreshStatus() {
    const phone = wx.getStorageSync('user_phone') || ''
    const loggedIn = !!wx.getStorageSync('user_logged')
    const local = !!wx.getStorageSync('user_local')
    this.setData({
      loggedIn: loggedIn,
      maskedPhone: local ? '本地模式' : this.maskPhone(phone),
      localMode: local,
      backendEnabled: compliance.BACKEND_SYNC.enabled,
      aiEnabled: compliance.AI.enabled
    })
  },

  maskPhone(p) {
    if (!p || p.length !== 11) return ''
    return p.slice(0, 3) + '****' + p.slice(7)
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  goAgreement() { wx.navigateTo({ url: compliance.AGREEMENT.userAgreementPath }) },
  goPrivacy() { wx.navigateTo({ url: compliance.AGREEMENT.privacyPolicyPath }) },

  // 微信一键登录：getPhoneNumber 返回 code，发给后端换手机号并生成 token
  onGetPhone(e) {
    const d = e.detail
    if (d.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '已取消授权', icon: 'none' })
      return
    }
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    // 本地模式：后端未启用时，不连服务器，仅生成本机会话
    if (!compliance.BACKEND_SYNC.enabled) {
      this.localLogin()
      return
    }
    const self = this
    wx.showLoading({ title: '登录中' })
    api.phoneLogin(d.code).then(function (res) {
      if (!res.ok) throw new Error(res.msg || '登录失败')
      api.setToken(res.token)
      wx.setStorageSync('user_phone', res.maskedPhone)
      wx.setStorageSync('user_logged', true)
      return api.pull()
    }).then(function (pullRes) {
      if (pullRes && pullRes.ok && pullRes.sync) applySync(pullRes.sync)
      wx.hideLoading()
      wx.showToast({ title: '登录成功' })
      setTimeout(function () { wx.navigateBack() }, 800)
    }).catch(function (err) {
      wx.hideLoading()
      wx.showToast({ title: (err && err.message) || '登录失败', icon: 'none' })
    })
  },

  // 本地模式登录：仅生成本机会话（token 以 local_ 前缀），不发起任何网络请求
  localLogin() {
    const self = this
    wx.showLoading({ title: '登录中' })
    api.setToken('local_' + Date.now())
    wx.setStorageSync('user_phone', '')
    wx.setStorageSync('user_local', true)
    wx.setStorageSync('user_logged', true)
    setTimeout(function () {
      wx.hideLoading()
      wx.showToast({ title: '已进入本地模式' })
      setTimeout(function () { wx.navigateBack() }, 800)
    }, 300)
  },

  logout() {
    const self = this
    wx.showModal({
      title: '退出登录',
      content: '将清除本机登录状态（不会删除你的睡眠数据）。',
      success: function (res) {
        if (!res.confirm) return
        api.clearToken()
        wx.removeStorageSync('user_logged')
        wx.removeStorageSync('user_phone')
        wx.removeStorageSync('user_local')
        self.setData({ loggedIn: false, maskedPhone: '', localMode: false, agreed: false })
        wx.showToast({ title: '已退出', icon: 'none' })
      }
    })
  }
})

// 把云端同步数据写回本地存储（登录后云端优先覆盖本机）
function applySync(sync) {
  if (!sync) return
  if (sync.sleep_records) wx.setStorageSync('sleep_records', sync.sleep_records)
  if (sync.routine_config) wx.setStorageSync('routine_config', sync.routine_config)
  if (sync.routine_checkins) wx.setStorageSync('routine_checkins', sync.routine_checkins)
}
