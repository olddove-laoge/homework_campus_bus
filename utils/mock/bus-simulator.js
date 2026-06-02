const LIVE_STATE_KEY = 'liveBusSimulationState'

const lines = {
  line1: {
    name: '一号线',
    color: '#2563EBCC',
    stations: [
      { id: 'l1-st1', name: '(北区)西南门站', latitude: 28.681771, longitude: 115.935563 },
      { id: 'l1-st2', name: '(北区)一号门站', latitude: 28.681774, longitude: 115.937272 },
      { id: 'l1-st3', name: '中国银行站', latitude: 28.681674, longitude: 115.941340 },
      { id: 'l1-st4', name: '明华小区站', latitude: 28.681718, longitude: 115.945882 },
      { id: 'l1-st5', name: '青山湖大道站', latitude: 28.681719, longitude: 115.948821 },
      { id: 'l1-st6', name: '(南区)东门站', latitude: 28.678345, longitude: 115.948715 },
      { id: 'l1-st7', name: '青山湖大道(地铁)站', latitude: 28.674380, longitude: 115.948847 },
      { id: 'l1-st8', name: '(南区)南门站', latitude: 28.674341, longitude: 115.944534 },
      { id: 'l1-st9', name: '谢家村(地铁)站', latitude: 28.674293, longitude: 115.940778 },
      { id: 'l1-st10', name: '卫生站站', latitude: 28.677902, longitude: 115.940651 },
      { id: 'l1-st11', name: '上海北路站', latitude: 28.679955, longitude: 115.940609 },
      { id: 'l1-st12', name: '(北区)一号门站(返程)', latitude: 28.681774, longitude: 115.937272 },
      { id: 'l1-st13', name: '(北区)西南门站(终点)', latitude: 28.681771, longitude: 115.935563 }
    ],
    waypoints: [
      { id: 'l1-wp1', name: '途径点', latitude: 28.681697, longitude: 115.940489, isStation: false }
    ]
  },
  line2: {
    name: '二号线',
    color: '#F97316CC',
    routeNodes: [
      { id: 'l2-st1', name: '国威路(地铁)站', latitude: 28.687174, longitude: 115.941528, isStation: true },
      { id: 'l2-wp1', name: '途径点', latitude: 28.687190, longitude: 115.940716, isStation: false },
      { id: 'l2-st2', name: '青湖村公寓站', latitude: 28.688452, longitude: 115.940720, isStation: true },
      { id: 'l2-st3', name: '上海北路北站', latitude: 28.690278, longitude: 115.940747, isStation: true },
      { id: 'l2-wp2', name: '途径点', latitude: 28.690871, longitude: 115.940846, isStation: false },
      { id: 'l2-wp3', name: '途径点', latitude: 28.691886, longitude: 115.941254, isStation: false },
      { id: 'l2-wp4', name: '途径点', latitude: 28.692530, longitude: 115.941666, isStation: false },
      { id: 'l2-st4', name: '青湖大厦站', latitude: 28.692304, longitude: 115.942095, isStation: true },
      { id: 'l2-wp5', name: '途径点', latitude: 28.691516, longitude: 115.943647, isStation: false },
      { id: 'l2-st5', name: '欢乐街站', latitude: 28.691400, longitude: 115.944122, isStation: true },
      { id: 'l2-st6', name: '青湖夜市站', latitude: 28.694105, longitude: 115.944385, isStation: true },
      { id: 'l2-wp6', name: '途径点', latitude: 28.694223, longitude: 115.945087, isStation: false },
      { id: 'l2-st7', name: '南昌中学北门站', latitude: 28.694244, longitude: 115.945702, isStation: true },
      { id: 'l2-st8', name: '青山湖大道站', latitude: 28.693956, longitude: 115.948090, isStation: true },
      { id: 'l2-st9', name: '南昌中学东门站', latitude: 28.692234, longitude: 115.947897, isStation: true },
      { id: 'l2-st10', name: '南昌中学东南门站', latitude: 28.691007, longitude: 115.947663, isStation: true },
      { id: 'l2-wp7', name: '途径点', latitude: 28.690045, longitude: 115.947598, isStation: false },
      { id: 'l2-st11', name: '火炬广场(地铁)站', latitude: 28.687987, longitude: 115.947922, isStation: true },
      { id: 'l2-wp8', name: '途径点', latitude: 28.687285, longitude: 115.944730, isStation: false },
      { id: 'l2-st12', name: '国威路(地铁)站(返程)', latitude: 28.687174, longitude: 115.941528, isStation: true }
    ]
  },
  line3: {
    name: '三号线',
    color: '#22C55ECC',
    routeNodes: [
      { id: 'l3-st1', name: '国威路(地铁)站', latitude: 28.687174, longitude: 115.941528, isStation: true },
      { id: 'l3-wp1', name: '途径点', latitude: 28.687630, longitude: 115.940597, isStation: false },
      { id: 'l3-st2', name: '(北区)二号门站', latitude: 28.682915, longitude: 115.940516, isStation: true },
      { id: 'l3-wp2', name: '途径点', latitude: 28.681799, longitude: 115.940498, isStation: false },
      { id: 'l3-st3', name: '天虹站', latitude: 28.681680, longitude: 115.937267, isStation: true },
      { id: 'l3-st4', name: '农贸市场站', latitude: 28.679086, longitude: 115.937177, isStation: true },
      { id: 'l3-st5', name: '江大南路南站', latitude: 28.676092, longitude: 115.937059, isStation: true },
      { id: 'l3-st6', name: '江西水利电力大学站', latitude: 28.676115, longitude: 115.935497, isStation: true },
      { id: 'l3-wp3', name: '途径点', latitude: 28.675758, longitude: 115.935480, isStation: false },
      { id: 'l3-wp4', name: '途径点', latitude: 28.675680, longitude: 115.933847, isStation: false },
      { id: 'l3-st7', name: '彭家桥(地铁)站', latitude: 28.674355, longitude: 115.933712, isStation: true },
      { id: 'l3-st8', name: '普瑞眼科站', latitude: 28.674385, longitude: 115.936302, isStation: true },
      { id: 'l3-st9', name: '梦时代站', latitude: 28.674406, longitude: 115.940158, isStation: true },
      { id: 'l3-wp5', name: '途径点', latitude: 28.674466, longitude: 115.940494, isStation: false },
      { id: 'l3-wp6', name: '途径点', latitude: 28.674554, longitude: 115.940612, isStation: false },
      { id: 'l3-wp7', name: '途径点', latitude: 28.674687, longitude: 115.940668, isStation: false },
      { id: 'l3-st10', name: '谢家村(地铁)站', latitude: 28.673438, longitude: 115.940641, isStation: true },
      { id: 'l3-st11', name: '工商银行站', latitude: 28.670054, longitude: 115.940669, isStation: true },
      { id: 'l3-st12', name: '520Park站', latitude: 28.667984, longitude: 115.940659, isStation: true },
      { id: 'l3-st13', name: '699文化创意园站', latitude: 28.665918, longitude: 115.940674, isStation: true },
      { id: 'l3-st14', name: '南昌市十七中站', latitude: 28.664742, longitude: 115.940674, isStation: true },
      { id: 'l3-wp8', name: '途径点', latitude: 28.663882, longitude: 115.940670, isStation: false },
      { id: 'l3-wp9', name: '途径点', latitude: 28.662880, longitude: 115.940478, isStation: false },
      { id: 'l3-st15', name: '北京银行站', latitude: 28.662911, longitude: 115.936953, isStation: true },
      { id: 'l3-wp10', name: '途径点', latitude: 28.662930, longitude: 115.935152, isStation: false },
      { id: 'l3-st16', name: '玉河站', latitude: 28.664097, longitude: 115.935120, isStation: true },
      { id: 'l3-wp11', name: '途径点', latitude: 28.665874, longitude: 115.934948, isStation: false },
      { id: 'l3-wp12', name: '途径点', latitude: 28.668595, longitude: 115.934826, isStation: false },
      { id: 'l3-st17', name: '彭桥路站', latitude: 28.668996, longitude: 115.934674, isStation: true },
      { id: 'l3-st18', name: '少春中学站', latitude: 28.669570, longitude: 115.934338, isStation: true },
      { id: 'l3-st19', name: '培英学院站', latitude: 28.670838, longitude: 115.933593, isStation: true },
      { id: 'l3-wp13', name: '途径点', latitude: 28.673985, longitude: 115.931757, isStation: false },
      { id: 'l3-wp14', name: '途径点', latitude: 28.674218, longitude: 115.927759, isStation: false },
      { id: 'l3-st20', name: '金域名都站', latitude: 28.677059, longitude: 115.927373, isStation: true },
      { id: 'l3-st21', name: '体育公园站', latitude: 28.680365, longitude: 115.926874, isStation: true },
      { id: 'l3-st22', name: '湖滨公园站', latitude: 28.684814, longitude: 115.926292, isStation: true },
      { id: 'l3-wp15', name: '途径点', latitude: 28.687925, longitude: 115.926121, isStation: false },
      { id: 'l3-wp16', name: '途径点', latitude: 28.687959, longitude: 115.930139, isStation: false },
      { id: 'l3-wp17', name: '途径点', latitude: 28.687932, longitude: 115.931187, isStation: false },
      { id: 'l3-wp18', name: '途径点', latitude: 28.687124, longitude: 115.936269, isStation: false },
      { id: 'l3-st23', name: '国威路(地铁)站(返程)', latitude: 28.687174, longitude: 115.941528, isStation: true }
    ]
  },
  line4: {
    name: '四号线',
    color: '#A855F7CC',
    routeNodes: [
      { id: 'l4-st1', name: '国威路(地铁)站', latitude: 28.687174, longitude: 115.941528, isStation: true },
      { id: 'l4-wp1', name: '途径点', latitude: 28.687272, longitude: 115.944383, isStation: false },
      { id: 'l4-st2', name: '火炬广场(地铁)站', latitude: 28.688268, longitude: 115.949571, isStation: true },
      { id: 'l4-st3', name: '农业银行站', latitude: 28.688902, longitude: 115.953533, isStation: true },
      { id: 'l4-st4', name: '休闲公园站', latitude: 28.689182, longitude: 115.954733, isStation: true },
      { id: 'l4-st5', name: '梁万(地铁)站', latitude: 28.690271, longitude: 115.960594, isStation: true },
      { id: 'l4-st6', name: '泰豪科技园站', latitude: 28.687647, longitude: 115.960375, isStation: true },
      { id: 'l4-st7', name: '人民政府站', latitude: 28.683378, longitude: 115.960532, isStation: true },
      { id: 'l4-st8', name: '艺术中心站', latitude: 28.680835, longitude: 115.960502, isStation: true },
      { id: 'l4-st9', name: '南洋花园站', latitude: 28.677065, longitude: 115.960495, isStation: true },
      { id: 'l4-st10', name: '万象汇站', latitude: 28.675692, longitude: 115.960417, isStation: true },
      { id: 'l4-st11', name: '高新大道(地铁)站', latitude: 28.674423, longitude: 115.960429, isStation: true },
      { id: 'l4-st12', name: '肿瘤医院站', latitude: 28.674403, longitude: 115.953989, isStation: true },
      { id: 'l4-wp2', name: '途径点', latitude: 28.674394, longitude: 115.952611, isStation: false },
      { id: 'l4-st13', name: '南昌师范学院站', latitude: 28.679183, longitude: 115.952611, isStation: true },
      { id: 'l4-st14', name: '江西管理职业学院站', latitude: 28.680965, longitude: 115.952687, isStation: true },
      { id: 'l4-wp3', name: '途径点', latitude: 28.681801, longitude: 115.952675, isStation: false },
      { id: 'l4-st15', name: '特殊教育学校站', latitude: 28.681809, longitude: 115.952065, isStation: true },
      { id: 'l4-wp4', name: '途径点', latitude: 28.681819, longitude: 115.948801, isStation: false },
      { id: 'l4-st16', name: '公安局站', latitude: 28.681811, longitude: 115.945989, isStation: true },
      { id: 'l4-st17', name: '天御国际站', latitude: 28.681822, longitude: 115.940520, isStation: true },
      { id: 'l4-st18', name: '(北区)二号门站', latitude: 28.682895, longitude: 115.940510, isStation: true },
      { id: 'l4-wp5', name: '途径点', latitude: 28.687139, longitude: 115.940681, isStation: false },
      { id: 'l4-st19', name: '国威路(地铁)站(返程)', latitude: 28.687174, longitude: 115.941528, isStation: true }
    ]
  }
}

const buses = [
  { id: 'S1', name: '校巴1号', lineId: 'line1', direction: 'forward', seats: '26/40', load: 65, temp: 24, offset: 0, speed: 0.12 },
  { id: 'S2', name: '校巴2号', lineId: 'line1', direction: 'backward', seats: '18/40', load: 45, temp: 23, offset: 78, speed: 0.11 },
  { id: 'S3', name: '校巴3号', lineId: 'line2', direction: 'forward', seats: '14/40', load: 35, temp: 23, offset: 24, speed: 0.1 },
  { id: 'S4', name: '校巴4号', lineId: 'line2', direction: 'backward', seats: '22/40', load: 55, temp: 24, offset: 126, speed: 0.09 },
  { id: 'S5', name: '校巴5号', lineId: 'line3', direction: 'forward', seats: '20/40', load: 50, temp: 24, offset: 48, speed: 0.1 },
  { id: 'S6', name: '校巴6号', lineId: 'line3', direction: 'backward', seats: '12/40', load: 30, temp: 22, offset: 196, speed: 0.11 },
  { id: 'S7', name: '校巴7号', lineId: 'line4', direction: 'forward', seats: '31/40', load: 78, temp: 25, offset: 132, speed: 0.14 },
  { id: 'S8', name: '校巴8号', lineId: 'line4', direction: 'backward', seats: '16/40', load: 40, temp: 23, offset: 228, speed: 0.12 }
]

const segmentCount = 12
const tickMs = 100
const dwellMs = 10 * 1000
const dwellTicks = Math.round(dwellMs / tickMs)

function buildRouteNodes(line) {
  return [
    ...line.stations.slice(0, -1).map(item => ({ ...item, isStation: true })),
    ...line.waypoints,
    line.stations[line.stations.length - 1]
  ].map(node => ({ ...node, isStation: node.isStation !== false }))
}

function interpolateRoute(nodes, count) {
  const route = []
  for (let i = 0; i < nodes.length; i += 1) {
    const start = nodes[i]
    const end = nodes[(i + 1) % nodes.length]
    for (let s = 0; s < count; s += 1) {
      const t = s / count
      route.push({
        latitude: Number((start.latitude + (end.latitude - start.latitude) * t).toFixed(6)),
        longitude: Number((start.longitude + (end.longitude - start.longitude) * t).toFixed(6))
      })
    }
  }
  return route
}

function normalizePointIndex(pointIndex, totalPoints) {
  const normalized = pointIndex % totalPoints
  return normalized < 0 ? normalized + totalPoints : normalized
}

function getNodeIndex(pointIndex) {
  return Math.floor(pointIndex / segmentCount)
}

function isAtNodeAnchor(pointIndex) {
  return Math.abs(pointIndex % segmentCount) < 0.0001
}

function getReachedStationNodeIndex(prevIndex, nextIndex, routeNodes, totalPoints) {
  const normalizedPrev = normalizePointIndex(prevIndex, totalPoints)
  const normalizedNext = normalizePointIndex(nextIndex, totalPoints)
  const wrapped = normalizedNext < normalizedPrev

  for (let nodeIndex = 0; nodeIndex < routeNodes.length; nodeIndex += 1) {
    if (!routeNodes[nodeIndex].isStation) continue
    const anchor = nodeIndex * segmentCount
    const crossed = wrapped
      ? anchor > normalizedPrev || anchor <= normalizedNext
      : anchor > normalizedPrev && anchor <= normalizedNext

    if (crossed) {
      return { nodeIndex, anchor }
    }
  }

  return null
}

function getNextStationNodeIndex(routeNodes, pointIndex) {
  const currentNodeIndex = getNodeIndex(pointIndex) % routeNodes.length
  const startOffset = isAtNodeAnchor(pointIndex) ? 0 : 1
  for (let offset = startOffset; offset < routeNodes.length + startOffset; offset += 1) {
    const nodeIndex = (currentNodeIndex + offset) % routeNodes.length
    const node = routeNodes[nodeIndex]
    if (node.isStation) {
      return nodeIndex
    }
  }
  return 0
}

function formatEta(seconds) {
  const mins = Math.max(1, Math.ceil(seconds / 60))
  return `${mins} 分钟`
}

function estimateEtaMinutes(routeNodes, routePoints, pointIndex, speed, dwellLeftTicks = 0) {
  const currentNodeIndex = getNodeIndex(pointIndex) % routeNodes.length
  const atNodeAnchor = isAtNodeAnchor(pointIndex)
  let nextStationNodeIndex = currentNodeIndex

  if (!(atNodeAnchor && routeNodes[currentNodeIndex] && routeNodes[currentNodeIndex].isStation)) {
    nextStationNodeIndex = getNextStationNodeIndex(routeNodes, pointIndex)
  }

  const targetPointIndex = nextStationNodeIndex * segmentCount
  const total = routePoints.length
  const normalizedPointIndex = normalizePointIndex(pointIndex, total)
  const diff = targetPointIndex >= normalizedPointIndex
    ? targetPointIndex - normalizedPointIndex
    : total - normalizedPointIndex + targetPointIndex
  const pointsPerSecond = speed * (1000 / tickMs)
  const travelSeconds = pointsPerSecond > 0 ? diff / pointsPerSecond : 0
  const dwellSeconds = Math.max(0, dwellLeftTicks) * tickMs / 1000
  return formatEta(travelSeconds + dwellSeconds)
}

function buildStationMarkers(stations, baseId, showLabel = false) {
  return stations.map((station, idx) => ({
    id: baseId + idx,
    latitude: station.latitude,
    longitude: station.longitude,
    width: 20,
    height: 20,
    label: showLabel
      ? {
          content: station.name,
          color: '#334155',
          fontSize: 11,
          borderRadius: 8,
          bgColor: '#ffffff',
          padding: 6,
          textAlign: 'center'
        }
      : null
  }))
}

function getPointPosition(routePoints, pointIndex) {
  const total = routePoints.length
  const normalizedIndex = normalizePointIndex(pointIndex, total)
  const baseIndex = Math.floor(normalizedIndex)
  const nextIndex = (baseIndex + 1) % total
  const progress = normalizedIndex - baseIndex
  const current = routePoints[baseIndex]
  const next = routePoints[nextIndex]

  return {
    latitude: Number((current.latitude + (next.latitude - current.latitude) * progress).toFixed(6)),
    longitude: Number((current.longitude + (next.longitude - current.longitude) * progress).toFixed(6))
  }
}

function buildBusMarkers(routePoints, busStates, baseId) {
  return busStates.map((bus, idx) => {
    const position = getPointPosition(routePoints, bus.index)
    return {
      id: baseId + idx,
      latitude: position.latitude,
      longitude: position.longitude,
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
    }
  })
}

function buildMarkers(linesState, busesState, showStationLabel = false) {
  return [
    ...buildStationMarkers(linesState.line1.routeNodes.filter(node => node.isStation), 1000, showStationLabel),
    ...buildStationMarkers(linesState.line2.routeNodes.filter(node => node.isStation), 2000, showStationLabel),
    ...buildStationMarkers(linesState.line3.routeNodes.filter(node => node.isStation), 3000, showStationLabel),
    ...buildStationMarkers(linesState.line4.routeNodes.filter(node => node.isStation), 4000, showStationLabel),
    ...buildBusMarkers(linesState.line1.routePoints, busesState.filter(bus => bus.lineId === 'line1'), 10),
    ...buildBusMarkers(linesState.line2.routePoints, busesState.filter(bus => bus.lineId === 'line2'), 20),
    ...buildBusMarkers(linesState.line3.routePoints, busesState.filter(bus => bus.lineId === 'line3'), 30),
    ...buildBusMarkers(linesState.line4.routePoints, busesState.filter(bus => bus.lineId === 'line4'), 40)
  ]
}

function createLineState(lineId) {
  const line = lines[lineId] || lines.line1
  const routeNodes = line.routeNodes || buildRouteNodes(line)
  const routePoints = interpolateRoute(routeNodes, segmentCount)

  const busStates = buses
    .filter(bus => bus.lineId === lineId)
    .map(bus => {
      const index = normalizePointIndex(bus.offset, routePoints.length)
      const currentNodeIndex = getNodeIndex(index) % routeNodes.length
      const atStation = isAtNodeAnchor(index) && Boolean(routeNodes[currentNodeIndex] && routeNodes[currentNodeIndex].isStation)
      const dwellLeftTicks = atStation ? dwellTicks : 0
      const stationNodeIndex = atStation ? currentNodeIndex : getNextStationNodeIndex(routeNodes, index)
      return {
        ...bus,
        index,
        dwellLeftTicks,
        station: routeNodes[stationNodeIndex].name,
        eta: estimateEtaMinutes(routeNodes, routePoints, index, bus.speed, dwellLeftTicks)
      }
    })

  return {
    lineId,
    lineName: line.name,
    lineColor: line.color,
    routeNodes,
    routePoints,
    busStates
  }
}

const lineStates = {
  line1: createLineState('line1'),
  line2: createLineState('line2'),
  line3: createLineState('line3'),
  line4: createLineState('line4')
}

function buildInitialState(showStationLabel = false) {
  const line1 = lineStates.line1
  const line2 = lineStates.line2
  const line3 = lineStates.line3
  const line4 = lineStates.line4
  const busStates = [...line1.busStates, ...line2.busStates, ...line3.busStates, ...line4.busStates]
  const linesState = {
    line1: { name: line1.lineName, color: line1.lineColor, routePoints: line1.routePoints, routeNodes: line1.routeNodes },
    line2: { name: line2.lineName, color: line2.lineColor, routePoints: line2.routePoints, routeNodes: line2.routeNodes },
    line3: { name: line3.lineName, color: line3.lineColor, routePoints: line3.routePoints, routeNodes: line3.routeNodes },
    line4: { name: line4.lineName, color: line4.lineColor, routePoints: line4.routePoints, routeNodes: line4.routeNodes }
  }

  return {
    lines: linesState,
    buses: busStates,
    markers: buildMarkers(linesState, busStates, showStationLabel),
    polyline: [
      { points: line1.routePoints, color: line1.lineColor, width: 5, dottedLine: false },
      { points: line2.routePoints, color: line2.lineColor, width: 5, dottedLine: false },
      { points: line3.routePoints, color: line3.lineColor, width: 5, dottedLine: false },
      { points: line4.routePoints, color: line4.lineColor, width: 5, dottedLine: false }
    ],
    center: { lat: 28.6878, lng: 115.9435 }
  }
}

function nextState(prevBuses, prevLines, showStationLabel = false) {
  const line1 = prevLines?.line1 || lineStates.line1
  const line2 = prevLines?.line2 || lineStates.line2
  const line3 = prevLines?.line3 || lineStates.line3
  const line4 = prevLines?.line4 || lineStates.line4

  const busesNext = prevBuses.map(bus => {
    const line = bus.lineId === 'line2' ? line2 : bus.lineId === 'line3' ? line3 : bus.lineId === 'line4' ? line4 : line1
    const currentNodeIndex = getNodeIndex(bus.index) % line.routeNodes.length
    const atStation = isAtNodeAnchor(bus.index) && Boolean(line.routeNodes[currentNodeIndex] && line.routeNodes[currentNodeIndex].isStation)

    if (atStation && (bus.dwellLeftTicks || 0) > 0) {
      const dwellLeftTicks = bus.dwellLeftTicks - 1
      return {
        ...bus,
        dwellLeftTicks,
        station: line.routeNodes[currentNodeIndex].name,
        eta: estimateEtaMinutes(line.routeNodes, line.routePoints, bus.index, bus.speed, dwellLeftTicks)
      }
    }

    const nextIndex = normalizePointIndex(bus.index + bus.speed, line.routePoints.length)
    const reachedStation = getReachedStationNodeIndex(bus.index, nextIndex, line.routeNodes, line.routePoints.length)
    const actualIndex = reachedStation ? reachedStation.anchor : nextIndex
    const nextNodeIndex = getNodeIndex(actualIndex) % line.routeNodes.length
    const nextAtStation = Boolean(reachedStation) || (isAtNodeAnchor(actualIndex) && Boolean(line.routeNodes[nextNodeIndex] && line.routeNodes[nextNodeIndex].isStation))
    const dwellLeftTicks = nextAtStation ? dwellTicks : 0
    const stationNodeIndex = nextAtStation ? nextNodeIndex : getNextStationNodeIndex(line.routeNodes, actualIndex)

    return {
      ...bus,
      index: actualIndex,
      dwellLeftTicks,
      station: line.routeNodes[stationNodeIndex].name,
      eta: estimateEtaMinutes(line.routeNodes, line.routePoints, actualIndex, bus.speed, dwellLeftTicks)
    }
  })

  const linesState = { line1, line2, line3, line4 }

  return {
    buses: busesNext,
    markers: buildMarkers(linesState, busesNext, showStationLabel)
  }
}

function buildMarkersForState(busesState, linesState, showStationLabel = false) {
  const line1 = linesState?.line1 || lineStates.line1
  const line2 = linesState?.line2 || lineStates.line2
  const line3 = linesState?.line3 || lineStates.line3
  const line4 = linesState?.line4 || lineStates.line4

  return buildMarkers({ line1, line2, line3, line4 }, busesState, showStationLabel)
}

function getLiveSimulationState(showStationLabel = false) {
  const stored = wx.getStorageSync(LIVE_STATE_KEY)
  if (stored && stored.lines && stored.buses && stored.buses.length === buses.length) {
    return {
      ...stored,
      markers: buildMarkersForState(stored.buses, stored.lines, showStationLabel)
    }
  }

  const initial = buildInitialState(showStationLabel)
  wx.setStorageSync(LIVE_STATE_KEY, {
    lines: initial.lines,
    buses: initial.buses,
    polyline: initial.polyline,
    center: initial.center
  })
  return initial
}

function tickLiveSimulation(showStationLabel = false) {
  const current = getLiveSimulationState(showStationLabel)
  const next = nextState(current.buses, current.lines, showStationLabel)
  const liveState = {
    lines: current.lines,
    buses: next.buses,
    polyline: current.polyline,
    center: current.center
  }
  wx.setStorageSync(LIVE_STATE_KEY, liveState)
  return {
    ...liveState,
    markers: buildMarkersForState(liveState.buses, liveState.lines, showStationLabel)
  }
}

function findBusById(busId) {
  if (!busId) return null
  const current = getLiveSimulationState(false)
  return (current.buses || []).find(bus => bus.id === busId) || null
}

module.exports = {
  lines,
  buildInitialState,
  nextState,
  buildMarkersForState,
  getLiveSimulationState,
  tickLiveSimulation,
  findBusById
}
