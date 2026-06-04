const { getLiveSimulationState, tickLiveSimulation, buildMarkersForState } = require('../../../utils/mock/bus-simulator')
const { getStations } = require('../../../utils/services/transit-data')
const { getBusSeats } = require('../../../utils/services/ride-cloud')
const { DEFAULT_STATION, normalizeStationName, mapStationDocs, getNearestStationName } = require('../../../utils/services/station-helper')
const { countStopsToStation } = require('../../../utils/services/route-helper')

const STATION_LABEL_SCALE = 16
let timer = null
let seatTimer = null

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

function buildSeatSummary(seatMap) {
  const seats = (seatMap && seatMap.seats) || []
  if (!seats.length) {
    return {
      seatsText: '--',
      load: 0
    }
  }

  const occupiedCount = seats.filter(seat => seat.status === 'occupied' || seat.status === 'mine').length
  const total = seats.length
  return {
    seatsText: `${occupiedCount}/${total}`,
    load: Math.round((occupiedCount / total) * 100)
  }
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
    stationDocs: [],
    seatSummaryMap: {}
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
    this.startSeatPolling()
  },

  onHide() {
    this.stopSimulation()
    this.stopSeatPolling()
  },

  onUnload() {
    this.stopSimulation()
    this.stopSeatPolling()
  },

  resetViewState() {
    const initial = getLiveSimulationState(this.data.showStationLabel)
    const rideState = wx.getStorageSync('currentRideState')
    const rideStatus = !rideState || rideState.finished
      ? '未乘车'
      : rideState.status === 'pending_boarding'
        ? '待上车'
        : '乘车中'

    this.applyBusState(initial, rideStatus, true)
    this.refreshSeatSummary()
  },

  applyBusState(state, rideStatus = this.data.rideStatus, resetMap = false) {
    const nextBus = getNextBusForStation(this.data.currentStationName || DEFAULT_STATION, state.buses || [])
    const nextData = {
      buses: state.buses || [],
      markers: state.markers,
      rideStatus,
      nextBusName: nextBus?.name || '--',
      nextBusEta: nextBus?.eta || '--'
    }

    if (resetMap) {
      nextData.lines = state.lines
      nextData.polyline = state.polyline
      nextData.center = state.center
    }

    this.setData(nextData)
  },

  refreshSeatSummary() {
    const baseBuses = this.data.buses || []
    if (!baseBuses.length) return

    Promise.all(baseBuses.map(bus =>
      getBusSeats(bus.id)
        .then(result => ({ busId: bus.id, summary: result.success ? buildSeatSummary(result.seatMap) : { seatsText: '--', load: 0 } }))
        .catch(() => ({ busId: bus.id, summary: { seatsText: '--', load: 0 } }))
    )).then(items => {
      const seatSummaryMap = items.reduce((acc, item) => {
        acc[item.busId] = item.summary
        return acc
      }, {})
      this.setData({ seatSummaryMap })
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
      this.applyBusState(next)
    }, 100)
  },

  startSeatPolling() {
    if (seatTimer) return
    seatTimer = setInterval(() => {
      this.refreshSeatSummary()
    }, 3000)
  },

  stopSimulation() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  },

  stopSeatPolling() {
    if (!seatTimer) return
    clearInterval(seatTimer)
    seatTimer = null
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
