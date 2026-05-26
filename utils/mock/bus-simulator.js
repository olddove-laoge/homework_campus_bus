const stations = [
  { id: 'st1', name: '(北区)西南门站', latitude: 28.681771, longitude: 115.935563 },
  { id: 'st2', name: '(北区)一号门站', latitude: 28.681774, longitude: 115.937272 },
  { id: 'st3', name: '中国银行站', latitude: 28.681674, longitude: 115.941340 },
  { id: 'st4', name: '明华小区站', latitude: 28.681718, longitude: 115.945882 },
  { id: 'st5', name: '青山湖大道站', latitude: 28.681719, longitude: 115.948821 },
  { id: 'st6', name: '(南区)东门站', latitude: 28.678345, longitude: 115.948715 },
  { id: 'st7', name: '青山湖大道(地铁)站', latitude: 28.674380, longitude: 115.948847 },
  { id: 'st8', name: '(南区)南门站', latitude: 28.674341, longitude: 115.944534 },
  { id: 'st9', name: '谢家村(地铁)站', latitude: 28.674293, longitude: 115.940778 },
  { id: 'st10', name: '卫生站站', latitude: 28.677902, longitude: 115.940651 },
  { id: 'st11', name: '上海北路站', latitude: 28.679955, longitude: 115.940609 },
  { id: 'wp1', name: '途径点', latitude: 28.681697, longitude: 115.940489 },
  { id: 'st12', name: '(北区)一号门站(返程)', latitude: 28.681774, longitude: 115.937272 },
  { id: 'st13', name: '(北区)西南门站(终点)', latitude: 28.681771, longitude: 115.935563 }
]

const buses = [
  { id: 'S1', name: '校巴1号', seats: '26/40', load: 65, temp: 24, offset: 0, step: 1 },
  { id: 'S2', name: '校巴2号', seats: '14/40', load: 35, temp: 23, offset: 18, step: 1 },
  { id: 'S3', name: '校巴3号', seats: '31/40', load: 78, temp: 25, offset: 36, step: 2 }
]

function interpolateRoute(points, segmentCount) {
  const route = []
  for (let i = 0; i < points.length; i += 1) {
    const start = points[i]
    const end = points[(i + 1) % points.length]
    for (let s = 0; s < segmentCount; s += 1) {
      const t = s / segmentCount
      route.push({
        latitude: Number((start.latitude + (end.latitude - start.latitude) * t).toFixed(6)),
        longitude: Number((start.longitude + (end.longitude - start.longitude) * t).toFixed(6))
      })
    }
  }
  return route
}

const routePoints = interpolateRoute(stations, 12)

function estimateEtaMinutes(index, stationIndex) {
  const stationPointIndex = stationIndex * 12
  const total = routePoints.length
  const diff = stationPointIndex >= index ? stationPointIndex - index : total - index + stationPointIndex
  const seconds = diff * 1.2
  const mins = Math.max(1, Math.ceil(seconds / 60))
  return `${mins} 分钟`
}

function buildStationMarkers() {
  return stations.map((station, idx) => ({
    id: 1000 + idx,
    latitude: station.latitude,
    longitude: station.longitude,
    width: 20,
    height: 20,
    callout: {
      content: station.name,
      color: '#334155',
      fontSize: 11,
      borderRadius: 8,
      padding: 6,
      display: 'BYCLICK'
    }
  }))
}

function buildInitialState() {
  const busStates = buses.map(bus => {
    const index = bus.offset % routePoints.length
    return {
      ...bus,
      index,
      station: stations[Math.floor(index / 12) % stations.length].name,
      eta: estimateEtaMinutes(index, 3)
    }
  })

  const markers = [
    ...buildStationMarkers(),
    ...busStates.map((bus, idx) => ({
      id: idx + 1,
      latitude: routePoints[bus.index].latitude,
      longitude: routePoints[bus.index].longitude,
      width: 30,
      height: 30,
      callout: {
        content: `${bus.name}`,
        color: '#1e3a8a',
        fontSize: 11,
        borderRadius: 8,
        padding: 6,
        display: 'ALWAYS'
      }
    }))
  ]

  return {
    buses: busStates,
    markers,
    polyline: [{
      points: routePoints,
      color: '#2563EBCC',
      width: 5,
      dottedLine: false
    }],
    center: {
      lat: routePoints[0].latitude,
      lng: routePoints[0].longitude
    }
  }
}

function nextState(prevBuses) {
  const busesNext = prevBuses.map(bus => {
    const nextIndex = (bus.index + bus.step) % routePoints.length
    const station = stations[Math.floor(nextIndex / 12) % stations.length].name
    return {
      ...bus,
      index: nextIndex,
      station,
      eta: estimateEtaMinutes(nextIndex, 3)
    }
  })

  const markers = [
    ...buildStationMarkers(),
    ...busesNext.map((bus, idx) => ({
      id: idx + 1,
      latitude: routePoints[bus.index].latitude,
      longitude: routePoints[bus.index].longitude,
      width: 30,
      height: 30,
      callout: {
        content: `${bus.name}`,
        color: '#1e3a8a',
        fontSize: 11,
        borderRadius: 8,
        padding: 6,
        display: 'ALWAYS'
      }
    }))
  ]

  return {
    buses: busesNext,
    markers,
    center: {
      lat: routePoints[busesNext[0].index].latitude,
      lng: routePoints[busesNext[0].index].longitude
    }
  }
}

module.exports = {
  stations,
  buildInitialState,
  nextState
}
