const { findShortestPath } = require('../../../utils/mock/route-planner')
const { lines } = require('../../../utils/mock/bus-simulator')

const ROW_HEIGHT = 104

function colorForLineName(lineName) {
  const line = Object.values(lines).find(item => item.name === lineName)
  return line?.color || '#2563EBCC'
}

function addSegmentColors(segments = []) {
  return segments.map(segment => ({
    ...segment,
    color: lines[segment.lineId]?.color || '#2563EBCC'
  }))
}

function buildTimelineStops(plan) {
  const sourceSegments = Array.isArray(plan.segments) && plan.segments.length
    ? plan.segments
    : [{ lineName: plan.lineName || '线路', color: colorForLineName(plan.lineName), stations: plan.pathStations || [] }]

  const stops = []
  sourceSegments.forEach((segment, segmentIndex) => {
    const stations = segment.stations || []
    stations.forEach((station, stationIndex) => {
      const prev = stops[stops.length - 1]
      const isFirst = segmentIndex === 0 && stationIndex === 0
      const isLastOfSegment = stationIndex === stations.length - 1
      const isTransfer = isLastOfSegment && segmentIndex < sourceSegments.length - 1
      const stopColor = segment.color || colorForLineName(segment.lineName)

      if (prev && prev.name === station) {
        prev.isTransfer = true
        prev.color = stopColor
        prev.connectorColor = stopColor
        prev.segmentName = segment.lineName || prev.segmentName
        return
      }

      stops.push({
        name: station,
        color: stopColor,
        connectorColor: stopColor,
        segmentName: segment.lineName || '',
        isStart: isFirst,
        isEnd: false,
        isTransfer,
        meta: isFirst ? '起点' : isTransfer ? '换乘站' : '途径站'
      })
    })
  })

  stops.forEach((stop, index) => {
    const next = stops[index + 1]
    if (next) {
      stop.connectorColor = next.color
      if (!stop.isTransfer && !stop.isStart) {
        stop.meta = stop.meta || '途径站'
      }
    } else {
      stop.isEnd = true
      stop.meta = '终点'
    }
  })

  if (stops.length) {
    stops[0].meta = '起点'
    stops[stops.length - 1].meta = '终点'
  }

  return stops
}

Page({
  data: {
    status: '待乘车',
    lineName: '',
    startStation: '',
    endStation: '',
    stations: [],
    timelineStops: [],
    segments: [],
    activeIndex: 0,
    busTop: 0,
    timelineHeight: 0,
    finished: false,
    transferStations: []
  },

  onLoad() {
    const stored = wx.getStorageSync('currentRideState')
    const plan = stored?.plan || wx.getStorageSync('currentRidePlan')

    if (!plan?.startStation || !plan?.endStation) {
      wx.showToast({ title: '请先生成乘车方案', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }

    let effectivePlan = plan
    let segments = Array.isArray(plan.segments) ? addSegmentColors(plan.segments) : []
    let stations = Array.isArray(plan.pathStations) ? plan.pathStations : []
    let transferStations = Array.isArray(plan.transferStations) ? plan.transferStations : []

    if (!segments.length || !stations.length) {
      const result = findShortestPath(plan.startStation, plan.endStation)
      if (!result.success) {
        wx.showToast({ title: '未找到可达路径', icon: 'none' })
        wx.navigateBack({ delta: 1 })
        return
      }
      segments = addSegmentColors(result.segments)
      stations = result.pathStations
      transferStations = result.transferStations
      effectivePlan = {
        ...plan,
        lineName: result.lineName,
        eta: result.eta,
        pathStations: stations,
        segments,
        transferStations
      }
    }

    const timelineStops = buildTimelineStops({
      ...effectivePlan,
      segments,
      pathStations: stations
    })
    const currentIndex = Math.min(stored?.currentIndex || 0, Math.max(timelineStops.length - 1, 0))

    this.setData({
      lineName: effectivePlan.lineName || '多线路换乘',
      startStation: effectivePlan.startStation,
      endStation: effectivePlan.endStation,
      status: stored?.status || '乘车中',
      stations,
      timelineStops,
      segments,
      transferStations,
      activeIndex: currentIndex,
      busTop: currentIndex * ROW_HEIGHT + 8,
      timelineHeight: Math.max(timelineStops.length * ROW_HEIGHT + 32, 420),
      finished: Boolean(stored?.finished)
    })

    wx.setStorageSync('currentRidePlan', {
      ...effectivePlan,
      pathStations: stations,
      segments,
      transferStations
    })
    this.saveState()
  },

  onHide() {
    this.saveState()
  },

  onUnload() {
    this.saveState()
  },

  startRide() {
    if (this.data.finished) return
    const nextIndex = Math.min(this.data.activeIndex + 1, Math.max(this.data.timelineStops.length - 1, 0))
    const finished = nextIndex >= this.data.timelineStops.length - 1
    this.setData({
      status: '乘车中',
      activeIndex: nextIndex,
      busTop: nextIndex * ROW_HEIGHT + 8,
      finished
    })
    this.saveState()
    if (finished) {
      wx.removeStorageSync('currentRideState')
      wx.removeStorageSync('currentRidePlan')
    }
  },

  backHome() {
    wx.reLaunch({ url: '/pages/student/home/index' })
  },

  saveState() {
    if (this.data.finished) return
    wx.setStorageSync('currentRideState', {
      status: this.data.status,
      currentIndex: this.data.activeIndex,
      finished: this.data.finished,
      plan: {
        lineName: this.data.lineName,
        startStation: this.data.startStation,
        endStation: this.data.endStation,
        pathStations: this.data.stations,
        segments: this.data.segments,
        transferStations: this.data.transferStations
      }
    })
  }
})