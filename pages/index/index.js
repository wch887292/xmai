const app = getApp()
const energyUtil = require('../../utils/energy.js')
const compliance = require('../../config/compliance.js')
const api = require('../../utils/api.js')

Page({
  data: {
    greeting: '',
    todayStr: '',
    tasks: [],
    lastDuration: '--',
    weekAvg: '--',
    streak: 0,
    showBackup: false,
    importModeOn: false,
    importText: '',
    recCount: 0,
    checkinCount: 0,
    userCount: 888,
    privacyVisible: false,
    privacyContractName: '《隐私保护指引》',
    energyTotal: 0,
    energyLevel: '',
    energyIcon: '',
    aiEnabled: false,
    loggedIn: false,
    maskedPhone: '',
    localMode: false
  },

  onLoad() {
    this.checkPrivacy()
  },

  onShow() {
    this.growUserCount()
    this.refreshLogin()
    this.refresh()
  },

  // 登录态：读取本机会话（手机号登录为本地模式）
  refreshLogin() {
    const phone = wx.getStorageSync('user_phone') || ''
    const loggedIn = !!wx.getStorageSync('user_logged')
    const local = !!wx.getStorageSync('user_local')
    this.setData({
      loggedIn: loggedIn,
      maskedPhone: local ? '本地模式' : this.maskPhone(phone),
      localMode: local
    })
  },

  maskPhone(p) {
    if (!p || p.length !== 11) return ''
    return p.slice(0, 3) + '****' + p.slice(7)
  },

  // 使用用户数：基数 888，累计只增不减（本地模拟增长，仅展示用）
  growUserCount() {
    let n = wx.getStorageSync('user_count')
    if (!n || n < 888) n = 888
    if (Math.random() < 0.6) n += 1 + Math.floor(Math.random() * 2)
    wx.setStorageSync('user_count', n)
    this.setData({ userCount: n })
  },

  // 隐私授权：检测是否需要弹窗（需在小程序后台配置《隐私保护指引》后才会 needAuthorization=true）
  checkPrivacy() {
    if (!wx.getPrivacySetting) return
    wx.getPrivacySetting({
      success: (res) => {
        if (res.needAuthorization) {
          this.setData({ privacyVisible: true, privacyContractName: res.privacyContractName || '《隐私保护指引》' })
        }
      },
      fail: () => {}
    })
  },

  openPrivacyContract() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({ fail: () => wx.showToast({ title: '打开失败', icon: 'none' }) })
    }
  },

  handleAgree() {
    this.setData({ privacyVisible: false })
  },

  closePrivacy() {
    this.setData({ privacyVisible: false })
  },

  refresh() {
    const today = app.formatDate(new Date())
    const records = wx.getStorageSync('sleep_records') || []
    const cfg = wx.getStorageSync('routine_config') || {}
    const checkins = wx.getStorageSync('routine_checkins') || []

    const todayRec = records.find(r => r.date === today)
    const todayCheck = checkins.find(c => c.date === today)

    const tasks = []
    if (!todayRec) {
      tasks.push({ type: 'record', text: '今天还没记录睡眠', btn: '去记录', urgent: true })
    }
    if (cfg.targetBed && !todayCheck) {
      tasks.push({ type: 'routine', text: '今天还没作息打卡', btn: '去打卡', urgent: false })
    }
    const yest = app.offsetDate(-1)
    if (!records.find(r => r.date === yest)) {
      tasks.push({ type: 'record', text: '昨天漏记了，补一下？', btn: '补记', urgent: false })
    }

    // 统计
    const past = records.filter(r => r.date < today).sort((a, b) => a.date < b.date ? 1 : -1)
    const last = past[0] || todayRec
    const lastDuration = last ? this.fmtDur(last.durationMin) : '--'

    const cutoff = app.offsetDate(-6)
    const week = records.filter(r => r.date >= cutoff)
    let weekAvg = '--'
    if (week.length) {
      const avg = Math.round(week.reduce((s, r) => s + r.durationMin, 0) / week.length)
      weekAvg = this.fmtDur(avg)
    }

    const streak = this.calcStreak(checkins)
    const greeting = this.calcGreeting()

    // 能量驿站：基于现有记录/打卡即时计算（纯本地，无后端）
    const e = energyUtil.calcEnergy(records, checkins)

    this.setData({
      greeting,
      todayStr: today + ' ' + this.weekday(),
      tasks, lastDuration, weekAvg, streak,
      energyTotal: e.total,
      energyLevel: e.level,
      energyIcon: e.icon,
      aiEnabled: compliance.AI.enabled
    })
  },

  fmtDur(min) {
    if (!min) return '--'
    const h = Math.floor(min / 60)
    const m = min % 60
    return h + 'h' + (m ? m + 'm' : '')
  },

  weekday() {
    const arr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return arr[new Date().getDay()]
  },

  calcGreeting() {
    const h = new Date().getHours()
    if (h < 6) return '夜深了'
    if (h < 11) return '早上好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    if (h < 23) return '晚上好'
    return '夜深了'
  },

  calcStreak(checkins) {
    if (!checkins.length) return 0
    const set = new Set(checkins.filter(c => c.onTime).map(c => c.date))
    let streak = 0
    const d = new Date()
    if (!set.has(app.formatDate(d))) d.setDate(d.getDate() - 1)
    while (set.has(app.formatDate(d))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  },

  handleTask(e) {
    const t = e.currentTarget.dataset.type
    if (t === 'record') wx.switchTab({ url: '/pages/record/record' })
    else if (t === 'routine') wx.switchTab({ url: '/pages/routine/routine' })
  },

  goRecord() { wx.switchTab({ url: '/pages/record/record' }) },
  goRoutine() { wx.switchTab({ url: '/pages/routine/routine' }) },
  goDashboard() { wx.switchTab({ url: '/pages/dashboard/dashboard' }) },
  goTimer() { wx.navigateTo({ url: '/pages/timer/timer' }) },
  goEnergy() { wx.switchTab({ url: '/pages/energy/energy' }) },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }) },
  goAi() { wx.navigateTo({ url: compliance.AI.pagePath }) },
  goAgreement() { wx.navigateTo({ url: compliance.AGREEMENT.userAgreementPath }) },
  goPrivacy() { wx.navigateTo({ url: compliance.AGREEMENT.privacyPolicyPath }) },

  // 云端同步：把本机数据备份到后端
  goSyncPush() {
    if (!compliance.BACKEND_SYNC.enabled) { wx.showToast({ title: '本地模式：数据仅存本机', icon: 'none' }); return }
    if (!wx.getStorageSync('user_logged')) { wx.showToast({ title: '请先登录', icon: 'none' }); return }
    const self = this
    const sync = {
      sleep_records: wx.getStorageSync('sleep_records') || [],
      routine_config: wx.getStorageSync('routine_config') || null,
      routine_checkins: wx.getStorageSync('routine_checkins') || []
    }
    wx.showLoading({ title: '备份中' })
    api.push(sync).then(function () {
      wx.hideLoading(); wx.showToast({ title: '已备份到云端' })
    }).catch(function (err) {
      wx.hideLoading(); wx.showToast({ title: (err && err.message) || '备份失败', icon: 'none' })
    })
  },

  // 云端同步：从后端恢复数据到本机
  goSyncPull() {
    if (!compliance.BACKEND_SYNC.enabled) { wx.showToast({ title: '本地模式：数据仅存本机', icon: 'none' }); return }
    if (!wx.getStorageSync('user_logged')) { wx.showToast({ title: '请先登录', icon: 'none' }); return }
    const self = this
    wx.showLoading({ title: '恢复中' })
    api.pull().then(function (res) {
      if (!res.ok) throw new Error(res.msg || '失败')
      if (res.sync) {
        if (res.sync.sleep_records) wx.setStorageSync('sleep_records', res.sync.sleep_records)
        if (res.sync.routine_config) wx.setStorageSync('routine_config', res.sync.routine_config)
        if (res.sync.routine_checkins) wx.setStorageSync('routine_checkins', res.sync.routine_checkins)
      }
      wx.hideLoading(); wx.showToast({ title: '已从云端恢复' })
      self.refresh()
    }).catch(function (err) {
      wx.hideLoading(); wx.showToast({ title: (err && err.message) || '恢复失败', icon: 'none' })
    })
  },

  showBackup() {
    const recCount = (wx.getStorageSync('sleep_records') || []).length
    const checkinCount = (wx.getStorageSync('routine_checkins') || []).length
    this.setData({ showBackup: true, importModeOn: false, importText: '', recCount, checkinCount })
  },
  hideBackup() { this.setData({ showBackup: false }) },
  noop() {},
  importMode() { this.setData({ importModeOn: true }) },
  onImportInput(e) { this.setData({ importText: e.detail.value }) },

  exportData() {
    const keys = ['sleep_records', 'routine_config', 'routine_checkins']
    const data = {}
    keys.forEach(k => { data[k] = wx.getStorageSync(k) })
    const json = JSON.stringify(data)
    wx.setClipboardData({
      data: json,
      success() {
        const n = (data.sleep_records || []).length
        wx.showToast({ title: '已复制 ' + n + ' 条', icon: 'none' })
      }
    })
  },

  doImport() {
    let obj
    try {
      obj = JSON.parse(this.data.importText)
    } catch (err) {
      wx.showToast({ title: 'JSON格式错误', icon: 'none' })
      return
    }
    if (!obj || typeof obj !== 'object') {
      wx.showToast({ title: '内容无效', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认恢复',
      content: '将覆盖当前所有数据，确定从备份恢复？',
      success: (res) => {
        if (!res.confirm) return
        if (obj.sleep_records) wx.setStorageSync('sleep_records', obj.sleep_records)
        if (obj.routine_config) wx.setStorageSync('routine_config', obj.routine_config)
        if (obj.routine_checkins) wx.setStorageSync('routine_checkins', obj.routine_checkins)
        wx.showToast({ title: '恢复成功' })
        this.setData({ showBackup: false })
        this.refresh()
      }
    })
  },

  clearAll() {
    wx.showModal({
      title: '清空全部数据',
      content: '将删除所有睡眠记录与打卡，且无法恢复。建议先导出备份。',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (!res.confirm) return
        wx.showModal({
          title: '再次确认',
          content: '真的要清空吗？此操作不可撤销。',
          confirmColor: '#e74c3c',
          success: (r2) => {
            if (!r2.confirm) return
            wx.removeStorageSync('sleep_records')
            wx.removeStorageSync('routine_config')
            wx.removeStorageSync('routine_checkins')
            wx.showToast({ title: '已清空' })
            this.setData({ showBackup: false })
            this.refresh()
          }
        })
      }
    })
  },

  resetSample() {
    wx.showModal({
      title: '恢复示例数据',
      content: '将写入一套示例睡眠记录与打卡，方便你重新体验。',
      success: (res) => {
        if (!res.confirm) return
        app.initSampleData()
        wx.showToast({ title: '示例已恢复' })
        this.setData({ showBackup: false })
        this.refresh()
      }
    })
  }
})
