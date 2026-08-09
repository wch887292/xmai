const express = require('express')
const store = require('../store')
const wechat = require('../wechat')
const config = require('../config')

const router = express.Router()

// 手机号登录/注册：小程序端用 button open-type="getPhoneNumber" 拿 code 传上来
router.post('/phone-login', async function (req, res) {
  try {
    let phone = ''
    if (config.DEV_MODE && req.body.devPhone) {
      // 仅本地测试旁路：直接用一个手机号登录，绕过微信 code。
      // 生产必须关闭 DEV_MODE，否则任何人可伪造登录。
      phone = String(req.body.devPhone).replace(/\D/g, '')
    } else {
      const code = req.body.code
      if (!code) return res.status(400).json({ ok: false, msg: '缺少 code' })
      phone = await wechat.getPhoneNumber(code)
    }
    if (!phone || phone.length !== 11) {
      return res.status(400).json({ ok: false, msg: '手机号获取失败' })
    }

    let user = store.readUser(phone)
    let isNew = false
    if (!user) {
      isNew = true
      user = {
        phone: phone,
        token: store.genToken(),
        createdAt: Date.now(),
        sync: store.emptySync()
      }
    } else {
      // 每次登录刷新 token
      user.token = store.genToken()
    }
    user.lastLoginAt = Date.now()
    store.writeUser(user)

    const masked = phone.slice(0, 3) + '****' + phone.slice(7)
    res.json({ ok: true, token: user.token, maskedPhone: masked, isNew: isNew })
  } catch (e) {
    res.status(500).json({ ok: false, msg: '登录失败：' + e.message })
  }
})

module.exports = router
