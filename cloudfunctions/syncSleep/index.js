// 云开发接入示例云函数（占位，未部署）
// ============================================
// 用途：当小程序从「纯本地存储」升级为「云开发后端」时，
//       用云数据库替代 wx.setStorageSync，实现跨设备同步。
//
// 部署方式：
//   1. 小程序后台开通「云开发」，记下环境 ID（如 env: 'xxx'）
//   2. app.js 中把 CLOUD_MODE 改为 true 并填入 CLOUD_ENV
//   3. 在「云开发 -> 云函数」中新建 syncSleep，上传本目录
//   4. 小程序端调用示例（替换原 wx.setStorageSync 逻辑）：
//        wx.cloud.callFunction({
//          name: 'syncSleep',
//          data: { action: 'upsert', openid: '{云函数自动注入}', records: [...] }
//        })
//
// 注意：云函数内无法直接读取小程序的 wx.* API，需通过云数据库（cloud.database()）。

const cloud = require('wx-server-sdk')
// cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 部署时取消注释

exports.main = async (event) => {
  const { action, records } = event
  // const db = cloud.database()
  // const _ = db.command

  switch (action) {
    case 'upsert':
      // 示例：批量写入睡眠记录（实际请按 openid 分用户存储）
      // await db.collection('sleep_records').where({ openid }).remove()
      // await db.collection('sleep_records').add({ data: records })
      return { ok: true, count: (records || []).length, note: '示例占位，未真正写入' }

    case 'pull':
      // 示例：拉取当前用户全部记录
      // const res = await db.collection('sleep_records').where({ openid }).get()
      // return { ok: true, data: res.data }
      return { ok: true, data: [], note: '示例占位，未真正读取' }

    default:
      return { ok: false, msg: 'unknown action' }
  }
}
