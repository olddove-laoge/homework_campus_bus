const { getLiveSimulationState, tickLiveSimulation, buildMarkersForState } = require('../../../utils/mock/bus-simulator')

const STATION_LABEL_SCALE = 16
let timer = null

Page({
  data: {
    lines: {},
    buses: [],
    markers: [],
    polyline: [],
    center: { lat: 28.681771, lng: 115.935563 },
    rideStatus: '未乘车',
    showStationLabel: false
  },

  onLoad() {
    this.resetViewState()
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

    this.setData({
      lines: initial.lines,
      buses: initial.buses,
      markers: initial.markers,
      polyline: initial.polyline,
      center: initial.center,
      rideStatus
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
    wx.navigateTo({ url: '/pages/student/seat/index' })
  }
})
