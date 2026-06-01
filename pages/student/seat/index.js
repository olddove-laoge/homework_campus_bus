Page({
  data: {
    allowed: false,
    busName: '校巴1号'
  },

  onLoad() {
    const state = wx.getStorageSync('currentRideState')
    if (!state || state.finished || state.status !== 'on_bus') {
      wx.showToast({ title: '仅乘车中可选座', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 300)
      return
    }

    this.setData({
      allowed: true,
      busName: state.currentBusName || '当前车辆'
    })
  }
})
