const app = getApp()

Page({
  data: {
    weekAvg: '--',
    avgQuality: '--',
    onTimeRate: '--',
    bestDur: '--',
    nights: 0
  },

  onShow() {
    this.compute()
    setTimeout(() => this.drawCharts(), 80)
  },

  compute() {
    const records = wx.getStorageSync('sleep_records') || []
    const checkins = wx.getStorageSync('routine_checkins') || []
    const cutoff = app.offsetDate(-6)
    const week = records.filter(r => r.date >= cutoff)

    let weekAvg = '--', avgQuality = '--', bestDur = '--'
    if (week.length) {
      weekAvg = this.fmtDur(Math.round(week.reduce((s, r) => s + r.durationMin, 0) / week.length))
      avgQuality = (week.reduce((s, r) => s + r.quality, 0) / week.length).toFixed(1)
      const wkDurs = week.map(r => r.durationMin)
      bestDur = this.fmtDur(wkDurs.reduce((m, x) => Math.max(m, x), 0))
    }
    const wk = checkins.filter(c => c.date >= cutoff)
    let onTimeRate = '--'
    if (wk.length) onTimeRate = Math.round(wk.filter(c => c.onTime).length / wk.length * 100) + '%'

    this.setData({ weekAvg, avgQuality, onTimeRate, bestDur, nights: week.length })
  },

  fmtDur(min) {
    const h = Math.floor(min / 60), m = min % 60
    return h + 'h' + (m ? m + 'm' : '')
  },

  drawCharts() {
    const records = wx.getStorageSync('sleep_records') || []
    const days = []
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i)
      const ds = app.formatDate(dt)
      const r = records.find(x => x.date === ds)
      days.push({
        ds, label: (dt.getMonth() + 1) + '/' + dt.getDate(),
        quality: r ? r.quality : null, dur: r ? r.durationMin : null
      })
    }
    this.drawLine(days)
    this.drawBars(days)
  },

  drawLine(days) {
    const q = wx.createSelectorQuery().in(this)
    q.select('#lineChart').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return
      const canvas = res[0].node, ctx = canvas.getContext('2d')
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio
      const W = res[0].width, H = res[0].height
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)
      const pad = 34
      ctx.strokeStyle = '#e3def5'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke()

      const maxQ = 5
      const pts = days.map((d, i) => {
        const x = pad + i * ((W - pad * 2) / (days.length - 1))
        const y = d.quality == null ? null : H - pad - (d.quality / maxQ) * (H - pad * 2)
        return { x, y }
      })
      ctx.strokeStyle = '#6c5ce7'; ctx.lineWidth = 2.5; ctx.beginPath()
      let started = false
      pts.forEach(p => { if (p.y == null) return; if (!started) { ctx.moveTo(p.x, p.y); started = true } else ctx.lineTo(p.x, p.y) })
      ctx.stroke()
      pts.forEach((p, i) => {
        if (p.y == null) return
        ctx.fillStyle = '#6c5ce7'; ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#9a93b5'; ctx.font = '10px sans-serif'
        ctx.fillText(days[i].label, p.x - 12, H - pad + 16)
      })
    })
  },

  drawBars(days) {
    const q = wx.createSelectorQuery().in(this)
    q.select('#barChart').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return
      const canvas = res[0].node, ctx = canvas.getContext('2d')
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio
      const W = res[0].width, H = res[0].height
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)
      const pad = 34
      ctx.strokeStyle = '#e3def5'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke()

      const durs = days.map(d => d.dur || 0)
      const maxD = durs.reduce((m, x) => Math.max(m, x), 600)
      const slot = (W - pad * 2) / days.length
      const bw = slot * 0.5
      days.forEach((d, i) => {
        const cx = pad + (i + 0.5) * slot
        ctx.fillStyle = '#9a93b5'; ctx.font = '9px sans-serif'
        ctx.fillText(d.label, cx - 12, H - pad + 16)
        if (d.dur == null) return
        const h = (d.dur / maxD) * (H - pad * 2)
        ctx.fillStyle = '#a29bfe'
        ctx.fillRect(cx - bw / 2, H - pad - h, bw, h)
        ctx.fillStyle = '#6b6390'
        ctx.fillText(Math.floor(d.dur / 60) + 'h', cx - bw / 2, H - pad - h - 4)
      })
    })
  }
})
