const { findShortestPath } = require('../../../utils/mock/route-planner')
const { lines, findBusById, tickLiveSimulation, getLiveSimulationState } = require('../../../utils/mock/bus-simulator')
const {
  getRideState,
  saveRideState,
  clearRideState,
  getCurrentSegment
} = require('../../../utils/mock/ride-session-store')
const {
  getRideState: fetchRideState,
  issueBoardingCode,
  completeSegment,
  updateRideProgress
} = require('../../../utils/services/ride-cloud')

const ROW_HEIGHT = 104
const SEGMENT_COUNT = 12
let timer = null

function colorForLineName(lineName) {
  const line = Object.values(lines).find(item => item.name === lineName)
  return line?.color || '#2563EBCC'
}

function normalizeStationName(name) {
  return String(name || '')
    .replace(/\s*\((返程|终点)\)$/, '')
    .trim()
}

function buildLineNodes(line) {
  if (Array.isArray(line.routeNodes) && line.routeNodes.length) {
    return line.routeNodes
  }

  const stations = line.stations || []
  const waypoints = line.waypoints || []
  return [
    ...stations.slice(0, -1).map(item => ({ ...item, isStation: true })),
    ...waypoints,
    stations[stations.length - 1]
  ].filter(Boolean)
}

function pickTargetStationIndex(routeNodes, stationName, direction) {
  const matched = routeNodes
    .map((node, index) => ({ node, index }))
    .filter(item => item.node.isStation !== false && normalizeStationName(item.node.name) === normalizeStationName(stationName))

  if (!matched.length) return -1
  return direction === 'backward' ? matched[matched.length - 1].index : matched[0].index
}

function countStopsToTarget(routeNodes, currentNodeIndex, targetNodeIndex) {
  if (currentNodeIndex === targetNodeIndex) return 0
  let count = 0
  let index = currentNodeIndex
  let guard = 0

  while (index !== targetNodeIndex && guard < routeNodes.length * 2) {
    index = (index + 1) % routeNodes.length
    if (routeNodes[index] && routeNodes[index].isStation !== false) {
      count += 1
    }
    guard += 1
  }

  return count
}

function getWaitingBusInfo(segment, buses = []) {
  if (!segment || !segment.lineId || !segment.stations || !segment.stations.length) return null
  const line = lines[segment.lineId]
  if (!line) return null

  const routeNodes = buildLineNodes(line)
  const targetStation = segment.stations[0]
  const targetNodeIndex = pickTargetStationIndex(routeNodes, targetStation, segment.direction)
  if (targetNodeIndex === -1) return null

  const targetPointIndex = targetNodeIndex * SEGMENT_COUNT
  const candidates = buses
    .filter(bus => bus.lineId === segment.lineId && (!segment.direction || bus.direction === segment.direction))
    .map(bus => {
      const currentNodeIndex = Math.floor(bus.index / SEGMENT_COUNT) % routeNodes.length
      const arrived = Math.abs(bus.index - targetPointIndex) < 0.0001 && (bus.dwellLeftTicks || 0) > 0
      return {
        ...bus,
        arrived,
        stopsAway: arrived ? 0 : countStopsToTarget(routeNodes, currentNodeIndex, targetNodeIndex)
      }
    })
    .sort((a, b) => a.stopsAway - b.stopsAway)

  return candidates[0] || null
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
  const cachedPlan = wx.getStorageSync('currentRidePlan') || {}
  const ridePlan = rideState?.plan || {}
  const storedPlan = cachedPlan.startStation && cachedPlan.endStation
    ? {
        ...ridePlan,
        ...cachedPlan
      }
    : {
        ...cachedPlan,
        ...ridePlan
      }
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
    currentSegmentDirection: '',
    currentBusName: '',
    currentSegmentEndIndex: 0,
    currentBusStation: '',
    waitingBusName: '',
    waitingBusStops: 0,
    waitingBusArrived: false
  },

  onLoad() {
    this.restoreRideState()
  },

  onShow() {
    this.restoreRideState(true)
    this.startBusBinding()
  },

  onHide() {
    this.stopBusBinding()
  },

  onUnload() {
    this.stopBusBinding()
  },

  restoreRideState(syncCloud = false) {
    const localRideState = getRideState()
    const cachedPlan = wx.getStorageSync('currentRidePlan') || {}
    const hasPlan = (localRideState?.plan?.startStation && localRideState?.plan?.endStation)
      || (cachedPlan.startStation && cachedPlan.endStation)

    if (!hasPlan) {
      wx.showToast({ title: '请先生成乘车方案', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }

    const applyState = rideState => {
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

      const normalizedPlan = {
        ...effectivePlan,
        pathStations: stations,
        segments,
        transferStations
      }
      const nextState = {
        ...rideState,
        plan: normalizedPlan
      }
      if (normalizedPlan.startStation && normalizedPlan.endStation) {
        wx.setStorageSync('currentRidePlan', normalizedPlan)
      }
      saveRideState(nextState)

      const currentBus = nextState.currentBusId ? findBusById(nextState.currentBusId) : null
      const waitingBus = nextState.status === 'pending_boarding' ? getWaitingBusInfo(currentSegment, getLiveSimulationState(false).buses || []) : null

      this.setData({
        lineName: normalizedPlan.lineName || '多线路换乘',
        startStation: normalizedPlan.startStation || '',
        endStation: normalizedPlan.endStation || '',
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
        currentSegmentStart: currentSegment?.stations?.[0] || normalizedPlan.startStation || '',
        currentSegmentEnd: currentSegment?.stations?.[currentSegment.stations.length - 1] || normalizedPlan.endStation || '',
        currentSegmentDirection: currentSegment?.direction || '',
        currentBusName: nextState.currentBusName || '',
        currentSegmentEndIndex,
        currentBusStation: currentBus?.station || '',
        waitingBusName: waitingBus?.name || '',
        waitingBusStops: waitingBus?.stopsAway || 0,
        waitingBusArrived: Boolean(waitingBus?.arrived)
      })
    }

    const safeLocalRideState = hasPlan ? {
      ...(localRideState || {}),
      plan: {
        ...cachedPlan,
        ...((localRideState && localRideState.plan) || {})
      }
    } : localRideState

    applyState(safeLocalRideState)
    if (!syncCloud) {
      return
    }

    const rideId = safeLocalRideState.rideId || safeLocalRideState._id
    fetchRideState(rideId).then(result => {
      if (!result.success || !result.state) {
        return
      }
      applyState({
        ...safeLocalRideState,
        ...result.state,
        plan: {
          ...cachedPlan,
          ...((result.state && result.state.plan) || {})
        }
      })
    }).catch(() => {})
  },

  startBusBinding() {
    if (timer) return
    timer = setInterval(() => {
      const rideState = getRideState()
      if (!rideState || rideState.finished) return

      const liveState = tickLiveSimulation(false)

      if (rideState.status === 'pending_boarding') {
        const currentSegment = getCurrentSegment(rideState)
        const waitingBus = getWaitingBusInfo(currentSegment, liveState.buses || [])
        this.setData({
          waitingBusName: waitingBus?.name || '',
          waitingBusStops: waitingBus?.stopsAway || 0,
          waitingBusArrived: Boolean(waitingBus?.arrived)
        })
        return
      }

      if (rideState.status !== 'on_bus' || !rideState.currentBusId) return

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

    const rideState = getRideState()
    const rideId = rideState && (rideState.rideId || rideState._id)
    if (!rideId) return

    updateRideProgress(rideId, matchedIndex).then(progressResult => {
      if (progressResult.success && progressResult.state) {
        saveRideState(progressResult.state)
      }
      this.restoreRideState()

      if (matchedIndex < segmentEndIndex) return

      completeSegment(rideId, busStation).then(result => {
        if (!result || !result.success) return
        if (result.state) {
          saveRideState(result.state)
        }
        if (result.finished) {
          this.restoreRideState()
          return
        }

        wx.showToast({ title: '已到换乘站，请重新扫码上车', icon: 'none' })
        this.restoreRideState(true)
      })
    })
  },

  showBoardingCode() {
    wx.navigateTo({ url: '/pages/student/boarding-code/index' })
  },

  startRide() {
    const rideState = getRideState()
    if (!rideState || rideState.finished) return
    if (rideState.status !== 'on_bus') {
      wx.showToast({ title: '请先出示乘车码完成上车', icon: 'none' })
      return
    }

    const rideId = rideState.rideId || rideState._id
    const nextIndex = Math.min(this.data.activeIndex + 1, this.data.currentSegmentEndIndex)

    updateRideProgress(rideId, nextIndex).then(progressResult => {
      if (progressResult.success && progressResult.state) {
        saveRideState(progressResult.state)
      }
      this.restoreRideState()

      if (nextIndex < this.data.currentSegmentEndIndex) return

      const arrivalStation = this.data.timelineStops[nextIndex]?.name || this.data.currentSegmentEnd
      completeSegment(rideId, arrivalStation).then(result => {
        if (!result || !result.success) return
        if (result.state) {
          saveRideState(result.state)
        }
        if (result.finished) {
          this.restoreRideState(true)
          return
        }

        wx.showToast({ title: '已到换乘站，请重新扫码上车', icon: 'none' })
        this.restoreRideState(true)
      })
    })
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
