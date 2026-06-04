const { getStations, getStationsCache, saveStationsCache } = require('../../../utils/services/transit-data')

function distance(a, b) {
  const dx = (a.latitude - b.latitude) * 111000
  const dy = (a.longitude - b.longitude) * 85000
  return Math.sqrt(dx * dx + dy * dy)
}

function dedupeStations(stations = []) {
  const seen = new Set()
  return stations.filter(item => {
    const name = item && item.name
    if (!name || seen.has(name)) return false
    seen.add(name)
    return true
  })
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

    const applyStations = stations => {
      const allStations = dedupeStations((stations || []).map(item => ({
        id: item._id,
        name: item.stationName,
        latitude: item.latitude,
        longitude: item.longitude
      })))

      this.setData({
        allStations,
        endCandidates: allStations
      })
      this.requestLocation()
    }

    const cachedStations = getStationsCache()
    if (cachedStations.length) {
      applyStations(cachedStations)
    }

    getStations().then(stations => {
      saveStationsCache(stations)
      applyStations(stations)
    }).catch(() => {
      if (cachedStations.length) return
      wx.showToast({ title: '站点数据加载失败', icon: 'none' })
    })
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
              startCandidates: this.data.allStations
            })
          }
        })
      },
      fail: () => {
        this.setData({
          locationGranted: false,
          gpsText: '无法获取授权状态，请手动选择起点',
          startStation: '',
          startCandidates: this.data.allStations
        })
      }
    })
  },

  initGps() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        const allStations = this.data.allStations || []
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
          startCandidates: nearest
        })
      },
      fail: () => {
        this.setData({
          gpsText: '定位失败，请手动选择起点',
          startStation: '',
          startCandidates: this.data.allStations
        })
      }
    })
  },

  useGps() {
    this.setData({ useGps: true })
    this.requestLocation()
  },

  chooseManual() {
    const allNames = this.data.allStations
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