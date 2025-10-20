
// 引入依赖模块
const { xAppId, xAppChl, xAppChlAppid, xAppChlAppType } = require('./env');
// 引入app.js以使用全局登录函数
const app = getApp();

/**
 * 获取用户令牌（同步版本）
 * @returns {string} 用户令牌
 */
function userToken() {
  // 1. 从本地存储中获取 x-user-token
  let localToken = wx.getStorageSync('x-user-token');

  // 2. 如果获取到数据，且不为空的情况下，直接返回 x-user-token 的值
  if (localToken && localToken.trim() !== '') {
    return localToken;
  }

  // 3. 如果未获取到令牌，调用app.js中的全局performLogin函数
  // 注意：这里使用Promise的同步方式处理异步登录
  try {
    // 创建一个同步阻塞的方式等待异步登录完成
    let loginCompleted = false;
    let loginError = null;
    // 调用全局登录函数
    app.performLogin().then(() => {
      loginCompleted = true;
    }).catch(error => {
      loginError = error;
      loginCompleted = true;
    });
    // 同步等待登录完成（小程序环境下的阻塞方式）
    const startTime = Date.now();
    while (!loginCompleted && Date.now() - startTime < 5000) {
      // 小程序环境下简单的轮询等待，避免长时间阻塞
      if (Date.now() - startTime > 100) {
        // 短暂让出执行权
        setTimeout(() => {}, 0);
      }
    }
    if (loginError) {
      throw loginError;
    }
  } catch (err) {
    console.error('登录过程发生错误:', err);
    throw err;
  }

  // 4. 再次从本地存储中获取 x-user-token
  localToken = wx.getStorageSync('x-user-token');

  // 5. 如果获取到数据，且不为空的情况下，直接返回 x-user-token 的值
  if (localToken && localToken.trim() !== '') {
    return localToken;
  }

  // 6. 如果还取不到值则报错
  throw new Error('未获取到有效的用户令牌');
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
