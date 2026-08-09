// =============================================================
// 能量驿站 —— 能量计算（纯函数，无后端依赖）
// 设计：以睡眠记录 + 作息打卡为数据燃料，量化用户积累的「数据能量」。
//       能量只增不减、可追溯；计算完全本地，零外部依赖。
// 扩展点：当 config.compliance.BACKEND_SYNC.enabled 为 true 时，
//         可把 ledger 推送到云端（见 cloudfunctions/syncSleep）。
// =============================================================

// 成长等级阶梯（min 为累计能量阈值）
var TIERS = [
  { min: 0, level: '萌芽', icon: '🌱' },
  { min: 200, level: '生长', icon: '🌿' },
  { min: 500, level: '茁壮', icon: '🌳' },
  { min: 1000, level: '繁茂', icon: '🌲' },
  { min: 2000, level: '森林', icon: '🌌' }
]

// 单条睡眠记录的基础能量
var REC_BASE = 12
var REC_QUALITY_BONUS = 4     // 质量 >= 4
var REC_HEALTHY_BONUS = 4     // 时长落在 7~9 小时健康区间
var REC_NOTE_BONUS = 2        // 有备注
// 打卡能量
var CHECKIN_BASE = 6
var CHECKIN_ONTIME_BONUS = 6  // 准时

// 计算单条记录的能量明细
function recordEnergy(r) {
  var delta = REC_BASE
  var reasons = ['睡眠记录']
  if (r.quality >= 4) { delta += REC_QUALITY_BONUS; reasons.push('高质量') }
  if (r.durationMin >= 420 && r.durationMin <= 540) { delta += REC_HEALTHY_BONUS; reasons.push('健康时长') }
  if (r.note && String(r.note).trim()) { delta += REC_NOTE_BONUS; reasons.push('有备注') }
  return { delta: delta, reasons: reasons }
}

// 计算单次打卡的能量明细
function checkinEnergy(c) {
  var delta = CHECKIN_BASE
  var reasons = ['作息打卡']
  if (c.onTime) { delta += CHECKIN_ONTIME_BONUS; reasons.push('准时') }
  return { delta: delta, reasons: reasons }
}

// 主计算：输入 records、checkins，输出总量、等级、账本、数据资产
function calcEnergy(records, checkins) {
  records = records || []
  checkins = checkins || []

  var total = 0
  var ledger = []
  var sumQuality = 0
  var healthyNights = 0

  // 记录账本（按日期升序）
  var recSorted = records.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1 })
  recSorted.forEach(function (r) {
    var e = recordEnergy(r)
    total += e.delta
    sumQuality += (r.quality || 0)
    if (r.durationMin >= 420 && r.durationMin <= 540) healthyNights++
    ledger.push({ date: r.date, delta: e.delta, reason: e.reasons.join('·') })
  })

  // 打卡账本
  var ckSorted = checkins.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1 })
  ckSorted.forEach(function (c) {
    var e = checkinEnergy(c)
    total += e.delta
    ledger.push({ date: c.date, delta: e.delta, reason: e.reasons.join('·') })
  })

  // 等级
  var tier = TIERS[0]
  for (var i = 0; i < TIERS.length; i++) {
    if (total >= TIERS[i].min) tier = TIERS[i]
  }
  var next = null
  for (var k = 0; k < TIERS.length; k++) {
    if (TIERS[k].min > total) { next = TIERS[k]; break }
  }
  var toNext = next ? (next.min - total) : 0
  var progress = next ? Math.round((total - tier.min) / (next.min - tier.min) * 100) : 100

  // 数据资产概览
  var avgQuality = records.length ? (sumQuality / records.length).toFixed(1) : '0.0'
  var onTimeCount = checkins.filter(function (c) { return c.onTime }).length
  var rate = checkins.length ? Math.round(onTimeCount / checkins.length * 100) : 0

  // 账本按日期降序展示（最新在前）
  ledger.reverse()

  return {
    total: total,
    level: tier.level,
    icon: tier.icon,
    nextLevel: next ? next.level : '',
    nextIcon: next ? next.icon : '',
    toNext: toNext,
    progress: progress,
    ledger: ledger,
    asset: {
      nights: records.length,
      healthyNights: healthyNights,
      avgQuality: avgQuality,
      checkins: checkins.length,
      onTimeRate: rate
    }
  }
}

module.exports = {
  TIERS: TIERS,
  calcEnergy: calcEnergy,
  recordEnergy: recordEnergy,
  checkinEnergy: checkinEnergy
}
