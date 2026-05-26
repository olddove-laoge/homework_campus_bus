Page({
  goDrivers() {
    wx.navigateTo({ url: '/pages/admin/drivers/index' })
  },
  goBuses() {
    wx.navigateTo({ url: '/pages/admin/buses/index' })
  },
  goRoutes() {
    wx.navigateTo({ url: '/pages/admin/routes/index' })
  }
})
