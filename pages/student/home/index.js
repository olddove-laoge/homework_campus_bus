Page({
  data: {
    buses: [
      { id: 'S1', name: '校巴1号', station: '图书馆站', eta: '2 分钟', seats: '26/40', load: 65, temp: 24 },
      { id: 'S2', name: '校巴2号', station: '北门站', eta: '5 分钟', seats: '14/40', load: 35, temp: 23 },
      { id: 'S3', name: '校巴3号', station: '教学楼A站', eta: '8 分钟', seats: '31/40', load: 78, temp: 25 }
    ]
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
