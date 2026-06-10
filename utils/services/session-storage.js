function getAuth() {
  return wx.getStorageSync('auth') || null
}

function getUserScopeKey(baseKey, userId) {
  return `${baseKey}_${userId}`
}

function getCurrentUserId() {
  const auth = getAuth()
  return auth && auth.userId ? auth.userId : ''
}

function setScopedValue(baseKey, value, userId = getCurrentUserId()) {
  if (!userId) return value
  wx.setStorageSync(getUserScopeKey(baseKey, userId), value)
  return value
}

function getScopedValue(baseKey, userId = getCurrentUserId()) {
  if (!userId) return null
  return wx.getStorageSync(getUserScopeKey(baseKey, userId)) || null
}

function removeScopedValue(baseKey, userId = getCurrentUserId()) {
  if (!userId) return
  wx.removeStorageSync(getUserScopeKey(baseKey, userId))
}

function getRideState(userId) {
  return getScopedValue('currentRideState', userId)
}

function setRideState(value, userId) {
  return setScopedValue('currentRideState', value, userId)
}

function removeRideState(userId) {
  removeScopedValue('currentRideState', userId)
}

function getRidePlan(userId) {
  return getScopedValue('currentRidePlan', userId)
}

function setRidePlan(value, userId) {
  return setScopedValue('currentRidePlan', value, userId)
}

function removeRidePlan(userId) {
  removeScopedValue('currentRidePlan', userId)
}

function getLatestBoardingCode(userId) {
  return getScopedValue('latestBoardingCode', userId)
}

function setLatestBoardingCode(value, userId) {
  return setScopedValue('latestBoardingCode', value, userId)
}

function removeLatestBoardingCode(userId) {
  removeScopedValue('latestBoardingCode', userId)
}

module.exports = {
  getAuth,
  getCurrentUserId,
  getRideState,
  setRideState,
  removeRideState,
  getRidePlan,
  setRidePlan,
  removeRidePlan,
  getLatestBoardingCode,
  setLatestBoardingCode,
  removeLatestBoardingCode
}
