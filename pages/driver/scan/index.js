const { bindRideToBus, getDriverBuses } = require('../../../utils/mock/ride-session-store')

Page({
  data: {
    driverBus: null,
    resultText: '点击下方按钮开始扫码验票'
  },

  onLoad() {
    const driverBuses = getDriverBuses()
    this.setData({
      driverBus: driverBuses[0] || null
    })
  },

  handleScanCode() {
    const driverBus = this.data.driverBus
    if (!driverBus) {
      wx.showToast({ title: '当前未分配车辆', icon: 'none' })
      return
    }

    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: res => {
        const result = bindRideToBus(res.result || '', driverBus)
        if (!result.success) {
          this.setData({ resultText: result.message })
          wx.showToast({ title: result.message, icon: 'none' })
          return
        }

        const text = `绑定成功：${driverBus.busName} 已接入当前行程`
        this.setData({ resultText: text })
        wx.showToast({ title: '扫码绑定成功', icon: 'none' })
      },
      fail: () => {
        wx.showToast({ title: '扫码未完成', icon: 'none' })
      }
    })
  }
})
