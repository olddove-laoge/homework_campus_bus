const { getLiveSimulationState, tickLiveSimulation } = require('../../../utils/mock/bus-simulator')
const { getStations } = require('../../../utils/services/transit-data')
const { DEFAULT_STATION, normalizeStationName, mapStationDocs, getNearestStationName } = require('../../../utils/services/station-helper')
const { countStopsToStation } = require('../../../utils/services/route-helper')

let timer = null

function getUpcomingBuses(stationName, buses) {
  const normalizedTarget = normalizeStationName(stationName)
  return (buses || [])
    .map(bus => ({
      ...bus,
      stopsAway: countStopsToStation(bus.lineId, bus.station, normalizedTarget)
    }))
    .filter(Boolean)
    .sort((a, b) => a.stopsAway - b.stopsAway)
}

Page({
  data: {
    currentStationName: DEFAULT_STATION,
    nextBusName: '--',
    nextBusEta: '--',
    upcomingBuses: [],
    stationDocs: []
  },

  onLoad() {
    this.refreshEtaView()
    getStations().then(stations => {
      this.setData({ stationDocs: mapStationDocs(stations) }, () => this.initNearestStation())
    }).catch(() => {
      this.setData({ stationDocs: [] }, () => this.initNearestStation())
    })
  },

  onShow() {
    this.startPolling()
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  startPolling() {
    if (timer) return
    timer = setInterval(() => {
      tickLiveSimulation(false)
      this.refreshEtaView()
    }, 100)
  },

  stopPolling() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  },

  initNearestStation() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        this.setData({
          currentStationName: getNearestStationName(this.data.stationDocs, { latitude: res.latitude, longitude: res.longitude })
        }, () => this.refreshEtaView())
      },
      fail: () => {
        this.setData({
          currentStationName: DEFAULT_STATION
        }, () => this.refreshEtaView())
      }
    })
  },

  refreshEtaView() {
    const state = getLiveSimulationState(false)
    const upcomingBuses = getUpcomingBuses(this.data.currentStationName, state.buses)
    const nextBus = upcomingBuses[0]

    this.setData({
      nextBusName: nextBus?.name || '--',
      nextBusEta: nextBus?.eta || '--',
      upcomingBuses: upcomingBuses.slice(1, 4)
    })
  }
})
