const express = require('express')
const store = require('../store')
const middleware = require('../middleware')

const router = express.Router()

// 拉取当前用户全部同步数据
router.get('/', middleware.auth, function (req, res) {
  const user = req.user
  res.json({ ok: true, sync: user.sync || store.emptySync(), serverTime: Date.now() })
})

// 推送（整体覆盖三大类数据）
router.post('/', middleware.auth, function (req, res) {
  const user = req.user
  const body = req.body || {}
  const incoming = body.sync || {}
  const cur = user.sync || store.emptySync()

  user.sync = {
    sleep_records: Array.isArray(incoming.sleep_records) ? incoming.sleep_records : cur.sleep_records,
    routine_config: (incoming.routine_config && typeof incoming.routine_config === 'object') ? incoming.routine_config : cur.routine_config,
    routine_checkins: Array.isArray(incoming.routine_checkins) ? incoming.routine_checkins : cur.routine_checkins
  }
  user.lastSyncAt = Date.now()
  store.writeUser(user)
  res.json({ ok: true, serverTime: Date.now() })
})

module.exports = router
