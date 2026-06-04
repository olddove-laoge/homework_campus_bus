const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const COLLECTION_RIDES = 'ride_sessions'
const COLLECTION_CODES = 'boarding_codes'
const COLLECTION_SEATS = 'ride_seats'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function buildBindings(plan) {
  return (plan.segments || []).map((segment, index) => ({
    segmentIndex: index,
    lineId: segment.lineId,
    lineName: segment.lineName,
    busId: null,
    busName: '',
    boardedAt: null,
    alightedAt: null,
    status: 'pending'
  }))
}

async function getRideById(rideId) {
  const res = await db.collection(COLLECTION_RIDES).doc(rideId).get()
  return res.data || null
}

async function createRideSession(event) {
  const now = Date.now()
  const plan = clone(event.plan || {})
  const ride = {
    status: 'pending_boarding',
    currentSegmentIndex: 0,
    currentIndex: 0,
    finished: false,
    currentBusId: null,
    currentBusName: '',
    boardCode: null,
    segmentBindings: buildBindings(plan),
    plan,
    createdAt: now,
    updatedAt: now
  }
  const res = await db.collection(COLLECTION_RIDES).add({ data: ride })
  return { success: true, rideId: res._id, state: { ...ride, rideId: res._id } }
}

async function getRideState(event) {
  const ride = await getRideById(event.rideId)
  if (!ride) return { success: false, message: '行程不存在' }
  return { success: true, state: { ...ride, rideId: ride._id } }
}

async function issueBoardingCode(event) {
  const ride = await getRideById(event.rideId)
  if (!ride || ride.finished) return { success: false, message: '当前没有可用行程' }
  if (ride.status !== 'pending_boarding') return { success: false, message: '当前不是待上车状态' }

  const segment = (ride.plan?.segments || [])[ride.currentSegmentIndex]
  if (!segment) return { success: false, message: '当前行程段不存在' }

  const now = Date.now()
  const token = `BUS-${now.toString(36)}-${ride.currentSegmentIndex}`
  const payload = {
    rideId: ride._id,
    segmentIndex: ride.currentSegmentIndex,
    lineId: segment.lineId,
    lineName: segment.lineName,
    startStation: segment.stations[0],
    endStation: segment.stations[segment.stations.length - 1],
    issuedAt: now,
    token,
    status: 'unused',
    expireAt: now + 5 * 60 * 1000
  }

  await db.collection(COLLECTION_CODES).add({ data: payload })
  await db.collection(COLLECTION_RIDES).doc(ride._id).update({
    data: {
      boardCode: _.set(payload),
      updatedAt: now
    }
  })

  const latestRide = await getRideById(ride._id)
  return {
    success: true,
    payload,
    codeText: token,
    state: { ...latestRide, rideId: latestRide._id }
  }
}

async function bindRideToBus(event) {
  const codeText = event.codeText
  const driverBus = event.driverBus
  const reject = async (rideId, message) => {
    if (rideId) {
      await db.collection(COLLECTION_RIDES).doc(rideId).update({
        data: {
          lastError: message,
          updatedAt: Date.now()
        }
      })
      const latestRide = await getRideById(rideId)
      return { success: false, message, state: { ...latestRide, rideId: latestRide._id } }
    }
    return { success: false, message }
  }

  if (!codeText) return reject('', '乘车码无效')

  const codeRes = await db.collection(COLLECTION_CODES).where({ token: codeText }).orderBy('issuedAt', 'desc').limit(1).get()
  const payload = codeRes.data && codeRes.data[0]
  if (!payload) return reject('', '乘车码无效')
  if (payload.status !== 'unused') return reject(payload.rideId, '乘车码已使用')
  if (payload.expireAt < Date.now()) return reject(payload.rideId, '乘车码已过期')

  const ride = await getRideById(payload.rideId)
  if (!ride || ride.finished) return reject(payload.rideId, '当前没有待乘车行程')
  if (ride.status !== 'pending_boarding') return reject(ride._id, '当前行程不处于待上车状态')
  if (payload.segmentIndex !== ride.currentSegmentIndex) return reject(ride._id, '乘车码与当前行程段不匹配')

  const segment = (ride.plan?.segments || [])[ride.currentSegmentIndex]
  if (!segment) return reject(ride._id, '当前行程段不存在')
  if (payload.lineId !== segment.lineId) return reject(ride._id, '乘车码线路校验失败')
  if (!driverBus || driverBus.lineId !== segment.lineId) return reject(ride._id, '该乘车码不属于当前车辆线路')
  if (segment.direction && driverBus.direction && segment.direction !== driverBus.direction) {
    return reject(ride._id, '当前车辆行驶方向不匹配')
  }

  const segmentBindings = (ride.segmentBindings || []).map(binding => {
    if (binding.segmentIndex !== ride.currentSegmentIndex) return binding
    return {
      ...binding,
      busId: driverBus.busId,
      busName: driverBus.busName,
      boardedAt: segment.stations[0],
      status: 'active'
    }
  })

  const now = Date.now()
  await db.collection(COLLECTION_CODES).doc(payload._id).update({
    data: {
      status: 'used'
    }
  })
  await db.collection(COLLECTION_RIDES).doc(ride._id).update({
    data: {
      status: 'on_bus',
      currentBusId: driverBus.busId,
      currentBusName: driverBus.busName,
      boardCode: _.set(payload),
      segmentBindings: _.set(segmentBindings),
      lastError: _.remove(),
      updatedAt: now
    }
  })

  const latestRide = await getRideById(ride._id)
  return { success: true, state: { ...latestRide, rideId: latestRide._id } }
}

async function updateRideProgress(event) {
  const ride = await getRideById(event.rideId)
  if (!ride) return { success: false, message: '行程不存在' }
  await db.collection(COLLECTION_RIDES).doc(ride._id).update({
    data: {
      currentIndex: event.currentIndex,
      updatedAt: Date.now()
    }
  })
  const latestRide = await getRideById(ride._id)
  return { success: true, state: { ...latestRide, rideId: latestRide._id } }
}

function buildDefaultSeats(busId) {
  const presetOccupied = {
    S1: ['1B', '2C', '3D', '4B'],
    S2: ['1A', '2D', '3B'],
    S3: ['1C', '2B', '4D'],
    S4: ['1D', '2A', '3C', '4A'],
    S5: ['2A', '2D', '3A'],
    S6: ['1B', '3D', '4C'],
    S7: ['1A', '2B', '3C', '4D'],
    S8: ['1D', '2C', '3B']
  }

  const occupiedSet = new Set(presetOccupied[busId] || [])
  const seats = []
  const rows = ['1', '2', '3', '4']
  const cols = ['A', 'B', 'C', 'D']
  rows.forEach(row => cols.forEach(col => {
    const seatNo = `${row}${col}`
    seats.push({
      seatNo,
      status: occupiedSet.has(seatNo) ? 'occupied' : 'free',
      occupantRideId: '',
      occupantUserId: ''
    })
  }))
  return seats
}

async function getBusSeats(event) {
  const busId = event.busId
  if (!busId) return { success: false, message: '车辆不存在' }

  const seatRes = await db.collection(COLLECTION_SEATS).where({ busId }).limit(1).get()
  const found = seatRes.data && seatRes.data[0]
  if (found) {
    return { success: true, seatMap: found }
  }

  const created = {
    busId,
    seats: buildDefaultSeats(busId),
    updatedAt: Date.now()
  }
  const addRes = await db.collection(COLLECTION_SEATS).add({ data: created })
  return { success: true, seatMap: { ...created, _id: addRes._id } }
}

async function selectSeat(event) {
  const ride = await getRideById(event.rideId)
  if (!ride || ride.status !== 'on_bus' || !ride.currentBusId) {
    return { success: false, message: '仅乘车中可选座' }
  }

  const seatNo = event.seatNo
  if (!seatNo) return { success: false, message: '座位不存在' }

  const seatRes = await db.collection(COLLECTION_SEATS).where({ busId: ride.currentBusId }).limit(1).get()
  const seatMap = seatRes.data && seatRes.data[0]
  if (!seatMap) return { success: false, message: '座位数据不存在' }

  const seats = (seatMap.seats || []).map(seat => {
    if (seat.occupantRideId === ride._id) {
      return { ...seat, status: 'free', occupantRideId: '', occupantUserId: '' }
    }
    return seat
  })

  const targetIndex = seats.findIndex(seat => seat.seatNo === seatNo)
  if (targetIndex === -1) return { success: false, message: '座位不存在' }
  if (seats[targetIndex].status === 'occupied' && seats[targetIndex].occupantRideId !== ride._id) {
    return { success: false, message: '该座位已被占用' }
  }

  seats[targetIndex] = {
    ...seats[targetIndex],
    status: 'mine',
    occupantRideId: ride._id,
    occupantUserId: ride.userId || ''
  }

  await db.collection(COLLECTION_SEATS).doc(seatMap._id).update({
    data: {
      seats: _.set(seats),
      updatedAt: Date.now()
    }
  })

  return { success: true, seats }
}

async function releaseRideSeats(ride, now) {
  if (!ride.currentBusId) return

  const seatRes = await db.collection(COLLECTION_SEATS).where({ busId: ride.currentBusId }).limit(1).get()
  const seatMap = seatRes.data && seatRes.data[0]
  if (!seatMap) return

  const releasedSeats = (seatMap.seats || []).map(seat => seat.occupantRideId === ride._id
    ? { ...seat, status: 'free', occupantRideId: '', occupantUserId: '' }
    : seat)
  await db.collection(COLLECTION_SEATS).doc(seatMap._id).update({
    data: {
      seats: _.set(releasedSeats),
      updatedAt: now
    }
  })
}

async function cancelRide(event) {
  const ride = await getRideById(event.rideId)
  if (!ride) return { success: false, message: '当前没有行程状态' }

  const now = Date.now()
  await releaseRideSeats(ride, now)
  await db.collection(COLLECTION_RIDES).doc(ride._id).update({
    data: {
      status: 'cancelled',
      currentBusId: null,
      currentBusName: '',
      boardCode: _.remove(),
      finished: true,
      updatedAt: now
    }
  })
  const latestRide = await getRideById(ride._id)
  return { success: true, state: { ...latestRide, rideId: latestRide._id } }
}

async function completeSegment(event) {
  const ride = await getRideById(event.rideId)
  if (!ride) return { success: false, message: '当前没有行程状态' }

  const segment = (ride.plan?.segments || [])[ride.currentSegmentIndex]
  if (!segment) return { success: false, message: '当前行程段不存在' }

  const segmentBindings = (ride.segmentBindings || []).map(binding => {
    if (binding.segmentIndex !== ride.currentSegmentIndex) return binding
    return {
      ...binding,
      alightedAt: event.arrivalStation,
      status: 'completed'
    }
  })

  const lastSegmentIndex = (ride.plan?.segments || []).length - 1
  const now = Date.now()

  await releaseRideSeats(ride, now)

  if (ride.currentSegmentIndex >= lastSegmentIndex) {
    await db.collection(COLLECTION_RIDES).doc(ride._id).update({
      data: {
        status: 'finished',
        currentBusId: null,
        currentBusName: '',
        boardCode: _.remove(),
        finished: true,
        segmentBindings: _.set(segmentBindings),
        updatedAt: now
      }
    })
    const latestRide = await getRideById(ride._id)
    return { success: true, finished: true, state: { ...latestRide, rideId: latestRide._id } }
  }

  await db.collection(COLLECTION_RIDES).doc(ride._id).update({
    data: {
      status: 'pending_boarding',
      currentSegmentIndex: ride.currentSegmentIndex + 1,
      currentBusId: null,
      currentBusName: '',
      boardCode: _.remove(),
      segmentBindings: _.set(segmentBindings),
      updatedAt: now
    }
  })
  const latestRide = await getRideById(ride._id)
  return { success: true, finished: false, state: { ...latestRide, rideId: latestRide._id } }
}

exports.main = async (event) => {
  const action = event.action

  switch (action) {
    case 'createRideSession':
      return createRideSession(event)
    case 'getRideState':
      return getRideState(event)
    case 'issueBoardingCode':
      return issueBoardingCode(event)
    case 'bindRideToBus':
      return bindRideToBus(event)
    case 'getBusSeats':
      return getBusSeats(event)
    case 'selectSeat':
      return selectSeat(event)
    case 'updateRideProgress':
      return updateRideProgress(event)
    case 'cancelRide':
      return cancelRide(event)
    case 'completeSegment':
      return completeSegment(event)
    default:
      return { success: false, message: '未知操作' }
  }
}
