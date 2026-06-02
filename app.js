// app.js
App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'bus-d1gselciv9be32b3c'
      })
    }
  }
})
