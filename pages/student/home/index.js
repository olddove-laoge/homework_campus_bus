const { buildInitialState, nextState } = require('../../../utils/mock/bus-simulator')

let timer = null

Page({
  data: {
    lines: {},
    buses: [],
    markers: [],
    polyline: [],
    center: { lat: 28.681771, lng: 115.935563 },
    rideStatus: '未乘车'
  },

  onLoad() {
    const initial = buildInitialState()
    const rideState = wx.getStorageSync('currentRideState')
    this.setData({
      ...initial,
      rideStatus: rideState && !rideState.finished ? '乘车中' : '未乘车'
    })
  },

  onPullDownRefresh() {
    const initial = buildInitialState()
    const rideState = wx.getStorageSync('currentRideState')
    this.setData({
      ...initial,
      rideStatus: rideState && !rideState.finished ? '乘车中' : '未乘车'
    })
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

  startSimulation() {
    if (timer) return
    timer = setInterval(() => {
      const next = nextState(this.data.buses, this.data.lines)
      this.setData(next)
    }, 800)
  },

  stopSimulation() {
    if (!timer) return
    clearInterval(timer)
    timer = null
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
