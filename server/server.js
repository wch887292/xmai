const express = require('express')
const config = require('./src/config')
const authRoutes = require('./src/routes/auth')
const syncRoutes = require('./src/routes/sync')

const app = express()
app.use(express.json({ limit: '2mb' }))

// 健康检查（云托管探测用）
app.get('/', function (req, res) { res.json({ ok: true, service: 'xingmian-ai-server', time: Date.now() }) })
app.get('/healthz', function (req, res) { res.json({ ok: true }) })

app.use('/api/auth', authRoutes)
app.use('/api/sync', syncRoutes)

// 404
app.use(function (req, res) { res.status(404).json({ ok: false, msg: 'not found' }) })

// 错误处理
app.use(function (err, req, res, next) {
  console.error('[error]', err)
  res.status(500).json({ ok: false, msg: 'server error' })
})

app.listen(config.PORT, function () {
  console.log('星眠AI 后端已启动: http://localhost:' + config.PORT + ' (DEV_MODE=' + config.DEV_MODE + ')')
})
