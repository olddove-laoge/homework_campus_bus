const { lines } = require('./bus-simulator')
const { getRoutesCache, getStationsCache } = require('../services/transit-data')

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

function geoDistance(a, b) {
  const dx = (a.latitude - b.latitude) * 111000
  const dy = (a.longitude - b.longitude) * 85000
  return Math.sqrt(dx * dx + dy * dy)
}

function routeDistance(nodes, startIndex, endIndex) {
  let total = 0
  for (let i = startIndex; i < endIndex; i += 1) {
    total += geoDistance(nodes[i], nodes[i + 1])
  }
  return total
}

function buildSegmentDirection(lineId, stations = []) {
  if (!stations.length) return 'forward'

  const routeMap = getRouteSource()
  const line = routeMap[lineId]
  if (!line) return 'forward'

  const stationNodes = buildLineNodes(line).filter(node => node.isStation !== false)
  const first = normalizeStationName(stations[0])
  const last = normalizeStationName(stations[stations.length - 1])
  const startIndex = stationNodes.findIndex(node => normalizeStationName(node.name) === first)
  const endIndex = stationNodes.findIndex(node => normalizeStationName(node.name) === last)

  if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) {
    return 'forward'
  }

  return endIndex > startIndex ? 'forward' : 'backward'
}

function getStationMap() {
  const stationDocs = getStationsCache()
  return (stationDocs || []).reduce((acc, item) => {
    acc[item.stationName] = item
    ;(item.aliases || []).forEach(alias => {
      acc[alias] = item
    })
    return acc
  }, {})
}

function getRouteSource() {
  const cloudRoutes = getRoutesCache()
  if (Array.isArray(cloudRoutes) && cloudRoutes.length) {
    const stationMap = getStationMap()
    return cloudRoutes.reduce((acc, route) => {
      acc[route._id] = {
        name: route.lineName,
        color: route.color,
        routeNodes: (route.stations || []).map((stationName, index) => {
          const station = stationMap[stationName] || {}
          return {
            id: `${route._id}-st-${index + 1}`,
            name: stationName,
            latitude: station.latitude || 0,
            longitude: station.longitude || 0,
            isStation: true
          }
        })
      }
      return acc
    }, {})
  }

  return lines
}

function buildStationGraph() {
  const graph = new Map()
  const registry = new Map()

  const addEdge = (from, edge) => {
    if (!graph.has(from)) graph.set(from, [])
    graph.get(from).push(edge)
  }

  Object.entries(getRouteSource()).forEach(([lineId, line]) => {
    const nodes = buildLineNodes(line)
    const stationIndexes = nodes
      .map((node, index) => (node.isStation === false ? -1 : index))
      .filter(index => index !== -1)

    stationIndexes.forEach(index => {
      const node = nodes[index]
      const key = normalizeStationName(node.name)
      if (key && !registry.has(key)) {
        registry.set(key, {
          name: key,
          latitude: node.latitude,
          longitude: node.longitude
        })
      }
    })

    for (let i = 0; i < stationIndexes.length - 1; i += 1) {
      const fromIndex = stationIndexes[i]
      const toIndex = stationIndexes[i + 1]
      const fromNode = nodes[fromIndex]
      const toNode = nodes[toIndex]
      const from = normalizeStationName(fromNode.name)
      const to = normalizeStationName(toNode.name)

      if (!from || !to || from === to) continue

      const distance = routeDistance(nodes, fromIndex, toIndex)
      const edge = { to, distance, lineId, lineName: line.name }
      addEdge(from, edge)
      addEdge(to, { ...edge, to: from })
    }
  })

  return { graph, registry }
}

const cachedGraph = buildStationGraph()

function dijkstra(start, end) {
  const { graph } = cachedGraph
  const dist = new Map([[start, 0]])
  const prev = new Map()
  const visited = new Set()

  while (true) {
    let current = null
    let currentDist = Infinity

    for (const [node, value] of dist.entries()) {
      if (visited.has(node)) continue
      if (value < currentDist) {
        current = node
        currentDist = value
      }
    }

    if (!current) break
    if (current === end) break

    visited.add(current)

    for (const edge of graph.get(current) || []) {
      const nextDist = currentDist + edge.distance
      if (nextDist < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nextDist)
        prev.set(edge.to, { prev: current, edge })
      }
    }
  }

  if (!dist.has(end)) return null

  const pathStations = []
  const pathEdges = []
  let cursor = end

  pathStations.unshift(cursor)
  while (cursor !== start) {
    const step = prev.get(cursor)
    if (!step) return null
    pathEdges.unshift({ from: step.prev, to: cursor, ...step.edge })
    cursor = step.prev
    pathStations.unshift(cursor)
  }

  const segments = []
  pathEdges.forEach(edge => {
    const last = segments[segments.length - 1]
    if (!last || last.lineId !== edge.lineId) {
      segments.push({
        lineId: edge.lineId,
        lineName: edge.lineName,
        stations: [edge.from, edge.to],
        distance: edge.distance,
        direction: buildSegmentDirection(edge.lineId, [edge.from, edge.to])
      })
    } else {
      last.stations.push(edge.to)
      last.distance += edge.distance
      last.direction = buildSegmentDirection(last.lineId, last.stations)
    }
  })

  const transferStations = []
  pathEdges.forEach((edge, index) => {
    const next = pathEdges[index + 1]
    if (next && next.lineId !== edge.lineId) {
      transferStations.push(pathStations[index + 1])
    }
  })

  const totalDistance = pathEdges.reduce((sum, edge) => sum + edge.distance, 0)
  const eta = `${Math.max(1, Math.round(totalDistance / 300))} 分钟`

  return {
    success: true,
    startStation: start,
    endStation: end,
    pathStations,
    pathEdges,
    segments,
    transferStations,
    lineName: segments.length === 1 ? segments[0].lineName : '多线路换乘',
    eta,
    totalDistance: Math.round(totalDistance)
  }
}

function findShortestPath(startStation, endStation) {
  const start = normalizeStationName(startStation)
  const end = normalizeStationName(endStation)

  if (!start || !end) {
    return { success: false, reason: '起终点为空' }
  }

  if (start === end) {
    return {
      success: true,
      startStation: start,
      endStation: end,
      pathStations: [start],
      pathEdges: [],
      segments: [],
      transferStations: [],
      lineName: '同站点',
      eta: '0 分钟',
      totalDistance: 0
    }
  }

  const { graph, registry } = cachedGraph
  if (!graph.has(start) || !graph.has(end) || !registry.has(start) || !registry.has(end)) {
    return { success: false, reason: '起点或终点不存在于线路图中' }
  }

  return dijkstra(start, end) || { success: false, reason: '未找到可达路径' }
}

module.exports = {
  buildLineNodes,
  findShortestPath,
  normalizeStationName
}
