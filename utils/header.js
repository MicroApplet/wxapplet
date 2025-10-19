
// 引入依赖模块
const { open } = require('./url');
const { parse } = require('./response');
const { getUserSession, isExpired } = require('./session');
const { xAppId, xAppChl, xAppChlAppid, xAppChlAppType } = require('./env');

/**
 * 获取用户令牌
 * @returns {Promise<string>} 用户令牌
 */
async function userToken() {
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
    
    // 6. 调用 wx.login 获取登录凭证
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (loginRes) => {
          if (loginRes.code) {
            try {
              // 6.1 构建登录URL
              const loginUrl = open('/user/auth/login');
              
              // 6.2 构建请求头（传入tryLogin为true避免无限循环）
              const headers = header(null, true);
              
              // 6.3 构建请求体
              const requestData = { code: loginRes.code };
              
              // 6.4 调用 wx.request 进行登录请求
              wx.request({
                url: loginUrl,
                method: 'POST',
                header: headers,
                data: requestData,
                success: (res) => {
                  try {
                    // 6.4.1 调用 parse 函数解析返回结果
                    const token = parse(res);
                    
                    // 6.4.2 将返回结果存储到本地存储中
                    if (token) {
                      wx.setStorageSync('x-user-token', token);
                      resolve(token);
                    } else {
                      reject(new Error('登录失败：未获取到有效的用户令牌'));
                    }
                  } catch (error) {
                    reject(error);
                  }
                },
                fail: (error) => {
                  reject(new Error('登录请求失败：' + error.errMsg));
                }
              });
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error('微信登录失败：' + loginRes.errMsg));
          }
        },
        fail: (error) => {
          reject(new Error('wx.login 调用失败：' + error.errMsg));
        }
      });
    });
    
  } catch (error) {
    console.error('获取用户令牌失败：', error);
    throw error;
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
      // 注意：这里使用同步方式获取token，实际使用时可能需要改为异步
      const token = wx.getStorageSync('x-user-token');
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