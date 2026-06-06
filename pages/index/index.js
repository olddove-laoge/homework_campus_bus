const { getUsersByUsername } = require('../../utils/services/master-data')

const ROLE_HOME_MAP = {
  student: { home: '/pages/student/home/index', roleName: '学生端' },
  driver: { home: '/pages/driver/dashboard/index', roleName: '司机端' }
}

Page({
  data: {
    username: '',
    password: ''
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value.trim() })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value.trim() })
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/index' })
  },

  handleLogin() {
    const { username, password } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }

    getUsersByUsername(username).then(users => {
      const matched = (users || [])[0]
      if (!matched || matched.password !== password || matched.status !== 'active') {
        wx.showToast({ title: '账号或密码错误', icon: 'none' })
        return
      }

      const roleConfig = ROLE_HOME_MAP[matched.role]
      if (!roleConfig) {
        wx.showToast({ title: '账号角色异常', icon: 'none' })
        return
      }

      wx.setStorageSync('auth', {
        userId: matched._id,
        username: matched.username,
        role: matched.role,
        roleName: roleConfig.roleName,
        displayName: matched.displayName || matched.username,
        busId: matched.driverBusId || '',
        busName: matched.driverBusName || '',
        loginAt: Date.now()
      })

      wx.showToast({ title: `登录成功（${roleConfig.roleName}）`, icon: 'none' })
      setTimeout(() => {
        wx.navigateTo({ url: roleConfig.home })
      }, 250)
    }).catch(() => {
      wx.showToast({ title: '登录失败，请检查云数据库', icon: 'none' })
    })
  }
})