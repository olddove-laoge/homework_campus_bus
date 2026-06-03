const { getBusById } = require('../../../utils/services/master-data')
const { findBusById, tickLiveSimulation, lines } = require('../../../utils/mock/bus-simulator')

let timer = null

function buildLineNodes(line) {
  if (Array.isArray(line.routeNodes) && line.routeNodes.length) {
    return line.routeNodes
  }

  const stations = line.stations || []
  const waypoints = line.waypoints || []
  return [
    ...stations.slice(0, -1).map(item => ({ ...item, isStation: true })),
    ...waypoints,
    stations[stations.length - 1]
  ].filter(Boolean)
}

function normalizeStationName(name) {
  return String(name || '')
    .replace(/\s*\((返程|终点)\)$/, '')
    .trim()
}

function getNextStationName(bus) {
  const line = lines[bus.lineId]
  if (!line) return '--'

  const stations = buildLineNodes(line).filter(node => node.isStation !== false)
  const currentIndex = stations.findIndex(node => normalizeStationName(node.name) === normalizeStationName(bus.station))
  if (currentIndex === -1) return '--'

  const nextIndex = (currentIndex + 1) % stations.length
  return stations[nextIndex]?.name || '--'
}

Page({
  data: {
    busId: '',
    busName: '当前车辆',
    lineName: '--',
    directionText: '--',
    temperature: '--',
    loadText: '--',
    currentStation: '--',
    nextStation: '--'
  },

  onLoad() {
    const auth = wx.getStorageSync('auth') || {}
    if (!auth.busId) return

    this.setData({ busId: auth.busId })
    getBusById(auth.busId).then(bus => {
      if (!bus) return
      this.setData({
        busName: bus.busName || '当前车辆',
        lineName: bus.lineName || '--',
        directionText: bus.direction === 'backward' ? '返向' : '正向'
      })
      this.syncLiveBusStatus()
    }).catch(() => {})
  },

  onShow() {
    this.startPolling()
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  startPolling() {
    if (timer) return
    timer = setInterval(() => {
      tickLiveSimulation(false)
      this.syncLiveBusStatus()
    }, 100)
  },

  stopPolling() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  },

  syncLiveBusStatus() {
    const bus = findBusById(this.data.busId)
    if (!bus) return
    this.setData({
      temperature: `${bus.temp}°C`,
      loadText: bus.seats,
      currentStation: bus.station || '--',
      nextStation: getNextStationName(bus)
    })
  },

  goAc() {
    wx.navigateTo({ url: '/pages/driver/ac/index' })
  },
  goBroadcast() {
    wx.navigateTo({ url: '/pages/driver/broadcast/index' })
  },
  goScan() {
    wx.navigateTo({ url: '/pages/driver/scan/index' })
  }
})
