const { getBusSeats, selectSeat } = require('../../../utils/services/ride-cloud')
const { getRideState: getLocalRideState } = require('../../../utils/services/session-storage')

function decorateSeats(seats = [], rideId) {
  return (seats || []).map(seat => {
    const occupiedByCurrentUser = seat.occupantRideId && seat.occupantRideId === rideId
    const occupied = occupiedByCurrentUser || seat.status === 'occupied' || seat.status === 'mine' || Boolean(seat.occupantRideId)

    return {
      ...seat,
      status: occupiedByCurrentUser
        ? 'mine'
        : occupied
          ? 'occupied'
          : 'free'
    }
  })
}

Page({
  data: {
    allowed: false,
    busName: '校巴1号',
    busId: '',
    rideId: '',
    seats: []
  },

  onLoad() {
    const state = getLocalRideState()
    if (!state || state.finished || state.status !== 'on_bus' || !state.currentBusId) {
      wx.showToast({ title: '仅乘车中可选座', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 300)
      return
    }

    const rideId = state.rideId || state._id
    this.setData({
      allowed: true,
      busName: state.currentBusName || '当前车辆',
      busId: state.currentBusId,
      rideId
    })
    this.loadSeats(state.currentBusId)
  },

  loadSeats(busId) {
    getBusSeats(busId).then(result => {
      if (!result.success || !result.seatMap) {
        wx.showToast({ title: result.message || '座位加载失败', icon: 'none' })
        return
      }
      this.setData({ seats: decorateSeats(result.seatMap.seats || [], this.data.rideId) })
    })
  },

  chooseSeat(e) {
    const seatNo = e.currentTarget.dataset.seat
    if (!seatNo) return

    selectSeat(this.data.rideId, seatNo).then(result => {
      if (!result.success) {
        wx.showToast({ title: result.message || '选座失败', icon: 'none' })
        return
      }
      this.setData({ seats: decorateSeats(result.seats || [], this.data.rideId) })
      wx.showToast({ title: '选座成功', icon: 'none' })
    })
  }
})
