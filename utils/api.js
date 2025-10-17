
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

// 另一个clearCookie函数定义，暂时注释
// /**
//  * 清除Cookie（在微信小程序中使用storage代替）
//  * @param {string} name - Cookie名称
//  */
// function clearCookie(name) {
//   try {
//     wx.removeStorageSync(name);
//   } catch (e) {
//     console.error('清除Cookie失败:', e);
//   }
// }

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
 * GET请求便捷函数（封装http.js的get函数）
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function get(uri, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders[X_USER_TOKEN] = token;
    }
  }

  try {
    // 发送请求
    const response = await http.get(baseUrl, apiPrefix, uri, quires, requestHeaders, retries, timeout, success, retryWhen, fail, isLogin);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      try {
        // 同步调用login函数
        await login();
        // 获取新的token并设置到请求头
        const newToken = userToken();
        if (newToken) {
          requestHeaders[X_USER_TOKEN] = newToken;
        }
        // 重试请求
        return await http.get(baseUrl, apiPrefix, uri, quires, requestHeaders, 0, timeout, success, retryWhen, fail, isLogin);
      } catch (error) {
        // 登录失败，优先使用fail函数处理
        if (typeof fail === 'function') {
          fail(error);
        }
        throw error;
      }
    } else {
      // 其他错误优先使用fail函数处理
      if (typeof fail === 'function') {
        fail(error);
      }
    }
    // 抛出错误
    throw error;
  }
}

/**
 * POST请求便捷函数（封装http.js的post函数）
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function post(uri, data, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders[X_USER_TOKEN] = token;
    }
  }

  try {
    // 发送请求
    const response = await http.post(baseUrl, apiPrefix, uri, data, quires, requestHeaders, retries, timeout, success, retryWhen, fail, isLogin);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      try {
        // 同步调用login函数
        await login();
        // 获取新的token并设置到请求头
        const newToken = userToken();
        if (newToken) {
          requestHeaders[X_USER_TOKEN] = newToken;
        }
        // 重试请求
        return await http.post(baseUrl, apiPrefix, uri, data, quires, requestHeaders, 0, timeout, success, retryWhen, fail, isLogin);
      } catch (error) {
        // 登录失败，优先使用fail函数处理
        if (typeof fail === 'function') {
          fail(error);
        }
        throw error;
      }
    } else {
      // 其他错误优先使用fail函数处理
      if (typeof fail === 'function') {
        fail(error);
      }
    }
    // 抛出错误
    throw error;
  }
}

/**
 * PUT请求便捷函数（封装http.js的put函数）
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function put(uri, data, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders[X_USER_TOKEN] = token;
    }
  }

  try {
    // 发送请求
    const response = await http.put(baseUrl, apiPrefix, uri, data, quires, requestHeaders, retries, timeout, success, retryWhen, fail, isLogin);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      try {
        // 同步调用login函数
        await login();
        // 获取新的token并设置到请求头
        const newToken = userToken();
        if (newToken) {
          requestHeaders[X_USER_TOKEN] = newToken;
        }
        // 重试请求
        return await http.put(baseUrl, apiPrefix, uri, data, quires, requestHeaders, 0, timeout, success, retryWhen, fail, isLogin);
      } catch (error) {
        // 登录失败，优先使用fail函数处理
        if (typeof fail === 'function') {
          fail(error);
        }
        throw error;
      }
    } else {
      // 其他错误优先使用fail函数处理
      if (typeof fail === 'function') {
        fail(error);
      }
    }
    // 抛出错误
    throw error;
  }
}

/**
 * DELETE请求便捷函数（封装http.js的delete函数）
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据（可选）
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function del(uri, data, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders[X_USER_TOKEN] = token;
    }
  }

  try {
    // 发送请求
    const response = await http.delete(baseUrl, apiPrefix, uri, data, quires, requestHeaders, retries, timeout, success, retryWhen, fail, isLogin);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      try {
        // 同步调用login函数
        await login();
        // 获取新的token并设置到请求头
        const newToken = userToken();
        if (newToken) {
          requestHeaders[X_USER_TOKEN] = newToken;
        }
        // 重试请求
        return await http.delete(baseUrl, apiPrefix, uri, data, quires, requestHeaders, 0, timeout, success, retryWhen, fail, isLogin);
      } catch (error) {
        // 登录失败，优先使用fail函数处理
        if (typeof fail === 'function') {
          fail(error);
        }
        throw error;
      }
    } else {
      // 其他错误优先使用fail函数处理
      if (typeof fail === 'function') {
        fail(error);
      }
    }
    // 抛出错误
    throw error;
  }
}

/**
 * HEAD请求便捷函数（封装http.js的head函数）
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function head(uri, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders[X_USER_TOKEN] = token;
    }
  }

  try {
    // 发送请求
    const response = await http.head(baseUrl, apiPrefix, uri, quires, requestHeaders, retries, timeout, success, retryWhen, fail, isLogin);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      try {
        // 同步调用login函数
        await login();
        // 获取新的token并设置到请求头
        const newToken = userToken();
        if (newToken) {
          requestHeaders[X_USER_TOKEN] = newToken;
        }
        // 重试请求
        return await http.head(baseUrl, apiPrefix, uri, quires, requestHeaders, 0, timeout, success, retryWhen, fail, isLogin);
      } catch (error) {
        // 登录失败，优先使用fail函数处理
        if (typeof fail === 'function') {
          fail(error);
        }
        throw error;
      }
    } else {
      // 其他错误优先使用fail函数处理
      if (typeof fail === 'function') {
        fail(error);
      }
    }
    // 抛出错误
    throw error;
  }
}

/**
 * OPTIONS请求便捷函数（封装http.js的option函数）
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function option(uri, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail, isLogin = false) {
  // 处理请求头和令牌
  const requestHeaders = { ...headers };
  if (!isLogin) {
    const token = userToken();
    if (token) {
      requestHeaders[X_USER_TOKEN] = token;
    }
  }

  try {
    // 发送请求
    const response = await http.option(baseUrl, apiPrefix, uri, quires, requestHeaders, retries, timeout, success, retryWhen, fail, isLogin);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      try {
        // 同步调用login函数
        await login();
        // 获取新的token并设置到请求头
        const newToken = userToken();
        if (newToken) {
          requestHeaders[X_USER_TOKEN] = newToken;
        }
        // 重试请求
        return await http.option(baseUrl, apiPrefix, uri, quires, requestHeaders, 0, timeout, success, retryWhen, fail, isLogin);
      } catch (error) {
        // 登录失败，优先使用fail函数处理
        if (typeof fail === 'function') {
          fail(error);
        }
        throw error;
      }
    } else {
      // 其他错误优先使用fail函数处理
      if (typeof fail === 'function') {
        fail(error);
      }
    }
    // 抛出错误
    throw error;
  }
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
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @param {boolean} [isLogin=false] - 用户是否试图登录
 * @returns {Promise} 返回Promise对象
 */
async function upload(uri, filePath, name = 'file', formData = {}, quires, headers, onProgressUpdate, retries = 0, timeout = 30000, success, retryWhen, fail, isLogin = false) {
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
    const response = await http.upload(baseUrl, apiPrefix, uri, filePath, name, formData, quires, requestHeaders, onProgressUpdate, retries, timeout, success, retryWhen, fail, isLogin);
    return response;
  } catch (error) {
    // 处理401错误重试逻辑
    if (!isLogin && error && error.statusCode === 401) {
      try {
        // 同步调用login函数
        await login();
        // 获取新的token并设置到请求头
        const newToken = userToken();
        if (newToken) {
          requestHeaders['x-user-token'] = newToken;
        }
        // 重试请求
        return await http.upload(baseUrl, apiPrefix, uri, filePath, name, formData, quires, requestHeaders, onProgressUpdate, 0, timeout, success, retryWhen, fail, isLogin);
      } catch (error) {
        // 登录失败，优先使用fail函数处理
        if (typeof fail === 'function') {
          fail(error);
        }
        throw error;
      }
    } else {
      // 其他错误优先使用fail函数处理
      if (typeof fail === 'function') {
        fail(error);
      }
    }
    // 抛出错误
    throw error;
  }
}

// 监听器代码已迁移到listener.js模块

/**
 * 实现调用后台登录接口函数
 * @param {string} code - 微信登录凭证
 * @returns {Promise<any>} 登录结果
 */
async function doLogin(code) {
  try {
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

    // 调用wx-api.js的post函数，传入isLogin=true表示这是登录请求
    const response = await post('/open/user/auth/login', body, null, headers, 0, 10000, null, null, null, true);

    // 成功函数业务逻辑
    if (response && response.code === '0' && response.data) {
      // 从响应体中提取令牌
      const token = response.data;

      // 调用wx-api.js的setUserToken函数，设置用户令牌
      setUserToken(token);

      // 发布用户登录令牌更新事件
      console.log('使用事件总线发布用户登录令牌更新事件');
      wx.$emit('userTokenUpdated', { token });

      return response;
    } else {
      // 业务逻辑失败
      throw new Error(response?.msg || '登录失败');
    }
  } catch (error) {
    // 失败函数业务逻辑
    console.log('使用事件总线发布登录失败事件');
    wx.$emit('loginFailed', { error: error.message });
    throw error;
  }
}

/**
 * 实现微信小程序用户登录函数
 * @returns {Promise<any>} 登录结果
 */
async function login() {
  return new Promise((resolve, reject) => {
    // 调用wx.login函数
    wx.login({
      success: async (res) => {
        try {
          // 成功回调函数处理逻辑：获取用户登录凭证（code）
          const code = res.code;
          if (!code) {
            throw new Error('获取登录凭证失败');
          }

          // 调用doLogin函数
          const result = await doLogin(code);
          resolve(result);
        } catch (error) {
          // 发布登录失败事件
          console.log('使用事件总线发布登录失败事件');
          wx.$emit('loginFailed', { error: error.message });
          reject(error);
        }
      },
      fail: (error) => {
        // 失败回调函数处理逻辑
        const errorMessage = error.errMsg || '微信登录失败';

        // 发布登录失败事件
        console.log('使用事件总线发布登录失败事件');
        wx.$emit('loginFailed', { error: errorMessage });

        reject(new Error(errorMessage));
      }
    });
  });
}

// 用户会话相关业务逻辑已迁移到 session.js 模块中

// 创建api对象以兼容wx-api.js的使用方式
const api = {
  doLogin,
  login,
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
