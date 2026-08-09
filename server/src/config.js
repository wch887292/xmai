const fs = require('fs')
const path = require('path')

// 极简 .env 加载：仅注入尚未存在的环境变量，避免覆盖系统/平台注入值。
// 不依赖 dotenv 包，保持零依赖。
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(function (line) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  })
}
loadEnv()

module.exports = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  WECHAT_APPID: process.env.WECHAT_APPID || '',
  WECHAT_SECRET: process.env.WECHAT_SECRET || '',
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, '..', 'data'),
  TOKEN_BYTES: 24,
  DEV_MODE: process.env.DEV_MODE === 'true'
}
