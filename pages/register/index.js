const { registerStudent } = require('../../utils/services/master-data')

Page({
  data: {
    username: '',
    password: '',
    displayName: ''
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value.trim() })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value.trim() })
  },

  onDisplayNameInput(e) {
    this.setData({ displayName: e.detail.value.trim() })
  },

  handleRegister() {
    const { username, password, displayName } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }

    registerStudent(username, password, displayName).then(result => {
      if (!result.success) {
        wx.showToast({ title: result.message || '注册失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '注册成功', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 400)
    }).catch(() => {
      wx.showToast({ title: '注册失败，请检查云数据库', icon: 'none' })
    })
  }
})
