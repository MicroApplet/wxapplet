// userSession 结构体定义
const api = require('./api');

class UserSession {
  constructor() {
    this.id = ''; // 会话编号
    this.token = ''; // 会话令牌
    this.appid = ''; // 会话所属应用编号
    this.userid = ''; // 用户编号
    this.roleBit = 0; // 角色位图，参考：role-enum.js
    this.chl = ''; // 会话渠道
    this.chlAppid = ''; // 会话渠道应用编号
    this.chlAppType = ''; // 会话渠道应用类型
    this.chlUserid = ''; // 会话渠道用户编号
    this.loginTime = ''; // 登录时间，格式：yyyy-MM-dd'T'HH:mm:ss
    this.expireAt = ''; // 过期时间，格式：yyyy-MM-dd'T'HH:mm:ss
  }

  /**
   * 从对象创建 UserSession 实例
   * @param {Object} data - 包含会话信息的对象
   * @returns {UserSession} UserSession 实例
   */
  static fromObject(data) {
    const session = new UserSession();
    if (!data) return session;

    session.id = data.id || '';
    session.token = data.token || '';
    session.appid = data.appid || '';
    session.userid = data.userid || '';
    session.roleBit = data.roleBit || 0;
    session.chl = data.chl || '';
    session.chlAppid = data.chlAppid || '';
    session.chlAppType = data.chlAppType || '';
    session.chlUserid = data.chlUserid || '';
    session.loginTime = data.loginTime || '';
    session.expireAt = data.expireAt || '';

    return session;
  }

  /**
   * 转换为普通对象
   * @returns {Object} 会话信息对象
   */
  toObject() {
    return {
      id: this.id,
      token: this.token,
      appid: this.appid,
      userid: this.userid,
      roleBit: this.roleBit,
      chl: this.chl,
      chlAppid: this.chlAppid,
      chlAppType: this.chlAppType,
      chlUserid: this.chlUserid,
      loginTime: this.loginTime,
      expireAt: this.expireAt
    };
  }

  /**
   * 检查会话是否过期
   * @returns {boolean} 是否已过期
   */
  isExpired() {
    if (!this.expireAt) return true;
    const now = new Date();
    const expireTime = new Date(this.expireAt);
    return now > expireTime;
  }

  /**
   * 获取剩余有效期（毫秒）
   * @returns {number} 剩余有效毫秒数，过期返回负数
   */
  getRemainingTime() {
    if (!this.expireAt) return -1;
    const now = new Date();
    const expireTime = new Date(this.expireAt);
    return expireTime - now;
  }
}

// 用于存储正在执行的refresh Promise，防止重复调用
let refreshPromise = null;

/**
 * 刷新用户会话信息
 * 实现与 api.js 中 userSession 函数相同的功能
 * @returns {Promise<Object>} 用户会话信息
 */
function refresh() {
  // 如果已有refresh请求正在进行，直接返回该Promise
  if (refreshPromise) {
    console.log('【session.js】refresh请求已在进行中，返回同一Promise');
    return refreshPromise;
  }

  // 创建新的Promise并保存引用
  refreshPromise = new Promise((resolve, reject) => {
    // 调用 api.get 函数获取用户会话信息，使用回调函数方式
    console.log('【session.js】调用 /rest/user/service/user/session 接口获取用户会话信息');
    api.get('/rest/user/service/user/session', {
      // 成功回调函数
      success: function(response) {
        const sessionInfo = response;
        console.log('refresh 调用结果', sessionInfo);
        // 从响应体中提取用户会话信息

        // 更新应用实例的全局数据（如果应用实例存在）
        const appInstance = getApp();
        if (appInstance) {
          // 使用 UserSession.fromObject 转换并设置 userSession 字段
          // 注意：不更新 userInfo 字段，该字段有其他用处
          appInstance.globalData.userSession = UserSession.fromObject(sessionInfo);

          // 缓存用户会话信息到本地存储
          wx.setStorageSync('userSession', sessionInfo);

          console.log('用户会话信息已更新:', sessionInfo);
        }

        // 发布用户会话信息更新事件
        console.log('使用事件总线发布用户会话信息更新事件');
        wx.$emit('userSessionUpdated', { sessionInfo });

        // 激活一个延时任务，在4分钟后重新调用该函数，获取新的会话令牌
        // 清除之前可能存在的定时器
        if (global.sessionRefreshTimer) {
          clearTimeout(global.sessionRefreshTimer);
        }

        // 设置4分钟(240000毫秒)后的定时器
        global.sessionRefreshTimer = setTimeout(() => {
          console.log('定时刷新用户会话令牌');
          refresh().catch(error => {
            console.error('定时刷新会话失败:', error);
          });
        }, 4 * 60 * 1000);

        resolve(sessionInfo);
      },

      // 失败回调函数
      fail: function(error) {
        // 失败回调函数处理逻辑
        console.error('获取用户会话失败:', error);

        // 发布用户会话获取失败事件
        console.log('使用事件总线发布用户会话获取失败事件');
        wx.$emit('userSessionFailed', { error: error.message || String(error) });

        // 清除定时器，避免在失败状态下继续尝试刷新
        if (global.sessionRefreshTimer) {
          clearTimeout(global.sessionRefreshTimer);
          global.sessionRefreshTimer = null;
        }

        // 无论成功失败，都清除Promise引用
        refreshPromise = null;
        reject(error);
      }
    });
  });

  // 无论成功失败，最终都清除Promise引用
  refreshPromise.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

module.exports = {
  UserSession,
  refresh
};
