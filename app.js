//app.js
App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('App Launch')
    
    // 可以在这里调用 wx.login 获取用户code
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //   }
    // })
    
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
  
  globalData: {
    userInfo: null,
    statusBar: 0,
    windowHeight: 0
  }
})