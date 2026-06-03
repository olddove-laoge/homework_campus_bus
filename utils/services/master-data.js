const BUSES_CACHE_KEY = 'cloudBusesCache'

function callMasterData(action) {
  return wx.cloud.callFunction({
    name: 'readMasterData',
    data: { action }
  }).then(res => res.result || {})
}

function getCollection(name) {
  return wx.cloud.database().collection(name)
}

function saveBusesCache(buses) {
  wx.setStorageSync(BUSES_CACHE_KEY, buses || [])
  return buses || []
}

function getBusesCache() {
  return wx.getStorageSync(BUSES_CACHE_KEY) || []
}

function getUsersByUsername(username) {
  return getCollection('users').where({ username }).limit(1).get().then(res => res.data || [])
}

function getBuses() {
  return callMasterData('getBuses').then(result => {
    if (result.success) {
      return saveBusesCache(result.data || [])
    }
    return getCollection('buses').get().then(res => saveBusesCache(res.data || []))
  }).catch(() => getCollection('buses').get().then(res => saveBusesCache(res.data || [])))
}

function getBusById(busId) {
  const cached = getBusesCache().find(item => item._id === busId)
  if (cached) {
    return Promise.resolve(cached)
  }
  return getCollection('buses').doc(busId).get().then(res => res.data || null).catch(() => null)
}

module.exports = {
  getUsersByUsername,
  getBuses,
  getBusById,
  getBusesCache,
  saveBusesCache
}
