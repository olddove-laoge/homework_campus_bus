const ROUTES_CACHE_KEY = 'cloudRoutesCache'
const STATIONS_CACHE_KEY = 'cloudStationsCache'
const PAGE_SIZE = 100

function callMasterData(action) {
  return wx.cloud.callFunction({
    name: 'readMasterData',
    data: { action }
  }).then(res => res.result || {})
}

function getCollection(name) {
  return wx.cloud.database().collection(name)
}

function saveRoutesCache(routes) {
  wx.setStorageSync(ROUTES_CACHE_KEY, routes || [])
  return routes || []
}

function saveStationsCache(stations) {
  wx.setStorageSync(STATIONS_CACHE_KEY, stations || [])
  return stations || []
}

function getRoutesCache() {
  return wx.getStorageSync(ROUTES_CACHE_KEY) || []
}

function getStationsCache() {
  return wx.getStorageSync(STATIONS_CACHE_KEY) || []
}

function getCount(name) {
  return getCollection(name).count().then(res => res.total || 0)
}

function getAllDocs(name) {
  return getCount(name).then(total => {
    if (!total) return []
    const tasks = []
    for (let offset = 0; offset < total; offset += PAGE_SIZE) {
      tasks.push(getCollection(name).skip(offset).limit(PAGE_SIZE).get())
    }
    return Promise.all(tasks).then(results => results.flatMap(item => item.data || []))
  })
}

function getRoutes() {
  return callMasterData('getRoutes').then(result => {
    if (result.success) {
      return saveRoutesCache(result.data || [])
    }
    return getAllDocs('routes').then(routes => saveRoutesCache(routes))
  }).catch(() => getAllDocs('routes').then(routes => saveRoutesCache(routes)))
}

function getStations() {
  return callMasterData('getStations').then(result => {
    if (result.success) {
      return saveStationsCache(result.data || [])
    }
    return getAllDocs('stations').then(stations => saveStationsCache(stations))
  }).catch(() => getAllDocs('stations').then(stations => saveStationsCache(stations)))
}

module.exports = {
  getRoutes,
  getStations,
  getRoutesCache,
  getStationsCache,
  saveRoutesCache,
  saveStationsCache
}
