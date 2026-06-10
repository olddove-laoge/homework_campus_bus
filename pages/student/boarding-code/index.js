let genQrcode = null
let timer = null
try {
  genQrcode = require('@fourdim/wechat-miniapp-qrcode')
} catch (error) {
  genQrcode = null
}
const { issueBoardingCode, getRideState } = require('../../../utils/services/ride-cloud')
const { getRideState: getLocalRideState, setRideState } = require('../../../utils/services/session-storage')

Page({
  data: {
    codeText: '',
    lineName: '',
    startStation: '',
    endStation: '',
    segmentIndex: 0,
    issuedAtText: '',
    qrReady: false,
    qrError: ''
  },

  onLoad() {
    this.refreshCode()
  },

  onShow() {
    this.refreshCode()
    this.startPollingState()
  },

  onHide() {
    this.stopPollingState()
  },

  onUnload() {
    this.stopPollingState()
  },

  startPollingState() {
    if (timer) return
    timer = setInterval(() => {
      const rideState = getLocalRideState() || {}
      const rideId = rideState.rideId || rideState._id || rideState.boardCode?.rideId || ''
      if (!rideId) return

      getRideState(rideId).then(result => {
        if (!result.success || !result.state) return
        setRideState(result.state)
        this.setData({
          qrError: result.state.lastError || ''
        })
      }).catch(() => {})
    }, 1000)
  },

  stopPollingState() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  },

  renderCode() {
    const text = this.data.codeText
    if (!text) return

    if (!genQrcode) {
      this.setData({
        qrReady: false,
        qrError: '二维码模块未加载，请先在微信开发者工具中执行“构建 npm”。'
      })
      return
    }

    const query = this.createSelectorQuery()
    query.select('#boardingQrcode').fields({ node: true, size: true }).exec(res => {
      const canvas = res && res[0] && res[0].node
      if (!canvas) {
        this.setData({
          qrReady: false,
          qrError: '二维码画布未初始化，请重新进入当前页面。'
        })
        return
      }

      try {
        genQrcode(canvas, {
          text,
          size: 240,
          fill: '#0f172a',
          back: '#ffffff',
          ecLevel: 'M',
          quiet: 2,
          rounded: 8
        })
        this.setData({ qrReady: true, qrError: '' })
      } catch (error) {
        this.setData({
          qrReady: false,
          qrError: '二维码渲染失败，请先构建 npm 后再试。'
        })
      }
    })
  },

  refreshCode() {
    const rideState = getLocalRideState() || {}
    const rideId = rideState.rideId || rideState._id || rideState.boardCode?.rideId || ''
    if (!rideId) {
      this.setData({ qrError: '未找到当前行程标识，请先重新生成乘车方案。' })
      wx.showToast({ title: '暂无可用乘车码', icon: 'none' })
      return
    }

    issueBoardingCode(rideId).then(result => {
      if (!result.success) {
        this.setData({ qrError: result.message || '生成乘车码失败' })
        wx.showToast({ title: result.message || '生成乘车码失败', icon: 'none' })
        return
      }

      const payload = result.payload
      const codeText = result.codeText
      setRideState(result.state)

      this.setData({
        qrError: result.state?.lastError || '',
        codeText,
        lineName: payload.lineName || '',
        startStation: payload.startStation || '',
        endStation: payload.endStation || '',
        segmentIndex: Number(payload.segmentIndex || 0) + 1,
        issuedAtText: new Date(payload.issuedAt).toLocaleString()
      }, () => this.renderCode())
    }).catch(error => {
      const message = error && error.errMsg ? error.errMsg : '生成乘车码失败'
      this.setData({ qrError: message })
      wx.showToast({ title: '生成乘车码失败', icon: 'none' })
    })
  }
})
