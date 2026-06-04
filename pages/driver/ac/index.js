const { getBusById, updateBusTemperature } = require('../../../utils/services/master-data')

Page({
  data: {
    busId: '',
    busName: '当前车辆',
    temperature: 24,
    statusText: '已开启'
  },

  onLoad() {
    const auth = wx.getStorageSync('auth') || {}
    if (!auth.busId) return

    this.setData({
      busId: auth.busId,
      busName: auth.busName || '当前车辆'
    })
    this.loadBusTemperature(auth.busId)
  },

  onShow() {
    if (this.data.busId) {
      this.loadBusTemperature(this.data.busId)
    }
  },

  loadBusTemperature(busId) {
    getBusById(busId).then(bus => {
      if (!bus) return
      const temperature = typeof bus.temperature === 'number' ? bus.temperature : 24
      this.setData({
        busName: bus.busName || this.data.busName,
        temperature
      })
    }).catch(() => {})
  },

  adjustTemperature(e) {
    const delta = Number(e.currentTarget.dataset.delta || 0)
    const next = Math.min(30, Math.max(16, Number(this.data.temperature || 24) + delta))
    this.updateTemperature(next)
  },

  updateTemperature(nextTemperature) {
    if (!this.data.busId) return

    updateBusTemperature(this.data.busId, nextTemperature).then(result => {
      if (!result.success) {
        wx.showToast({ title: result.message || '温度更新失败', icon: 'none' })
        return
      }
      this.setData({
        temperature: nextTemperature,
        statusText: '已开启'
      })
      wx.showToast({ title: '温度已更新', icon: 'none' })
    }).catch(() => {
      wx.showToast({ title: '温度更新失败', icon: 'none' })
    })
  }
})
