//app.js

// 导入userToken函数（暂时未使用）
// const { userToken } = require('./utils/wx-api');

App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('App Launch');

    // 检查用户登录状态
    this.checkLoginStatus();

    // 获取系统信息
    wx.getSystemInfo({
      success: e => {
        this.globalData.statusBar = e.statusBarHeight;
        this.globalData.windowHeight = e.windowHeight;
      }
    });
  },

  onShow: function () {
    // 小程序显示时执行
    console.log('App Show');
  },

  onHide: function () {
    // 小程序隐藏时执行
    console.log('App Hide');
  },

  // 检查用户登录状态
  checkLoginStatus: function() {
    // 从wx-api.js获取token并获取用户信息
    const userInfo = wx.getStorageSync('userInfo');

    // 保存到全局数据
    this.globalData.userInfo = userInfo;

    // 对于首页和文章详情页面，允许未登录访问
    // 只有在访问需要登录的功能时才进行登录验证
  },

  globalData: {
    userInfo: null,
    statusBar: 0,
    windowHeight: 0
  }
});
