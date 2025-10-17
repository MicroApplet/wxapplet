// userSession 结构体定义

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

/**
 * 同步获取用户会话信息
 * @returns {UserSession} 用户会话信息对象
 */
function refresh() {
  // 从全局数据获取会话信息
  const appInstance = getApp();
  let userSession = null;

  // 1. 尝试从全局数据获取
  if (appInstance && appInstance.globalData && appInstance.globalData.userSession) {
    userSession = appInstance.globalData.userSession;
    console.log('【session.js】从全局数据获取用户会话信息');
  }

  // 2. 如果全局数据中没有，尝试从本地存储获取
  if (!userSession) {
    try {
      const sessionInfo = wx.getStorageSync('userSession');
      if (sessionInfo) {
        userSession = UserSession.fromObject(sessionInfo);
        console.log('【session.js】从本地存储获取用户会话信息');

        // 更新到全局数据
        if (appInstance) {
          appInstance.globalData.userSession = userSession;
        }
      }
    } catch (error) {
      console.error('【session.js】从本地存储获取会话信息失败:', error);
    }
  }

  // 3. 如果全局数据和本地存储都没有，或者会话已过期，调用接口获取
  if (!userSession || userSession.isExpired()) {
    try {
      console.log('【session.js】调用接口获取用户会话信息');
      // 使用api.js中的http工具调用会话接口
      const { api } = require('./api');

      // 由于api.js中的get方法是异步的，我们需要使用Promise或同步方法
      // 这里我们使用try-catch包装同步调用
      const responseData = api.get('/user/service/user/session');

      if (responseData) {
        // 解析为 UserSession 对象
        userSession = UserSession.fromObject(responseData);
        console.log('【session.js】成功获取并解析用户会话信息');

        // 更新到本地存储
        try {
          wx.setStorageSync('userSession', userSession.toObject());
          console.log('【session.js】用户会话信息已保存到本地存储');
        } catch (storageError) {
          console.error('【session.js】保存会话信息到本地存储失败:', storageError);
        }

        // 更新到全局数据
        if (appInstance) {
          appInstance.globalData.userSession = userSession;
          console.log('【session.js】用户会话信息已更新到全局数据');
        }
      } else {
        console.warn('【session.js】接口返回数据为空');
        userSession = new UserSession();
      }
    } catch (apiError) {
      console.error('【session.js】调用会话接口异常:', apiError);
      userSession = new UserSession();
    }
  }

  return userSession;
}

module.exports = {
  UserSession,
  refresh
};
