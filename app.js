// 星眠AI - 小程序入口
App({
  globalData: {
    version: '1.0.0'
  },

  // ===== 后端已接入（自建 Node 服务，非 wx.cloud）=====
  // 数据同步与登录走 server/ 提供的 HTTP 接口（见 config/compliance.js 的 BACKEND_SYNC.apiBase）。
  // 本地存储(wx.setStorageSync)仍是主存储，登录后可通过首页「云端同步」按钮与后端双向同步。
  CLOUD_MODE: false,
  CLOUD_ENV: 'your-env-id', // 保留云开发占位，当前使用自有 Node 后端

  onLaunch() {
    // if (this.CLOUD_MODE && wx.cloud) {
    //   wx.cloud.init({ env: this.CLOUD_ENV, traceUser: true })
    // }
    this.initSampleData()
  },

  // 首次启动写入示例数据（含近 3 天，今天留空=需处理项）
  initSampleData() {
    if (!wx.getStorageSync('sleep_records')) {
      const y1 = this.offsetDate(-1)
      const y2 = this.offsetDate(-2)
      const y3 = this.offsetDate(-3)
      const sample = [
        { id: 's1', date: y3, bedTime: '23:10', sleepTime: '23:35', wakeTime: '07:05', durationMin: 450, quality: 4, note: '睡前看了会儿书' },
        { id: 's2', date: y2, bedTime: '23:40', sleepTime: '00:10', wakeTime: '06:50', durationMin: 400, quality: 3, note: '' },
        { id: 's3', date: y1, bedTime: '22:55', sleepTime: '23:20', wakeTime: '07:20', durationMin: 480, quality: 5, note: '运动后睡得香' }
      ]
      wx.setStorageSync('sleep_records', sample)
    }
    if (!wx.getStorageSync('routine_config')) {
      wx.setStorageSync('routine_config', { targetBed: '23:30', targetWake: '07:00', toleranceMin: 30 })
    }
    if (!wx.getStorageSync('routine_checkins')) {
      wx.setStorageSync('routine_checkins', [])
    }
  },

  formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  offsetDate(n) {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return this.formatDate(d)
  }
})
