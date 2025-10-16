//app.js

// 导入HTTP请求工具
const { api } = require('./utils/wx-api');
// 导入环境配置
const { xAppId, xAppChl, wxAppId, xAppChlAppType } = require('./utils/wx-env');

App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('App Launch');

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

    // 立即执行用户登录
    this.doWechatLogin();

    // 启动会话监控定时器
    this.startSessionMonitoring();
  },

  onHide: function () {
    // 小程序隐藏时执行
    console.log('App Hide');

    // 停止会话监控定时器
    this.stopSessionMonitoring();
  },

  // 微信授权登录方法
  doWechatLogin: function() {
    const that = this;

    // 调用wx.login获取用户授权码
    wx.login({
      success: function(res) {
        if (res.code) {
          // 获取到code，调用登录接口
          that.loginWithCode(res.code);
        } else {
          console.error('获取登录授权码失败:', res.errMsg);
        }
      },
      fail: function(err) {
        console.error('wx.login调用失败:', err);
      }
    });
  },

  // 使用code调用登录接口
  loginWithCode: function(code) {
    const that = this;

    // 构建请求头 - 从环境配置中获取
    const headers = {
      'x-app-id': xAppId,
      'x-app-chl': xAppChl,
      'x-app-chl-appid': wxAppId,
      'x-app-chl-app-type': xAppChlAppType
    };

    // 构建请求数据
    const credentials = {
      code: code
    };

    // 调用登录接口
    api.login('/open/user/auth/login', credentials, headers)
      .then(function(response) {
        console.log('登录成功:', response);

        // 登录成功后调用获取当前用户会话的接口
        that.getUserSessionInfo();
      })
      .catch(function(error) {
        console.error('登录失败:', error);
      });
  },

  // 获取用户会话信息
  getUserSessionInfo: function() {
    const that = this;
    api.get('/rest/user/service/user/session')
      .then(function(response) {
        if (response && response.code === '0' && response.data) {
          const userData = response.data;
          // 保存用户信息到全局
          that.globalData.userInfo = userData;
          that.globalData.isLoggedIn = true;
          // 缓存用户信息到本地
          wx.setStorageSync('userInfo', userData);
          console.log('获取用户会话信息成功');
        }
      })
      .catch(function(error) {
        console.error('获取用户会话信息失败:', error);
      });
  },

  // 启动会话监控
  startSessionMonitoring: function() {
    const that = this;
    // 清除之前的定时器
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }

    // 每4分30秒调用一次获取会话接口，避免会话过期
    this.sessionTimer = setInterval(function() {
      that.getUserSessionInfo();
    }, 4 * 60 * 1000 + 30 * 1000);
  },

  // 停止会话监控
  stopSessionMonitoring: function() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  },

  globalData: {
    userInfo: null,
    statusBar: 0,
    windowHeight: 0,
    isLoggedIn: false // 用户登录状态
  }
});
