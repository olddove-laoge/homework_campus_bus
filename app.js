// app.js
const { getBuses } = require('./utils/services/master-data')
const { getRoutes, getStations } = require('./utils/services/transit-data')

App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'bus-d1gselciv9be32b3c'
      })
      getBuses().catch(() => {})
      getRoutes().catch(() => {})
      getStations().catch(() => {})
    }
  }
})
