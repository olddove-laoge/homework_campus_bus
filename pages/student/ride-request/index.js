const { lines } = require('../../../utils/mock/bus-simulator')

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

function getAllStations() {
  return Object.values(lines).flatMap(line => buildLineNodes(line).filter(node => node.isStation !== false))
}

function distance(a, b) {
  const dx = (a.latitude - b.latitude) * 111000
  const dy = (a.longitude - b.longitude) * 85000
  return Math.sqrt(dx * dx + dy * dy)
}

Page({
  data: {
    useGps: true,
    gpsText: '定位中...',
    locationGranted: false,
    startStation: '',
    endStation: '',
    allStations: [],
    startCandidates: [],
    endCandidates: []
  },

  onLoad() {
    wx.removeStorageSync('rideDraft')
    const allStations = getAllStations()
    const uniqueStations = []
    const seen = {}

    allStations.forEach(item => {
      if (!item || !item.name || seen[item.name]) return
      seen[item.name] = true
      uniqueStations.push(item)
    })

    this.setData({
      allStations: uniqueStations,
      endCandidates: uniqueStations.map(item => item.name)
    })
    this.requestLocation()
  },

  requestLocation() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userLocation']) {
          this.setData({ locationGranted: true })
          this.initGps()
          return
        }
        wx.authorize({
          scope: 'scope.userLocation',
          success: () => {
            this.setData({ locationGranted: true })
            this.initGps()
          },
          fail: () => {
            this.setData({
              locationGranted: false,
              gpsText: '未授权定位，请手动选择起点',
              startStation: '',
              startCandidates: this.data.allStations.map(item => item.name)
            })
          }
        })
      },
      fail: () => {
        this.setData({
          locationGranted: false,
          gpsText: '无法获取授权状态，请手动选择起点',
          startStation: '',
          startCandidates: this.data.allStations.map(item => item.name)
        })
      }
    })
  },

  initGps() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        const allStations = getAllStations()
        const sorted = allStations
          .map(station => ({
            ...station,
            dist: distance({ latitude: res.latitude, longitude: res.longitude }, station)
          }))
          .sort((a, b) => a.dist - b.dist)
        const nearest = sorted.slice(0, 5)
        this.setData({
          gpsText: `已定位：${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`,
          startStation: nearest[0]?.name || '',
          startCandidates: nearest.map(item => item.name)
        })
      },
      fail: () => {
        this.setData({
          gpsText: '定位失败，请手动选择起点',
          startStation: '',
          startCandidates: this.data.allStations.map(item => item.name)
        })
      }
    })
  },

  useGps() {
    this.setData({ useGps: true })
    this.requestLocation()
  },

  chooseManual() {
    const allNames = this.data.allStations.map(item => item.name)
    this.setData({
      useGps: false,
      startStation: '',
      startCandidates: allNames
    })
  },

  pickStart(e) {
    this.setData({ startStation: e.currentTarget.dataset.name, useGps: false })
  },

  pickEnd(e) {
    this.setData({ endStation: e.currentTarget.dataset.name })
  },

  chooseEnd() {
    if (!this.data.startStation || !this.data.endStation) {
      wx.showToast({ title: '请先选择起点和终点', icon: 'none' })
      return
    }

    wx.setStorageSync('rideDraft', {
      startStation: this.data.startStation,
      endStation: this.data.endStation,
      gpsText: this.data.gpsText
    })
    wx.navigateTo({ url: '/pages/student/route-result/index' })
  }
})