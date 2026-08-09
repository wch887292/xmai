// 后端 API 封装（微信小程序侧）
// 所有请求走 config/compliance.js 的 BACKEND_SYNC.apiBase，自动带 Bearer token。
const compliance = require('../config/compliance.js')

function getToken() {
  return wx.getStorageSync('user_token') || ''
}
function setToken(t) {
  if (t) wx.setStorageSync('user_token', t)
}
function clearToken() {
  wx.removeStorageSync('user_token')
}

function request(method, path, data) {
  return new Promise(function (resolve, reject) {
    if (!compliance.BACKEND_SYNC.enabled) {
      reject(new Error('后端未启用'))
      return
    }
    const header = { 'Content-Type': 'application/json' }
    const tk = getToken()
    if (tk) header['Authorization'] = 'Bearer ' + tk
    wx.request({
      url: compliance.BACKEND_SYNC.apiBase + path,
      method: method,
      data: data,
      header: header,
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
        else reject(new Error((res.data && res.data.msg) || ('HTTP ' + res.statusCode)))
      },
      fail: function (err) { reject(new Error((err && err.errMsg) || '网络错误')) }
    })
  })
}

module.exports = {
  getToken: getToken,
  setToken: setToken,
  clearToken: clearToken,
  phoneLogin: function (code) { return request('POST', '/api/auth/phone-login', { code: code }) },
  pull: function () { return request('GET', '/api/sync', null) },
  push: function (sync) { return request('POST', '/api/sync', { sync: sync }) }
}
