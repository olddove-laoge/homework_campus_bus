const { buildInitialState, nextState, buildMarkersForState } = require('../../../utils/mock/bus-simulator')

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
    const initial = buildInitialState(this.data.showStationLabel)
    const rideState = wx.getStorageSync('currentRideState')
    this.setData({
      ...initial,
      rideStatus: rideState && !rideState.finished ? '乘车中' : '未乘车'
    })
  },

  startSimulation() {
    if (timer) return
    timer = setInterval(() => {
      const next = nextState(this.data.buses, this.data.lines, this.data.showStationLabel)
      this.setData(next)
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
