const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const PAGE_SIZE = 100

async function getAllDocs(collectionName) {
  const countRes = await db.collection(collectionName).count()
  const total = countRes.total || 0
  if (!total) return []

  const tasks = []
  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    tasks.push(db.collection(collectionName).skip(offset).limit(PAGE_SIZE).get())
  }

  const results = await Promise.all(tasks)
  return results.flatMap(item => item.data || [])
}

exports.main = async (event) => {
  const action = event && event.action

  switch (action) {
    case 'getStations':
      return { success: true, data: await getAllDocs('stations') }
    case 'getRoutes':
      return { success: true, data: await getAllDocs('routes') }
    case 'getBuses':
      return { success: true, data: await getAllDocs('buses') }
    case 'updateBusTemperature': {
      const busId = event && event.busId
      const temperature = event && event.temperature
      if (!busId || typeof temperature !== 'number') {
        return { success: false, message: '参数错误' }
      }
      await db.collection('buses').doc(busId).update({
        data: {
          temperature,
          updatedAt: Date.now()
        }
      })
      const res = await db.collection('buses').doc(busId).get()
      return { success: true, data: res.data || null }
    }
    default:
      return { success: false, message: '未知操作' }
  }
}
