const { getLiveSimulationState, tickLiveSimulation, buildMarkersForState, lines } = require('../../../utils/mock/bus-simulator')

const STATION_LABEL_SCALE = 16
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

function getNextBusForStation(stationName, buses) {
  const normalizedTarget = normalizeStationName(stationName)
  const candidates = (buses || [])
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

  return candidates[0] || null
}

Page({
  data: {
    lines: {},
    buses: [],
    markers: [],
    polyline: [],
    center: { lat: 28.681771, lng: 115.935563 },
    rideStatus: '未乘车',
    showStationLabel: false,
    currentStationName: DEFAULT_STATION,
    nextBusName: '--',
    nextBusEta: '--'
  },

  onLoad() {
    this.resetViewState()
    this.initNearestStation()
  },

  onPullDownRefresh() {
    this.resetViewState()
    wx.stopPullDownRefresh()
  },

  onShow() {
    this.startSimulation()
  },

  onHide() {
    this.stopSimulation()
  },

  onUnload() {
    this.stopSimulation()
  },

  resetViewState() {
    const initial = getLiveSimulationState(this.data.showStationLabel)
    const rideState = wx.getStorageSync('currentRideState')
    const rideStatus = !rideState || rideState.finished
      ? '未乘车'
      : rideState.status === 'pending_boarding'
        ? '待上车'
        : '乘车中'
    const nextBus = getNextBusForStation(this.data.currentStationName || DEFAULT_STATION, initial.buses)

    this.setData({
      lines: initial.lines,
      buses: initial.buses,
      markers: initial.markers,
      polyline: initial.polyline,
      center: initial.center,
      rideStatus,
      nextBusName: nextBus?.name || '--',
      nextBusEta: nextBus?.eta || '--'
    })
  },

  initNearestStation() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        const currentStationName = getNearestStationName({ latitude: res.latitude, longitude: res.longitude })
        const nextBus = getNextBusForStation(currentStationName, this.data.buses)
        this.setData({
          currentStationName,
          nextBusName: nextBus?.name || '--',
          nextBusEta: nextBus?.eta || '--'
        })
      },
      fail: () => {
        const currentStationName = DEFAULT_STATION
        const nextBus = getNextBusForStation(currentStationName, this.data.buses)
        this.setData({
          currentStationName,
          nextBusName: nextBus?.name || '--',
          nextBusEta: nextBus?.eta || '--'
        })
      }
    })
  },

  startSimulation() {
    if (timer) return
    timer = setInterval(() => {
      const next = tickLiveSimulation(this.data.showStationLabel)
      this.setData({
        buses: next.buses,
        markers: next.markers
      })
    }, 100)
  },

  stopSimulation() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  },

  onMapRegionChange(e) {
    if (e.type !== 'end') return

    const mapContext = wx.createMapContext('student-bus-map', this)
    mapContext.getScale({
      success: res => {
        const scale = res.scale || 0
        const showStationLabel = scale >= STATION_LABEL_SCALE
        if (showStationLabel === this.data.showStationLabel) return

        this.setData({
          showStationLabel,
          markers: buildMarkersForState(this.data.buses, this.data.lines, showStationLabel)
        })
      }
    })
  },

  goRideRequest() {
    wx.navigateTo({ url: '/pages/student/ride-request/index' })
  },

  goEta() {
    wx.navigateTo({ url: '/pages/student/eta/index' })
  },

  goRide() {
    const state = wx.getStorageSync('currentRideState')
    if (state && !state.finished) {
      wx.navigateTo({ url: '/pages/student/journey/index' })
      return
    }
    wx.navigateTo({ url: '/pages/student/ride-request/index' })
  },

  goSeat() {
    const state = wx.getStorageSync('currentRideState')
    if (!state || state.finished || state.status !== 'on_bus') {
      wx.showToast({ title: '仅乘车中可选座', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/student/seat/index' })
  }
})
