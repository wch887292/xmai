Page({
  data: {
    presets: [5, 10, 20],
    minutes: 10,
    remainSec: 600,
    remainText: '10:00',
    running: false,
    breathing: false
  },

  onLoad() {
    const s = this.data.minutes * 60
    this.setData({ remainSec: s, remainText: this.fmt(s) })
  },

  onUnload() { this.clear() },
  onHide() { if (this.data.running) this.pause() },

  choose(e) {
    const m = Number(e.currentTarget.dataset.m)
    if (this.data.running) return
    const s = m * 60
    this.setData({ minutes: m, remainSec: s, remainText: this.fmt(s) })
  },

  start() {
    if (this.data.running) return
    this.setData({ running: true, breathing: true })
    this.timer = setInterval(() => {
      let s = this.data.remainSec - 1
      if (s <= 0) { this.setData({ remainSec: 0, remainText: '00:00' }); this.finish(); return }
      this.setData({ remainSec: s, remainText: this.fmt(s) })
    }, 1000)
  },

  pause() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    this.setData({ running: false, breathing: false })
  },

  clear() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  },

  reset() {
    this.clear()
    const s = this.data.minutes * 60
    this.setData({ running: false, breathing: false, remainSec: s, remainText: this.fmt(s) })
  },

  finish() {
    this.clear()
    this.setData({ running: false, breathing: false, remainSec: 0, remainText: '00:00' })
    wx.vibrateLong({ fail() {} })
    wx.showModal({ title: '时间到', content: '愿你好梦 🌙', showCancel: false })
  },

  fmt(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec
  }
})
