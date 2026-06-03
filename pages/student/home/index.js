const { getLiveSimulationState, tickLiveSimulation, buildMarkersForState } = require('../../../utils/mock/bus-simulator')
const { getStations } = require('../../../utils/services/transit-data')
const { DEFAULT_STATION, normalizeStationName, mapStationDocs, getNearestStationName } = require('../../../utils/services/station-helper')
const { countStopsToStation } = require('../../../utils/services/route-helper')

const STATION_LABEL_SCALE = 16
let timer = null

function getNextBusForStation(stationName, buses) {
  const normalizedTarget = normalizeStationName(stationName)
  const candidates = (buses || [])
    .map(bus => ({
      ...bus,
      stopsAway: countStopsToStation(bus.lineId, bus.station, normalizedTarget)
    }))
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
    nextBusEta: '--',
    stationDocs: []
  },

  onLoad() {
    this.resetViewState()
    getStations().then(stations => {
      this.setData({ stationDocs: mapStationDocs(stations) }, () => this.initNearestStation())
    }).catch(() => {
      this.setData({ stationDocs: [] }, () => this.initNearestStation())
    })
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
        const currentStationName = getNearestStationName(this.data.stationDocs, { latitude: res.latitude, longitude: res.longitude })
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
