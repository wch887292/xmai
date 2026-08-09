const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('./config')

function ensureDir() {
  if (!fs.existsSync(config.DATA_DIR)) fs.mkdirSync(config.DATA_DIR, { recursive: true })
}

function userFile(phone) {
  const safe = String(phone).replace(/[^0-9]/g, '')
  return path.join(config.DATA_DIR, 'user_' + safe + '.json')
}

function emptySync() {
  return { sleep_records: [], routine_config: null, routine_checkins: [] }
}

function readUser(phone) {
  ensureDir()
  const f = userFile(phone)
  if (!fs.existsSync(f)) return null
  try {
    const u = JSON.parse(fs.readFileSync(f, 'utf8'))
    if (!u.sync) u.sync = emptySync()
    return u
  } catch (e) {
    return null
  }
}

function writeUser(user) {
  ensureDir()
  fs.writeFileSync(userFile(user.phone), JSON.stringify(user, null, 2))
}

function genToken() {
  return crypto.randomBytes(config.TOKEN_BYTES).toString('hex')
}

function findByToken(token) {
  if (!token) return null
  const dir = config.DATA_DIR
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter(function (f) { return f.startsWith('user_') && f.endsWith('.json') })
  for (let i = 0; i < files.length; i++) {
    try {
      const u = JSON.parse(fs.readFileSync(path.join(dir, files[i]), 'utf8'))
      if (u.token === token) {
        if (!u.sync) u.sync = emptySync()
        return u
      }
    } catch (e) { /* 跳过损坏文件 */ }
  }
  return null
}

module.exports = { readUser, writeUser, genToken, findByToken, emptySync }
