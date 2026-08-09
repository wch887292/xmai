const app = getApp()

Page({
  data: {
    targetBed: '23:30',
    targetWake: '07:00',
    toleranceMin: 30,
    todayBed: '',
    todayWake: '',
    checkedToday: false,
    onTime: false,
    streak: 0,
    recent: []
  },

  onShow() { this.loadAll() },

  loadAll() {
    const cfg = wx.getStorageSync('routine_config') || {}
    const checkins = wx.getStorageSync('routine_checkins') || []
    const today = app.formatDate(new Date())
    const todayCheck = checkins.find(c => c.date === today)
    const rec = (wx.getStorageSync('sleep_records') || []).find(r => r.date === today)

    const set = new Set(checkins.filter(c => c.onTime).map(c => c.date))
    let streak = 0
    const d = new Date()
    if (!set.has(app.formatDate(d))) d.setDate(d.getDate() - 1)
    while (set.has(app.formatDate(d))) { streak++; d.setDate(d.getDate() - 1) }

    const recent = []
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i)
      const ds = app.formatDate(dt)
      const c = checkins.find(x => x.date === ds)
      recent.push({ ds, label: (dt.getMonth() + 1) + '/' + dt.getDate(), onTime: c ? c.onTime : null })
    }

    this.setData({
      targetBed: cfg.targetBed || '23:30',
      targetWake: cfg.targetWake || '07:00',
      toleranceMin: cfg.toleranceMin || 30,
      todayBed: todayCheck ? todayCheck.bedTime : (rec ? rec.bedTime : ''),
      todayWake: todayCheck ? todayCheck.wakeTime : (rec ? rec.wakeTime : ''),
      checkedToday: !!todayCheck,
      onTime: todayCheck ? todayCheck.onTime : false,
      streak, recent
    })
  },

  onTargetBed(e) { this.setData({ targetBed: e.detail.value }) },
  onTargetWake(e) { this.setData({ targetWake: e.detail.value }) },
  onTol(e) { this.setData({ toleranceMin: e.detail.value }) },
  onBed(e) { this.setData({ todayBed: e.detail.value }) },
  onWake(e) { this.setData({ todayWake: e.detail.value }) },

  saveConfig() {
    wx.setStorageSync('routine_config', {
      targetBed: this.data.targetBed,
      targetWake: this.data.targetWake,
      toleranceMin: Number(this.data.toleranceMin) || 30
    })
    wx.showToast({ title: '目标已保存' })
  },

  calcOnTime(bed, wake, tBed, tWake, tol) {
    const toMin = (t) => { const p = t.split(':').map(Number); return p[0] * 60 + p[1] }
    const bedOk = toMin(bed) <= toMin(tBed) + tol
    const wakeOk = toMin(wake) >= toMin(tWake) - tol
    return bedOk && wakeOk
  },

  checkIn() {
    const d = this.data; const todayBed = d.todayBed, todayWake = d.todayWake, targetBed = d.targetBed, targetWake = d.targetWake, toleranceMin = d.toleranceMin
    if (!todayBed || !todayWake) {
      wx.showToast({ title: '先填今天的上床/起床时间', icon: 'none' }); return
    }
    const onTime = this.calcOnTime(todayBed, todayWake, targetBed, targetWake, toleranceMin)
    const today = app.formatDate(new Date())
    let checkins = wx.getStorageSync('routine_checkins') || []
    const item = { date: today, bedTime: todayBed, wakeTime: todayWake, onTime }
    const exist = checkins.find(c => c.date === today)
    if (exist) checkins = checkins.map(c => c.date === today ? item : c)
    else checkins.push(item)
    wx.setStorageSync('routine_checkins', checkins)
    wx.showToast({ title: onTime ? '达标 🎉' : '未达标' })
    this.loadAll()
  }
})
