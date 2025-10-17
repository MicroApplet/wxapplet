
// 导入所需的模块
const { xAppId, xAppChl, xAppChlAppid, xAppChlAppType, baseUrl, apiPrefix } = require('./wx-env');
const http = require('./http');

// Token相关常量
const X_USER_TOKEN = 'x-user-token';

/**
 * 获取Cookie（在微信小程序中使用storage代替）
 * @param {string} name - Cookie名称
 * @returns {string|undefined} Cookie值
 */
function getCookie(name) {
  try {
    return wx.getStorageSync(name);
  } catch (e) {
    console.error('获取Cookie失败:', e);
    return undefined;
  }
}

/**
 * 设置Cookie（在微信小程序中使用storage代替）
 * @param {string} name - Cookie名称
 * @param {string} value - Cookie值
 */
function setCookie(name, value) {
  try {
    wx.setStorageSync(name, value);
  } catch (e) {
    console.error('设置Cookie失败:', e);
  }
}

/**
 * 获取用户Token
 * @returns {string|undefined} 用户Token
 */
function userToken() {
  return getCookie(X_USER_TOKEN);
}

/**
 * 设置用户Token
 * @param {string} token - 用户Token
 */
function setUserToken(token) {
  setCookie(X_USER_TOKEN, token);
}


/**
 * 封装http.js的request函数
 * @param {string} method - HTTP方法
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [timeout=10000] - 超时时间
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function request(method, uri, data, quires, headers, timeout = 10000, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders[X_USER_TOKEN] = token;
    }
  }

  try {
    // 调用http.js的request函数
    const response = await http.request(method, baseUrl, apiPrefix, uri, quires, requestHeaders, data, timeout);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      // 返回一个新的Promise，在login成功后重试
      return new Promise((resolve, reject) => {
        // 使用回调式login函数
        login(
          // 登录成功回调
          () => {
            // 获取新的token并设置到请求头
            const newToken = userToken();
            if (newToken) {
              requestHeaders[X_USER_TOKEN] = newToken;
            }
            // 重试请求
            http.request(method, baseUrl, apiPrefix, uri, quires, requestHeaders, data, timeout)
              .then(resolve)
              .catch(reject);
          },
          // 登录失败回调
          (loginError) => {
            reject(loginError || error);
          }
        );
      });
    }
    // 抛出错误
    throw error;
  }
}

/**
 * GET请求便捷函数
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function get(uri, quires, headers, retries = 0, timeout = 10000, isLogin = false) {
  return request('GET', uri, null, quires, headers, retries, timeout, isLogin);
}

/**
 * POST请求便捷函数
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function post(uri, data, quires, headers, retries = 0, timeout = 10000, isLogin = false) {
  // 确保Content-Type已设置
  const requestHeaders = { ...headers };
  if (!requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  return request('POST', uri, data, quires, requestHeaders, retries, timeout, isLogin);
}

/**
 * PUT请求便捷函数
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function put(uri, data, quires, headers, retries = 0, timeout = 10000, isLogin = false) {
  // 确保Content-Type已设置
  const requestHeaders = { ...headers };
  if (!requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  return request('PUT', uri, data, quires, requestHeaders, retries, timeout, isLogin);
}

/**
 * DELETE请求便捷函数
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据（可选）
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function del(uri, data, quires, headers, retries = 0, timeout = 10000, isLogin = false) {
  return request('DELETE', uri, data, quires, headers, retries, timeout, isLogin);
}

/**
 * HEAD请求便捷函数
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function head(uri, quires, headers, retries = 0, timeout = 10000, isLogin = false) {
  return request('HEAD', uri, null, quires, headers, retries, timeout, isLogin);
}

/**
 * OPTIONS请求便捷函数
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function option(uri, quires, headers, retries = 0, timeout = 10000, isLogin = false) {
  return request('OPTIONS', uri, null, quires, headers, retries, timeout, isLogin);
}

/**
 * 文件上传专用函数（封装http.js的upload函数）
 * @param {string} uri - 请求路径
 * @param {string} filePath - 文件路径
 * @param {string} [name='file'] - 文件名称
 * @param {Object} [formData] - 表单数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {Function} [onProgressUpdate] - 进度更新回调
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=30000] - 超时时间，默认30秒
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function upload(uri, filePath, name = 'file', formData = {}, quires, headers, onProgressUpdate, retries = 0, timeout = 30000, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders['x-user-token'] = token;
    }
  }

  try {
    // 发送请求
    const response = await http.upload(baseUrl, apiPrefix, uri, filePath, name, formData, quires, requestHeaders, onProgressUpdate, retries, timeout);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      // 返回一个新的Promise，在login成功后重试
      return new Promise((resolve, reject) => {
        // 使用回调式login函数
        login(
          // 登录成功回调
          () => {
            // 获取新的token并设置到请求头
            const newToken = userToken();
            if (newToken) {
              requestHeaders['x-user-token'] = newToken;
            }
            // 重试请求
            http.upload(baseUrl, apiPrefix, uri, filePath, name, formData, quires, requestHeaders, onProgressUpdate, 0, timeout)
              .then(resolve)
              .catch(reject);
          },
          // 登录失败回调
          (loginError) => {
            reject(loginError || error);
          }
        );
      });
    }
    // 抛出错误
    throw error;
  }
}

// 监听器代码已迁移到listener.js模块

/**
 * 实现调用后台登录接口函数
 * @param {string} code - 微信登录凭证
 * @param {Function} success - 登录成功回调函数
 * @param {Function} fail - 登录失败回调函数
 */
function doLogin(code, success, fail) {
  // 封装请求头
  const headers = {
    'x-app-id': xAppId,
    'x-app-chl': xAppChl,
    'x-app-chl-appid': xAppChlAppid,
    'x-app-chl-app-type': xAppChlAppType
  };




  // 封装请求体
  const body = {
    'code': code
  };

  // 使用Promise处理post请求
  post('/open/user/auth/login', body, null, headers, 0, 10000, true)
    .then(response => {
      // 成功函数业务逻辑
      if (response && response.code === '0' && response.data) {
        // 从响应体中提取令牌
        const token = response.data;

        // 调用wx-api.js的setUserToken函数，设置用户令牌
        setUserToken(token);

        // 发布用户登录令牌更新事件
        console.log('使用事件总线发布用户登录令牌更新事件');
        wx.$emit('userTokenUpdated', { token });

        // 调用成功回调
        if (typeof success === 'function') {
          success(response);
        }
      } else {
        // 业务逻辑失败
        const errorMessage = response?.msg || '登录失败';
        // 发布登录失败事件
        console.log('使用事件总线发布登录失败事件');
        wx.$emit('loginFailed', { error: errorMessage });
        // 调用失败回调
        if (typeof fail === 'function') {
          fail(new Error(errorMessage));
        }
      }
    })
    .catch(error => {
      // 失败函数业务逻辑
      console.log('使用事件总线发布登录失败事件');
      wx.$emit('loginFailed', { error: error.message });
      // 调用失败回调
      if (typeof fail === 'function') {
        fail(error);
      }
    });
}

/**
 * 实现微信小程序用户登录函数
 * @param {Function} success - 登录成功回调函数
 * @param {Function} fail - 登录失败回调函数
 */
function login(success, fail) {
  // 调用wx.login函数
  wx.login({
    success: (res) => {
      // 成功回调函数处理逻辑：获取用户登录凭证（code）
      const code = res.code;
      if (!code) {
        const errorMessage = '获取登录凭证失败';
        // 发布登录失败事件
        console.log('使用事件总线发布登录失败事件');
        wx.$emit('loginFailed', { error: errorMessage });
        // 调用失败回调
        if (typeof fail === 'function') {
          fail(new Error(errorMessage));
        }
        return;
      }

      // 调用doLogin函数，传入success和fail回调
      doLogin(code, success, fail);
    },
    fail: (error) => {
      // 失败回调函数处理逻辑
      const errorMessage = error.errMsg || '微信登录失败';

      // 发布登录失败事件
      console.log('使用事件总线发布登录失败事件');
      wx.$emit('loginFailed', { error: errorMessage });

      // 调用失败回调
      if (typeof fail === 'function') {
        fail(new Error(errorMessage));
      }
    }
  });
}

// 用户会话相关业务逻辑已迁移到 session.js 模块中

// 创建api对象以兼容wx-api.js的使用方式
const api = {
  doLogin,
  login,
  request,
  // userSession 函数已迁移到 session.js 模块中
  get,
  post,
  put,
  delete: del, // 使用del作为内部函数名，导出为delete
  head,
  option,
  upload,
  setUserToken,
  userToken
};

// 导出函数和api对象
module.exports = {
  doLogin,
  login,
  request,
  // userSession 函数已迁移到 session.js 模块中
  get,
  post,
  put,
  delete: del,
  head,
  option,
  upload,
  setUserToken,
  userToken,
  api
};
