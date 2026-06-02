function callRideFunction(action, data = {}) {
  return wx.cloud.callFunction({
    name: 'rideSession',
    data: {
      action,
      ...data
    }
  }).then(res => res.result || {})
}

function createRideSession(plan) {
  return callRideFunction('createRideSession', { plan })
}

function getRideState(rideId) {
  return callRideFunction('getRideState', { rideId })
}

function issueBoardingCode(rideId) {
  return callRideFunction('issueBoardingCode', { rideId })
}

function bindRideToBus(codeText, driverBus) {
  return callRideFunction('bindRideToBus', {
    codeText,
    driverBus
  })
}

function completeSegment(rideId, arrivalStation) {
  return callRideFunction('completeSegment', {
    rideId,
    arrivalStation
  })
}

function updateRideProgress(rideId, currentIndex) {
  return callRideFunction('updateRideProgress', {
    rideId,
    currentIndex
  })
}

module.exports = {
  createRideSession,
  getRideState,
  issueBoardingCode,
  bindRideToBus,
  completeSegment,
  updateRideProgress
}
