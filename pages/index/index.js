const ACCOUNTS = [
  { username: 'student', password: '123456', role: 'student', home: '/pages/student/home/index', roleName: '学生端' },
  { username: 'driver', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端' },
  { username: 'admin', password: '123456', role: 'admin', home: '/pages/admin/dashboard/index', roleName: '管理端' }
]

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

  handleLogin() {
    const { username, password } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }

    const matched = ACCOUNTS.find(item => item.username === username && item.password === password)
    if (!matched) {
      wx.showToast({ title: '账号或密码错误', icon: 'none' })
      return
    }

    wx.setStorageSync('auth', {
      username: matched.username,
      role: matched.role,
      roleName: matched.roleName,
      loginAt: Date.now()
    })

    wx.showToast({ title: `登录成功（${matched.roleName}）`, icon: 'none' })
    setTimeout(() => {
      wx.navigateTo({ url: matched.home })
    }, 250)
  }
})