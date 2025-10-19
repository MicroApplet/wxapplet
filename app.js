//app.js
// 导入 UserSession 类型和 refresh 函数
const { UserSession, refresh } = require('./utils/session');
// TODO: event-bus模块已移除，后续需要重新实现事件总线功能
// const { initEventBus } = require('./utils/event-bus');


App({
  // 生命周期回调——监听小程序初始化
  onLaunch: function () {
    // 初始化页面注册列表
    this._registeredPages = [];
    // 初始化事件总线
    // TODO: event-bus模块已移除，后续需要重新实现事件总线功能
    //initEventBus();
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

    // 初始化任务调度器
    this._initTaskScheduler();
  },

  // 生命周期回调——监听小程序切后台
  onHide: function () {
    // 停止任务调度器
    this._stopTaskScheduler();
  },

  // 任务调度器初始化
  _initTaskScheduler: function() {
    // 先停止可能存在的任务调度器
    this._stopTaskScheduler();
    // 立即执行一次 refresh 函数（小程序启动或切前台时立即刷新）
    try {
      refresh();
    } catch (error) {
      console.error('立即刷新会话失败:', error);
    }
    // 检查会话剩余有效期，如果少于5秒则调用refresh
    try {
      const remainingTime = this.globalData.userSession.getRemainingTime();
      if (remainingTime > 0 && remainingTime < 5000) {
        console.log('会话即将过期，立即刷新');
        refresh();
      }
    } catch (error) {
      console.error('检查会话有效期失败:', error);
    }
    // 设置定时任务：每4分30秒(270000毫秒)调用一次 refresh 函数
    this._sessionRefreshTimer = setInterval(() => {
      try {
        // 先检查会话剩余有效期，如果少于5秒则调用refresh
        const remainingTime = this.globalData.userSession.getRemainingTime();
        if (remainingTime > 0 && remainingTime < 5000) {
          console.log('会话即将过期，立即刷新');
          refresh();
        }
      } catch (error) {
        console.error('检查会话有效期失败:', error);
      }
      // 无论如何都调用refresh函数进行定期刷新
      try {
        refresh();
      } catch (error) {
        console.error('定时刷新会话失败:', error);
      }
    }, 270000);
  },

  // 停止任务调度器
  _stopTaskScheduler: function() {
    // 清理定时器，确保切后台后不再调用 refresh 函数
    if (this._sessionRefreshTimer) {
      clearInterval(this._sessionRefreshTimer);
      this._sessionRefreshTimer = null;
    }
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
  _registeredPages: [],
  // 私有属性 - 会话刷新定时器
  _sessionRefreshTimer: null
});
