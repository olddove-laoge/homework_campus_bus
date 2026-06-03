const { getLiveSimulationState, tickLiveSimulation, lines } = require('../../../utils/mock/bus-simulator')

const DEFAULT_STATION = '国威路(地铁)站'
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

function getAllStations() {
  return Object.values(lines).flatMap(line => buildLineNodes(line).filter(node => node.isStation !== false))
}

function normalizeStationName(name) {
  return String(name || '')
    .replace(/\s*\((返程|终点)\)$/, '')
    .trim()
}

function distance(a, b) {
  const dx = (a.latitude - b.latitude) * 111000
  const dy = (a.longitude - b.longitude) * 85000
  return Math.sqrt(dx * dx + dy * dy)
}

function getNearestStationName(location) {
  const stations = getAllStations()
  const matched = stations
    .map(station => ({
      ...station,
      dist: distance(location, station)
    }))
    .sort((a, b) => a.dist - b.dist)[0]

  return normalizeStationName(matched?.name || DEFAULT_STATION)
}

function countStopsToStation(line, currentStationName, targetStationName) {
  const nodes = buildLineNodes(line).filter(node => node.isStation !== false)
  const currentIndex = nodes.findIndex(node => normalizeStationName(node.name) === normalizeStationName(currentStationName))
  const targetIndex = nodes.findIndex(node => normalizeStationName(node.name) === normalizeStationName(targetStationName))
  if (currentIndex === -1 || targetIndex === -1) return Number.MAX_SAFE_INTEGER
  if (currentIndex === targetIndex) return 0
  if (targetIndex > currentIndex) return targetIndex - currentIndex
  return nodes.length - currentIndex + targetIndex
}

function getUpcomingBuses(stationName, buses) {
  const normalizedTarget = normalizeStationName(stationName)
  return (buses || [])
    .map(bus => {
      const line = lines[bus.lineId]
      if (!line) return null
      return {
        ...bus,
        stopsAway: countStopsToStation(line, bus.station, normalizedTarget)
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.stopsAway - b.stopsAway)
}

Page({
  data: {
    currentStationName: DEFAULT_STATION,
    nextBusName: '--',
    nextBusEta: '--',
    upcomingBuses: []
  },

  onLoad() {
    this.refreshEtaView()
    this.initNearestStation()
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
      this.refreshEtaView()
    }, 100)
  },

  stopPolling() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  },

  initNearestStation() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        this.setData({
          currentStationName: getNearestStationName({ latitude: res.latitude, longitude: res.longitude })
        }, () => this.refreshEtaView())
      },
      fail: () => {
        this.setData({
          currentStationName: DEFAULT_STATION
        }, () => this.refreshEtaView())
      }
    })
  },

  refreshEtaView() {
    const state = getLiveSimulationState(false)
    const upcomingBuses = getUpcomingBuses(this.data.currentStationName, state.buses)
    const nextBus = upcomingBuses[0]

    this.setData({
      nextBusName: nextBus?.name || '--',
      nextBusEta: nextBus?.eta || '--',
      upcomingBuses: upcomingBuses.slice(1, 4)
    })
  }
})
