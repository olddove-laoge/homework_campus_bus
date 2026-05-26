const { buildInitialState, nextState } = require('../../../utils/mock/bus-simulator')

let timer = null

Page({
  data: {
    lines: {},
    buses: [],
    markers: [],
    polyline: [],
    center: { lat: 28.681771, lng: 115.935563 }
  },

  onLoad() {
    const initial = buildInitialState()
    this.setData(initial)
  },

  onPullDownRefresh() {
    const initial = buildInitialState()
    this.setData(initial)
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

  goEta() {
    wx.navigateTo({ url: '/pages/student/eta/index' })
  },

  goRide() {
    wx.navigateTo({ url: '/pages/student/ride/index' })
  },

  goSeat() {
    wx.navigateTo({ url: '/pages/student/seat/index' })
  }
})
