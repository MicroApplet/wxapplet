
// 引入依赖模块
const { open } = require('./url');
const { parse } = require('./response');
const { getUserSession, isExpired } = require('./session');
const { xAppId, xAppChl, xAppChlAppid, xAppChlAppType } = require('./env');

/**
 * 获取用户令牌（同步版本）
 * @returns {string} 用户令牌
 */
function userToken() {
  try {
    // 1. 从本地存储中获取 x-user-token
    const localToken = wx.getStorageSync('x-user-token');
    
    // 2. 如果获取到数据，且不为空的情况下，直接返回 x-user-token 的值
    if (localToken && localToken.trim() !== '') {
      return localToken;
    }
    
    // 3. 从全局数据中获取 userSession 数据
    const userSession = getUserSession();
    
    // 4. 如果获取到数据，则校验该数据是否在有效期内
    if (userSession && !isExpired(userSession)) {
      // 5. 如果校验通过，则直接返回 userSession 中的 token 字段值
      return userSession.token;
    }
    
    // 6. 如果没有找到有效的令牌，返回空字符串
    return '';
    
  } catch (error) {
    console.error('获取用户令牌失败：', error);
    return '';
  }
}

/**
 * 构建请求头
 * @param {Object} headers - 用户指定的请求头，可选
 * @param {boolean} tryLogin - 是否尝试登录，默认为false
 * @returns {Object} 最终的请求头对象
 */
function header(headers = {}, tryLogin = false) {
  // 1. 创建 targetHeaders 对象，用于存储最终的请求头
  const targetHeaders = { ...headers };
  
  // 添加基础应用信息
  targetHeaders['x-app-id'] = xAppId;
  targetHeaders['x-app-chl'] = xAppChl;
  targetHeaders['x-app-chl-appid'] = xAppChlAppid;
  targetHeaders['x-app-chl-app-type'] = xAppChlAppType;
  
  // 2. 如果 tryLogin === false，获取用户令牌并添加到请求头
  if (!tryLogin) {
    try {
      // 调用 userToken 函数获取用户令牌
      const token = userToken();
      if (token && token.trim() !== '') {
        targetHeaders['x-user-token'] = token;
        targetHeaders['authorization'] = token;
      }
    } catch (error) {
      console.warn('获取用户令牌失败：', error);
    }
  }
  
  return targetHeaders;
}

// 导出函数
module.exports = { userToken, header };