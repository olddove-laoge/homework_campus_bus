const { findShortestPath } = require('../../../utils/mock/route-planner')
const { lines, findBusById, tickLiveSimulation } = require('../../../utils/mock/bus-simulator')
const {
  getRideState,
  saveRideState,
  clearRideState,
  issueBoardingCode,
  completeCurrentSegment,
  updateRideProgress,
  getCurrentSegment
} = require('../../../utils/mock/ride-session-store')

const ROW_HEIGHT = 104
let timer = null

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
        prev.segmentIndex = segmentIndex
        return
      }

      stops.push({
        name: station,
        color: stopColor,
        connectorColor: stopColor,
        segmentName: segment.lineName || '',
        segmentIndex,
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

function getStatusLabel(status, finished) {
  if (finished || status === 'finished') return '行程已结束'
  if (status === 'on_bus') return '乘车中'
  if (status === 'pending_boarding') return '暂未上车'
  return '待乘车'
}

function getCurrentSegmentEndIndex(timelineStops, segmentIndex) {
  let endIndex = 0
  timelineStops.forEach((stop, index) => {
    if (stop.segmentIndex === segmentIndex) {
      endIndex = index
    }
  })
  return endIndex
}

function buildViewModel(rideState) {
  const storedPlan = rideState?.plan || {}
  let effectivePlan = storedPlan
  let segments = Array.isArray(storedPlan.segments) ? addSegmentColors(storedPlan.segments) : []
  let stations = Array.isArray(storedPlan.pathStations) ? storedPlan.pathStations : []
  let transferStations = Array.isArray(storedPlan.transferStations) ? storedPlan.transferStations : []

  if ((!segments.length || !stations.length) && storedPlan.startStation && storedPlan.endStation) {
    const result = findShortestPath(storedPlan.startStation, storedPlan.endStation)
    if (result.success) {
      segments = addSegmentColors(result.segments)
      stations = result.pathStations
      transferStations = result.transferStations
      effectivePlan = {
        ...storedPlan,
        lineName: result.lineName,
        eta: result.eta,
        pathStations: stations,
        segments,
        transferStations
      }
    }
  }

  const timelineStops = buildTimelineStops({
    ...effectivePlan,
    segments,
    pathStations: stations
  })

  const activeIndex = Math.min(rideState?.currentIndex || 0, Math.max(timelineStops.length - 1, 0))
  const currentSegment = getCurrentSegment({ ...rideState, plan: effectivePlan }) || segments[rideState?.currentSegmentIndex || 0] || null
  const currentSegmentEndIndex = currentSegment ? getCurrentSegmentEndIndex(timelineStops, rideState?.currentSegmentIndex || 0) : activeIndex

  return {
    effectivePlan,
    segments,
    stations,
    transferStations,
    timelineStops,
    activeIndex,
    currentSegment,
    currentSegmentEndIndex
  }
}

Page({
  data: {
    status: '暂未上车',
    rideStatusKey: 'pending_boarding',
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
    transferStations: [],
    currentSegmentIndex: 0,
    currentSegmentName: '',
    currentSegmentStart: '',
    currentSegmentEnd: '',
    currentBusName: '',
    currentSegmentEndIndex: 0,
    currentBusStation: ''
  },

  onLoad() {
    this.restoreRideState()
  },

  onShow() {
    this.restoreRideState()
    this.startBusBinding()
  },

  onHide() {
    this.stopBusBinding()
  },

  onUnload() {
    this.stopBusBinding()
  },

  restoreRideState() {
    const rideState = getRideState()
    if (!rideState?.plan?.startStation || !rideState?.plan?.endStation) {
      wx.showToast({ title: '请先生成乘车方案', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }

    const {
      effectivePlan,
      segments,
      stations,
      transferStations,
      timelineStops,
      activeIndex,
      currentSegment,
      currentSegmentEndIndex
    } = buildViewModel(rideState)

    const nextState = {
      ...rideState,
      plan: {
        ...effectivePlan,
        pathStations: stations,
        segments,
        transferStations
      }
    }
    saveRideState(nextState)

    const currentBus = nextState.currentBusId ? findBusById(nextState.currentBusId) : null

    this.setData({
      lineName: effectivePlan.lineName || '多线路换乘',
      startStation: effectivePlan.startStation,
      endStation: effectivePlan.endStation,
      status: getStatusLabel(nextState.status, nextState.finished),
      rideStatusKey: nextState.status,
      stations,
      timelineStops,
      segments,
      transferStations,
      activeIndex,
      busTop: activeIndex * ROW_HEIGHT + 8,
      timelineHeight: Math.max(timelineStops.length * ROW_HEIGHT + 32, 420),
      finished: Boolean(nextState.finished),
      currentSegmentIndex: nextState.currentSegmentIndex || 0,
      currentSegmentName: currentSegment?.lineName || '',
      currentSegmentStart: currentSegment?.stations?.[0] || effectivePlan.startStation,
      currentSegmentEnd: currentSegment?.stations?.[currentSegment.stations.length - 1] || effectivePlan.endStation,
      currentBusName: nextState.currentBusName || '',
      currentSegmentEndIndex,
      currentBusStation: currentBus?.station || ''
    })
  },

  startBusBinding() {
    if (timer) return
    timer = setInterval(() => {
      const rideState = getRideState()
      if (!rideState || rideState.finished || rideState.status !== 'on_bus' || !rideState.currentBusId) return

      tickLiveSimulation(false)
      const currentBus = findBusById(rideState.currentBusId)
      if (!currentBus) return

      this.setData({ currentBusStation: currentBus.station || '' })
      this.syncProgressWithBus(currentBus.station)
    }, 100)
  },

  stopBusBinding() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  },

  syncProgressWithBus(busStation) {
    if (!busStation) return
    const timelineStops = this.data.timelineStops || []
    const currentIndex = this.data.activeIndex || 0
    const segmentEndIndex = this.data.currentSegmentEndIndex || currentIndex

    let matchedIndex = -1
    for (let i = currentIndex; i <= segmentEndIndex; i += 1) {
      if (timelineStops[i] && timelineStops[i].name === busStation) {
        matchedIndex = i
      }
    }

    if (matchedIndex === -1 || matchedIndex === currentIndex) return

    updateRideProgress(matchedIndex)
    this.restoreRideState()

    if (matchedIndex < segmentEndIndex) return

    const result = completeCurrentSegment(busStation)
    if (!result || !result.success) return

    if (result.finished) {
      this.restoreRideState()
      return
    }

    wx.showToast({ title: '已到换乘站，请重新扫码上车', icon: 'none' })
    this.restoreRideState()
  },

  showBoardingCode() {
    const result = issueBoardingCode()
    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/student/boarding-code/index' })
  },

  startRide() {
    const rideState = getRideState()
    if (!rideState || rideState.finished) return
    if (rideState.status !== 'on_bus') {
      wx.showToast({ title: '请先出示乘车码完成上车', icon: 'none' })
      return
    }

    const nextIndex = Math.min(this.data.activeIndex + 1, this.data.currentSegmentEndIndex)
    const updated = updateRideProgress(nextIndex)
    this.restoreRideState()

    if (nextIndex < this.data.currentSegmentEndIndex) return

    const arrivalStation = this.data.timelineStops[nextIndex]?.name || this.data.currentSegmentEnd
    const result = completeCurrentSegment(arrivalStation)
    if (!result || !result.success) return

    if (result.finished) {
      this.restoreRideState()
      return
    }

    wx.showToast({ title: '已到换乘站，请重新扫码上车', icon: 'none' })
    this.restoreRideState()
  },

  endRide() {
    clearRideState()
    wx.removeStorageSync('currentRidePlan')
    wx.reLaunch({ url: '/pages/student/home/index' })
  },

  backHome() {
    wx.reLaunch({ url: '/pages/student/home/index' })
  }
})
