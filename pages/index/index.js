const ACCOUNTS = [
  { username: 'student', password: '123456', role: 'student', home: '/pages/student/home/index', roleName: '学生端' },
  { username: 'driver1', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S1', busName: '校巴1号' },
  { username: 'driver2', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S2', busName: '校巴2号' },
  { username: 'driver3', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S3', busName: '校巴3号' },
  { username: 'driver4', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S4', busName: '校巴4号' },
  { username: 'driver5', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S5', busName: '校巴5号' },
  { username: 'driver6', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S6', busName: '校巴6号' },
  { username: 'driver7', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S7', busName: '校巴7号' },
  { username: 'driver8', password: '123456', role: 'driver', home: '/pages/driver/dashboard/index', roleName: '司机端', busId: 'S8', busName: '校巴8号' },
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

  goJourney() {
    wx.navigateTo({ url: '/pages/student/journey/index' })
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
      busId: matched.busId || '',
      busName: matched.busName || '',
      loginAt: Date.now()
    })

    wx.showToast({ title: `登录成功（${matched.roleName}）`, icon: 'none' })
    setTimeout(() => {
      wx.navigateTo({ url: matched.home })
    }, 250)
  }
})