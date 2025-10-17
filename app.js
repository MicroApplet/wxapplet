//app.js
// 导入 UserSession 类型
const { UserSession } = require('./utils/session');
// 导入事件总线初始化函数
const { initEventBus } = require('./utils/event-bus');


App({
  // 生命周期回调——监听小程序初始化
  onLaunch: function () {
    // 初始化页面注册列表
    this._registeredPages = [];
    // 初始化事件总线
    initEventBus();
  },

  // 生命周期回调——监听小程序启动或切前台
  onShow: function () {
    // 页面显示
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      if (res.hasUpdate) {
        console.log('更新发现新版本', res);
      }
    });
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(result) {
          if (result.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate();
          }
        }
      });
    });
    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
      console.log('新版本下载失败');
    });
  },

  // 生命周期回调——监听小程序切后台
  onHide: function () {
  },

  // 生命周期回调——监听小程序报错
  onError: function() {
  },

  // 生命周期回调——监听小程序页面不存在
  onPageNotFound: function() {
  },

  // 生命周期回调——监听小程序未处理 Promise 拒绝
  onUnhandledRejection: function() {
  },

  // 生命周期回调——监听小程序主题变化
  onThemeChange: function() {
  },

  // 注册页面到全局通知系统
  registerPage: function(page) {
    if (page && typeof page === 'object') {
      this._registeredPages.push(page);
    }
  },

  // 从全局通知系统中注销页面
  unregisterPage: function(page) {
    if (page && Array.isArray(this._registeredPages)) {
      this._registeredPages = this._registeredPages.filter(item => item !== page);
    }
  },

  // 向所有注册的页面发送通知
  notifyPages: function(methodName, ...args) {
    this._registeredPages.forEach(page => {
      if (page && typeof page[methodName] === 'function') {
        try {
          page[methodName](...args);
        } catch (error) {
          console.error(`通知页面执行${methodName}失败:`, error);
        }
      }
    });
  },

  // 全局数据
  globalData: {
    userSession: new UserSession() // 初始化 UserSession 类型的全局字段
  },

  // 私有属性 - 注册的页面列表
  _registeredPages: []
});
