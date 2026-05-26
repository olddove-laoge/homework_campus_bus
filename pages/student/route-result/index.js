const { findShortestPath } = require('../../../utils/mock/route-planner')
const { lines } = require('../../../utils/mock/bus-simulator')

function addSegmentColors(segments = []) {
  return segments.map(segment => ({
    ...segment,
    color: lines[segment.lineId]?.color || '#2563EBCC'
  }))
}

Page({
  data: {
    plan: {
      lineName: '',
      startStation: '',
      endStation: '',
      nextStation: '',
      eta: '18 分钟',
      transfer: null,
      pathStations: [],
      segments: [],
      transferStations: []
    }
  },

  onLoad() {
    const draft = wx.getStorageSync('rideDraft') || {}
    const startStation = draft.startStation
    const endStation = draft.endStation

    if (!startStation || !endStation) {
      wx.showToast({ title: '请先选择起点和终点', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }

    const result = findShortestPath(startStation, endStation)
    if (!result.success) {
      wx.showToast({ title: '未找到可达路径', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }

    const segments = addSegmentColors(result.segments)
    const plan = {
      lineName: result.lineName,
      startStation: result.startStation,
      endStation: result.endStation,
      nextStation: result.pathStations[1] || result.endStation,
      eta: result.eta,
      transfer: result.transferStations.length ? `换乘于 ${result.transferStations.join(' / ')}` : null,
      pathStations: result.pathStations,
      segments,
      transferStations: result.transferStations
    }

    this.setData({ plan })
    wx.setStorageSync('currentRidePlan', plan)
  },

  confirmPlan() {
    wx.setStorageSync('currentRideState', {
      status: '乘车中',
      currentIndex: 0,
      finished: false,
      plan: this.data.plan
    })
    wx.navigateTo({ url: '/pages/student/journey/index' })
  }
})