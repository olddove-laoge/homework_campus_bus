const { getBusesCache } = require('../services/master-data')
const {
  getRideState,
  setRideState,
  removeRideState,
  getRidePlan,
  setRidePlan,
  removeRidePlan,
  getLatestBoardingCode,
  setLatestBoardingCode,
  removeLatestBoardingCode
} = require('../services/session-storage')

const BOARDING_CODE_MAP_KEY = 'boardingCodePayloadMap'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getBoardingCodeMap() {
  return wx.getStorageSync(BOARDING_CODE_MAP_KEY) || {}
}

function saveBoardingCodeMap(map) {
  wx.setStorageSync(BOARDING_CODE_MAP_KEY, map)
  return map
}

function saveRideState(state) {
  return setRideState(state)
}

function clearRideState() {
  removeRideState()
  removeRidePlan()
  removeLatestBoardingCode()
  wx.removeStorageSync(BOARDING_CODE_MAP_KEY)
}

function getDriverBuses() {
  const cachedBuses = getBusesCache()
  if (Array.isArray(cachedBuses) && cachedBuses.length) {
    return cachedBuses.map(bus => ({
      busId: bus._id,
      busName: bus.busName,
      lineId: bus.lineId,
      lineName: bus.lineName,
      direction: bus.direction
    }))
  }

  return []
}

function getCurrentSegment(state) {
  if (!state || !state.plan || !Array.isArray(state.plan.segments)) return null
  return state.plan.segments[state.currentSegmentIndex] || null
}

function createRideSession(plan) {
  const rideId = `ride_${Date.now()}`
  const segmentBindings = (plan.segments || []).map((segment, index) => ({
    segmentIndex: index,
    lineId: segment.lineId,
    lineName: segment.lineName,
    busId: null,
    busName: '',
    boardedAt: null,
    alightedAt: null,
    status: 'pending'
  }))

  const state = {
    rideId,
    status: 'pending_boarding',
    currentSegmentIndex: 0,
    currentIndex: 0,
    finished: false,
    currentBusId: null,
    currentBusName: '',
    boardCode: null,
    segmentBindings,
    plan: clone(plan)
  }

  saveRideState(state)
  return state
}

function issueBoardingCode() {
  const state = getRideState()
  if (!state || state.finished) {
    return { success: false, message: '当前没有可用行程' }
  }

  if (state.status !== 'pending_boarding') {
    return { success: false, message: '当前不是待上车状态' }
  }

  const segment = getCurrentSegment(state)
  if (!segment) {
    return { success: false, message: '当前行程段不存在' }
  }

  const token = `BUS-${Date.now().toString(36)}-${state.currentSegmentIndex}`
  const payload = {
    rideId: state.rideId,
    segmentIndex: state.currentSegmentIndex,
    lineId: segment.lineId,
    lineName: segment.lineName,
    startStation: segment.stations[0],
    endStation: segment.stations[segment.stations.length - 1],
    issuedAt: Date.now(),
    token
  }

  const nextState = {
    ...state,
    boardCode: payload
  }

  const codeMap = getBoardingCodeMap()
  codeMap[token] = payload
  saveBoardingCodeMap(codeMap)
  saveRideState(nextState)
  wx.setStorageSync(LATEST_BOARDING_CODE_KEY, token)
  return { success: true, payload, state: nextState, codeText: token }
}

function getLatestBoardingCodeText() {
  return wx.getStorageSync(LATEST_BOARDING_CODE_KEY) || ''
}

function parseBoardingCode(codeText) {
  if (!codeText) return null
  if (typeof codeText !== 'string') return codeText

  const codeMap = getBoardingCodeMap()
  if (codeMap[codeText]) {
    return codeMap[codeText]
  }

  try {
    return JSON.parse(codeText)
  } catch (error) {
    return null
  }
}

function bindRideToBus(codeText, driverBus) {
  const payload = parseBoardingCode(codeText)
  if (!payload) {
    return { success: false, message: '乘车码无效' }
  }

  const state = getRideState()
  if (!state || state.finished) {
    return { success: false, message: '当前没有待乘车行程' }
  }

  if (state.status !== 'pending_boarding') {
    return { success: false, message: '当前行程不处于待上车状态' }
  }

  if (payload.rideId !== state.rideId || payload.segmentIndex !== state.currentSegmentIndex) {
    return { success: false, message: '乘车码与当前行程段不匹配' }
  }

  const segment = getCurrentSegment(state)
  if (!segment) {
    return { success: false, message: '当前行程段不存在' }
  }

  if (payload.lineId !== segment.lineId) {
    return { success: false, message: '乘车码线路校验失败' }
  }

  if (!driverBus || driverBus.lineId !== segment.lineId) {
    return { success: false, message: '该乘车码不属于当前车辆线路' }
  }

  if (segment.direction && driverBus.direction && segment.direction !== driverBus.direction) {
    return { success: false, message: '当前车辆行驶方向不匹配' }
  }

  const segmentBindings = state.segmentBindings.map(binding => {
    if (binding.segmentIndex !== state.currentSegmentIndex) return binding
    return {
      ...binding,
      busId: driverBus.busId,
      busName: driverBus.busName,
      boardedAt: segment.stations[0],
      status: 'active'
    }
  })

  const nextState = {
    ...state,
    status: 'on_bus',
    currentBusId: driverBus.busId,
    currentBusName: driverBus.busName,
    boardCode: payload,
    segmentBindings
  }

  saveRideState(nextState)
  return { success: true, state: nextState }
}

function completeCurrentSegment(arrivalStation) {
  const state = getRideState()
  if (!state) {
    return { success: false, message: '当前没有行程状态' }
  }

  const segment = getCurrentSegment(state)
  if (!segment) {
    return { success: false, message: '当前行程段不存在' }
  }

  const segmentBindings = state.segmentBindings.map(binding => {
    if (binding.segmentIndex !== state.currentSegmentIndex) return binding
    return {
      ...binding,
      alightedAt: arrivalStation,
      status: 'completed'
    }
  })

  const lastSegmentIndex = (state.plan.segments || []).length - 1
  if (state.currentSegmentIndex >= lastSegmentIndex) {
    const nextState = {
      ...state,
      status: 'finished',
      currentBusId: null,
      currentBusName: '',
      boardCode: null,
      finished: true,
      segmentBindings
    }
    saveRideState(nextState)
    return { success: true, state: nextState, finished: true }
  }

  const nextState = {
    ...state,
    status: 'pending_boarding',
    currentSegmentIndex: state.currentSegmentIndex + 1,
    currentIndex: state.currentIndex,
    currentBusId: null,
    currentBusName: '',
    boardCode: null,
    segmentBindings
  }

  saveRideState(nextState)
  return { success: true, state: nextState, finished: false }
}

function updateRideProgress(currentIndex) {
  const state = getRideState()
  if (!state) return null
  const nextState = {
    ...state,
    currentIndex
  }
  saveRideState(nextState)
  return nextState
}

module.exports = {
  createRideSession,
  getRideState,
  saveRideState,
  clearRideState,
  getCurrentSegment,
  issueBoardingCode,
  getLatestBoardingCodeText,
  parseBoardingCode,
  bindRideToBus,
  completeCurrentSegment,
  updateRideProgress,
  getDriverBuses
}
