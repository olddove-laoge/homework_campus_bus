let genQrcode = null
try {
  genQrcode = require('@fourdim/wechat-miniapp-qrcode')
} catch (error) {
  genQrcode = null
}
const { getRideState, issueBoardingCode, getLatestBoardingCodeText } = require('../../../utils/mock/ride-session-store')

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
    const result = issueBoardingCode()
    const state = result.success ? result.state : getRideState()
    const payload = result.success ? result.payload : state?.boardCode
    const codeText = result.success ? result.codeText : getLatestBoardingCodeText()

    if (!payload || !codeText) {
      wx.showToast({ title: '暂无可用乘车码', icon: 'none' })
      return
    }

    this.setData({
      codeText,
      lineName: payload.lineName || '',
      startStation: payload.startStation || '',
      endStation: payload.endStation || '',
      segmentIndex: Number(payload.segmentIndex || 0) + 1,
      issuedAtText: new Date(payload.issuedAt).toLocaleString()
    }, () => this.renderCode())
  }
})
