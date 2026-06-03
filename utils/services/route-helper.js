const { getRoutesCache } = require('./transit-data')
const { normalizeStationName } = require('./station-helper')
const { lines } = require('../mock/bus-simulator')

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

function getRouteMap() {
  const cachedRoutes = getRoutesCache()
  if (Array.isArray(cachedRoutes) && cachedRoutes.length) {
    return cachedRoutes.reduce((acc, route) => {
      acc[route._id] = {
        name: route.lineName,
        color: route.color,
        routeNodes: (route.stations || []).map((stationName, index) => ({
          id: `${route._id}-st-${index + 1}`,
          name: stationName,
          isStation: true
        }))
      }
      return acc
    }, {})
  }

  return lines
}

function countStopsToStation(lineId, currentStationName, targetStationName) {
  const routeMap = getRouteMap()
  const line = routeMap[lineId]
  if (!line) return Number.MAX_SAFE_INTEGER

  const nodes = buildLineNodes(line).filter(node => node.isStation !== false)
  const currentIndex = nodes.findIndex(node => normalizeStationName(node.name) === normalizeStationName(currentStationName))
  const targetIndex = nodes.findIndex(node => normalizeStationName(node.name) === normalizeStationName(targetStationName))
  if (currentIndex === -1 || targetIndex === -1) return Number.MAX_SAFE_INTEGER
  if (currentIndex === targetIndex) return 0
  if (targetIndex > currentIndex) return targetIndex - currentIndex
  return nodes.length - currentIndex + targetIndex
}

module.exports = {
  countStopsToStation,
  getRouteMap
}
