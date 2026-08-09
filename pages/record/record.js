const app = getApp()
const audit = require('../../utils/audit.js')

Page({
  data: {
    date: '',
    bedTime: '23:00',
    sleepTime: '23:30',
    wakeTime: '07:00',
    quality: 3,
    note: '',
    records: [],
    editingId: ''
  },

  onShow() {
    this.setData({ date: app.formatDate(new Date()) })
    this.loadList()
  },

  loadList() {
    const records = (wx.getStorageSync('sleep_records') || [])
      .slice()
      .sort((a, b) => a.date < b.date ? 1 : -1)
      .map(r => Object.assign({}, r, { dispDur: this.fmtDur(r.durationMin) }))
    this.setData({ records })
  },

  onDate(e) { this.setData({ date: e.detail.value }) },
  onBed(e) { this.setData({ bedTime: e.detail.value }) },
  onSleep(e) { this.setData({ sleepTime: e.detail.value }) },
  onWake(e) { this.setData({ wakeTime: e.detail.value }) },
  pickQuality(e) { this.setData({ quality: Number(e.currentTarget.dataset.q) }) },
  onNote(e) { this.setData({ note: e.detail.value }) },

  durMin() {
    const sb = this.data.sleepTime.split(':').map(Number)
    const wb = this.data.wakeTime.split(':').map(Number)
    const sh = sb[0], sm = sb[1], wh = wb[0], wm = wb[1]
    let m = (wh * 60 + wm) - (sh * 60 + sm)
    if (m <= 0) m += 1440
    return m
  },

  save() {
    const d = this.data; const date = d.date, bedTime = d.bedTime, sleepTime = d.sleepTime, wakeTime = d.wakeTime, quality = d.quality, note = d.note, editingId = d.editingId
    if (!date) { wx.showToast({ title: '请选择日期', icon: 'none' }); return }
    // 内容审核：备注含医疗断言/敏感词则拦截（产品无医疗资质）
    const r = audit.auditText(note)
    if (!r.ok) { wx.showToast({ title: r.msg, icon: 'none' }); return }
    const durationMin = this.durMin()
    let records = wx.getStorageSync('sleep_records') || []
    if (editingId) {
      records = records.map(r => r.id === editingId
        ? Object.assign({}, r, { date, bedTime, sleepTime, wakeTime, durationMin, quality, note })
        : r)
    } else {
      const exist = records.find(r => r.date === date)
      if (exist) {
        records = records.map(r => r.date === date
          ? Object.assign({}, r, { bedTime, sleepTime, wakeTime, durationMin, quality, note })
          : r)
      } else {
        records.push({ id: 's' + Date.now(), date, bedTime, sleepTime, wakeTime, durationMin, quality, note })
      }
    }
    wx.setStorageSync('sleep_records', records)
    wx.showToast({ title: '已保存' })
    this.setData({ editingId: '', note: '', quality: 3 })
    this.loadList()
  },

  edit(e) {
    const id = e.currentTarget.dataset.id
    const r = (wx.getStorageSync('sleep_records') || []).find(x => x.id === id)
    if (!r) return
    this.setData({
      editingId: id, date: r.date, bedTime: r.bedTime,
      sleepTime: r.sleepTime, wakeTime: r.wakeTime, quality: r.quality, note: r.note
    })
    wx.pageScrollTo({ scrollTop: 0 })
  },

  remove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除', content: '确定删除这条记录？', success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('sleep_records') || []
          records = records.filter(r => r.id !== id)
          wx.setStorageSync('sleep_records', records)
          this.loadList()
        }
      }
    })
  },

  fmtDur(min) {
    const h = Math.floor(min / 60), m = min % 60
    return h + 'h' + (m ? m + 'm' : '')
  }
})
