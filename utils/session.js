// 引入依赖模块
const { rest } = require('./url');
const { parse } = require('./response');
const { userToken, header } = require('./header');

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
    console.log('now:', now);
    const expireTime = new Date(this.expireAt);
    console.log('expireTimenow:', expireTime);
    const remainingTime = expireTime - now;
    console.log('remainingTime:', remainingTime);
    return remainingTime;
  }
}


/**
 * 从全局数据获取用户会话
 * @returns {UserSession|null} 用户会话对象
 */
function getUserSession() {
  try {
    const app = getApp();
    const sessionData = app && app.globalData && app.globalData.userSession;
    return sessionData ? UserSession.fromObject(sessionData) : null;
  } catch (error) {
    console.error('获取用户会话失败:', error);
    return null;
  }
}

/**
 * 检查用户会话是否过期
 * @param {UserSession} session - 用户会话对象
 * @returns {boolean} 是否已过期
 */
function isExpired(session) {
  try {
    return session && session.isExpired ? session.isExpired() : true;
  } catch (error) {
    console.error('检查会话过期状态失败:', error);
    return true;
  }
}

/**
 * 刷新用户会话信息
 * @returns {void}
 */
function refresh() {
  try {
    // 先尝试获取用户令牌，确保有登录状态
    // 注意：这里不使用header函数，避免循环引用
    const token = userToken();
    if (token && token.trim() !== '') {
      // 只有在获取到用户令牌后，才调用session接口
      wx.request({
        url: rest('/user/service/user/session'),
        method: 'GET',
        header: header(null,false),
        success: (res) => {
          // 解析返回结果作为用户会话信息
          const session = parse(res);
          // 将session设置到全局数据
          if (session) {
            const app = getApp();
            app.globalData.userSession = UserSession.fromObject(session);
          } else {
            console.error('会话刷新失败：未获取到有效的用户会话');
          }
        },
        fail: (error) => {
          console.error('会话刷新请求失败:', error);
        }
      });
    } else {
      console.warn('未获取到用户令牌，跳过会话刷新');
    }
  } catch (error) {
    console.error('刷新会话过程发生错误:', error);
  }
}

module.exports = {
  UserSession,
  getUserSession,
  isExpired,
  refresh
};
