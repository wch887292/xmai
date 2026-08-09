const store = require('./store')

// Bearer token 校验中间件
function auth(req, res, next) {
  const header = req.headers['authorization'] || ''
  const m = header.match(/^Bearer\s+(.+)$/i)
  const token = m ? m[1] : (req.query.token || req.body.token)
  if (!token) return res.status(401).json({ ok: false, msg: '缺少 token' })
  const user = store.findByToken(token)
  if (!user) return res.status(401).json({ ok: false, msg: 'token 无效或已过期' })
  req.user = user
  next()
}

module.exports = { auth }
