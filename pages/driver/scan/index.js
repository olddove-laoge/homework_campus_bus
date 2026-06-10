const { bindRideToBus } = require('../../../utils/services/ride-cloud')
const { getBusById } = require('../../../utils/services/master-data')
const { setRideState } = require('../../../utils/services/session-storage')
const { getDriverBuses } = require('../../../utils/mock/ride-session-store')

Page({
  data: {
    driverBus: null,
    resultText: '点击下方按钮开始扫码验票'
  },

  onLoad() {
    const driverBuses = getDriverBuses()
    const auth = wx.getStorageSync('auth') || {}
    const fallbackBus = driverBuses.find(item => item.busId === auth.busId) || driverBuses[0] || null
    this.setData({
      driverBus: fallbackBus
    })

    if (!auth.busId) return
    getBusById(auth.busId).then(bus => {
      if (!bus) return
      this.setData({
        driverBus: {
          busId: bus._id,
          busName: bus.busName,
          lineId: bus.lineId,
          lineName: bus.lineName,
          direction: bus.direction
        }
      })
    }).catch(() => {})
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
        bindRideToBus(res.result || '', driverBus).then(result => {
          if (!result.success) {
            if (result.state) {
              setRideState(result.state)
            }
            this.setData({ resultText: result.message })
            wx.showToast({ title: result.message, icon: 'none' })
            return
          }

          setRideState(result.state)
          const text = `绑定成功：${driverBus.busName} 已接入当前行程`
          this.setData({ resultText: text })
          wx.showToast({ title: '扫码绑定成功', icon: 'none' })
        })
      },
      fail: () => {
        wx.showToast({ title: '扫码未完成', icon: 'none' })
      }
    })
  }
})
