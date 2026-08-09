const https = require('https')
const config = require('./config')

let cachedToken = { token: '', expireAt: 0 }

function httpsGet(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      let data = ''
      res.on('data', function (c) { data += c })
      res.on('end', function () {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

function httpsPost(url, body) {
  return new Promise(function (resolve, reject) {
    const data = JSON.stringify(body)
    const u = new URL(url)
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, function (res) {
      let d = ''
      res.on('data', function (c) { d += c })
      res.on('end', function () {
        try { resolve(JSON.parse(d)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function getAccessToken() {
  const now = Date.now()
  if (cachedToken.token && cachedToken.expireAt > now + 60000) return cachedToken.token
  const url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' +
    config.WECHAT_APPID + '&secret=' + config.WECHAT_SECRET
  const res = await httpsGet(url)
  if (res.access_token) {
    cachedToken = { token: res.access_token, expireAt: now + (res.expires_in || 7200) * 1000 }
    return res.access_token
  }
  throw new Error('获取 access_token 失败: ' + JSON.stringify(res))
}

// 用 getPhoneNumber 返回的 code 换取手机号（purePhoneNumber）
async function getPhoneNumber(code) {
  const token = await getAccessToken()
  const url = 'https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=' + token
  const res = await httpsPost(url, { code: code })
  if (res.errcode) throw new Error('getuserphonenumber 失败: ' + JSON.stringify(res))
  const phoneInfo = res.phone_info || {}
  return phoneInfo.purePhoneNumber || phoneInfo.phoneNumber || ''
}

module.exports = { getAccessToken, getPhoneNumber }
