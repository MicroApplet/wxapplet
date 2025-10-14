//app.js
App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('App Launch')
    
    // 检查用户登录状态
    this.checkLoginStatus()
    
    // 获取系统信息
    wx.getSystemInfo({
      success: e => {
        this.globalData.statusBar = e.statusBarHeight
        this.globalData.windowHeight = e.windowHeight
      }
    })
  },
  
  onShow: function () {
    // 小程序显示时执行
    console.log('App Show')
  },
  
  onHide: function () {
    // 小程序隐藏时执行
    console.log('App Hide')
  },
  
  // 检查用户登录状态
  checkLoginStatus: function() {
    // 从本地存储获取token
    const token = wx.getStorageSync('userToken')
    const userInfo = wx.getStorageSync('userInfo')
    
    // 保存到全局数据
    this.globalData.userInfo = userInfo
    
    // 如果没有token或用户信息，则跳转到登录页面
    if (!token || !userInfo) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },
  
  globalData: {
    userInfo: null,
    statusBar: 0,
    windowHeight: 0
  }
})