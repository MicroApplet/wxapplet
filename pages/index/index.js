//index.js
Page({
  data: {
    message: 'Hello 微信小程序!',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  // 生命周期函数--监听页面加载
  onLoad: function () {
    console.log('首页加载')
    
    // 如果已经授权，可以直接获取用户信息
    if (wx.getStorageSync('userInfo')) {
      this.setData({
        userInfo: wx.getStorageSync('userInfo'),
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 可以使用开放能力获取用户信息
      console.log('可以使用开放能力获取用户信息')
    } else {
      // 不支持开放能力，使用传统方式获取用户信息
      wx.getUserInfo({
        success: res => {
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
          wx.setStorageSync('userInfo', res.userInfo)
        }
      })
    }
  },

  // 生命周期函数--监听页面初次渲染完成
  onReady: function () {
    console.log('首页渲染完成')
  },

  // 生命周期函数--监听页面显示
  onShow: function () {
    console.log('首页显示')
  },

  // 生命周期函数--监听页面隐藏
  onHide: function () {
    console.log('首页隐藏')
  },

  // 生命周期函数--监听页面卸载
  onUnload: function () {
    console.log('首页卸载')
  },

  // 页面相关事件处理函数--监听用户下拉动作
  onPullDownRefresh: function () {
    console.log('下拉刷新')
    // 模拟网络请求
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1500)
  },

  // 页面上拉触底事件的处理函数
  onReachBottom: function () {
    console.log('上拉触底')
  },

  // 监听用户点击页面内转发按钮
  onShareAppMessage: function () {
    return {
      title: '微信小程序示例',
      path: '/pages/index/index'
    }
  },

  // 获取用户信息
  getUserInfo: function (e) {
    console.log('获取用户信息', e)
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
      wx.setStorageSync('userInfo', e.detail.userInfo)
    }
  },

  // 跳转到日志页面
  goToLogs: function () {
    wx.navigateTo({
      url: '/pages/logs/logs'
    })
  }
})