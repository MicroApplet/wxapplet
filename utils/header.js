
// 引入依赖模块
const { open } = require('./url');
const { parse } = require('./response');
const { xAppId, xAppChl, xAppChlAppid, xAppChlAppType } = require('./env');

function refreshUserToken(){
  wx.removeStorageSync('x-user-token');
  userToken();
}

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

  // 6 还获取不到用户令牌，执行登录功能并从后台应用中换取用户的 令牌
  wx.login({
    // 用户授权成功
    success: (code) => {
      try {
        // 6.4 调用后台接口执行登录
        wx.request({
          url: open('/user/auth/login'),
          data: { code: code.code },
          header: header(null, true),
          method: 'POST',
          success: (res) => {
            // 6.4.1 调用 parse 函数解析返回结果作为用户令牌
            const token = parse(res);

            // 6.4.2 将返回结果存储到本地存储中
            if (token) {
              wx.setStorageSync('x-user-token', token);
            } else {
              console.error('登录失败：未获取到有效的用户令牌');
            }
          },
          fail: (error) => {
            console.error('登录请求失败:', error);
          }
        });
      } catch (err) {
        console.error('登录过程发生错误:', err);
      }
    },
    fail: (err) => {
      throw new Error('登录失败：' + err.errMsg);
    }
  });

  // 7. 再次从本地存储中获取 x-user-token
  localToken = wx.getStorageSync('x-user-token');

  // 8. 如果获取到数据，且不为空的情况下，直接返回 x-user-token 的值
  if (localToken && localToken.trim() !== '') {
    return localToken;
  }

  // 9 如果还取不到值则报错
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
module.exports = { userToken, refreshUserToken, header };
