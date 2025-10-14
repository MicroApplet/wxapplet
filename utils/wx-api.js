/**
 * 微信小程序HTTP请求工具
 * 基于微信小程序的wx.request封装
 */

// 导入环境配置
const { baseUrl, apiPrefix, debug } = require('./wx-env');

// Token相关常量
const X_USER_TOKEN = 'x-user-token';

/**
 * 合并URL
 * @param {string} uri - 接口路径
 * @returns {string} 合并后的完整URL
 */
function combineUrl(uri) {
  // 如果uri已经是完整URL，直接返回
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  // 合并基础URL和API前缀
  let fullUrl = baseUrl;
  
  // 确保baseUrl末尾没有斜杠
  if (fullUrl.endsWith('/')) {
    fullUrl = fullUrl.slice(0, -1);
  }
  
  // 确保apiPrefix开头有斜杠
  let prefix = apiPrefix;
  if (!prefix.startsWith('/')) {
    prefix = `/${prefix}`;
  }
  
  // 确保uri开头有斜杠
  if (!uri.startsWith('/')) {
    uri = `/${uri}`;
  }
  
  return `${fullUrl}${prefix}${uri}`;
}

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
 * @param {number} days - 有效期天数
 */
function setCookie(name, value, days = 365) {
  try {
    wx.setStorageSync(name, value);
  } catch (e) {
    console.error('设置Cookie失败:', e);
  }
}

/**
 * 清除Cookie（在微信小程序中使用storage代替）
 * @param {string} name - Cookie名称
 */
function clearCookie(name) {
  try {
    wx.removeStorageSync(name);
  } catch (e) {
    console.error('清除Cookie失败:', e);
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
 * 请求拦截器
 * @param {object} config - 请求配置
 * @param {object} headers - 自定义请求头
 * @returns {object} 处理后的请求配置
 */
function requestInterceptor(config, headers = {}, isFileUpload = false) {
  // 仅当请求方法是 POST 或者 PUT 时，且没有 Content-Type 请求头，且不是文件上传时才添加该请求头为 application/json
  const defaultHeaders = {
    ...headers
  };
  // 判断是否为文件上传请求 - 对于文件上传请求，不需要设置默认的Content-Type
  if (['POST', 'PUT'].includes(config.method) && (!config.header || !config.header['Content-Type']) && !isFileUpload) {
    defaultHeaders['Content-Type'] = 'application/json';
  } 
  
  // 如果存在token，添加到请求头
  const token = userToken();
  if (token) {
    defaultHeaders[X_USER_TOKEN] = token;
    defaultHeaders['Authorization'] = token;
  }
  
  // 合并请求配置
  return {
    ...config,
    header: {
      ...defaultHeaders,
      ...config.header
    }
  };
}

/**
 * 响应拦截器
 * @param {object} response - 响应对象
 * @returns {Promise<any>} 处理后的响应数据
 */
async function responseInterceptor(response) {
  const { statusCode, data, header } = response;
  
  // 处理HTTP状态码
  if (statusCode >= 200 && statusCode < 300) {
    return data;
  } else {
    // 构造错误对象
    const error = {
      message: `HTTP错误 ${statusCode}`,
      response,
      statusCode
    };
    
    throw error;
  }
}

/**
 * 处理请求错误
 * @param {any} error - 错误对象
 * @returns {never} 抛出错误
 */
function handleRequestError(error) {
  // 处理网络错误
  if (error.errMsg && error.errMsg.includes('request:fail')) {
    wx.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    });
    throw new Error('网络错误');
  }
  
  // 处理认证失败或过期
  if (error.statusCode === 401 || (error.message && (error.message.includes('401') || error.message.includes('未授权')))) {
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    });
    // 清除token
    clearCookie(X_USER_TOKEN);
    // 跳转到登录页
    wx.redirectTo({
      url: '/pages/login/login'
    });
    throw new Error('认证失败');
  }
  
  // 处理权限不足
  if (error.statusCode === 403 || (error.message && (error.message.includes('403') || error.message.includes('禁止访问')))) {
    wx.showToast({
      title: '没有权限执行此操作',
      icon: 'none'
    });
    throw new Error('权限不足');
  }
  
  // 处理状态码为400且thr为true的错误
  if (error.statusCode === 400 && error.response && error.response.data && error.response.data.thr === true) {
    wx.showToast({
      title: error.response.data.msg || '请求错误',
      icon: 'none'
    });
    throw new Error(error.response.data.msg || '请求错误');
  }
  
  // 显示其他错误信息
  if (error.message) {
    wx.showToast({
      title: error.message,
      icon: 'none'
    });
  } else {
    wx.showToast({
      title: '请求失败，请稍后重试',
      icon: 'none'
    });
  }
  
  // 其他错误保持原样抛出
  throw error;
}

/**
 * 通用请求方法
 * @param {string} uri - 请求路径
 * @param {object} options - 请求选项
 * @returns {Promise<any>} 请求结果
 */
const request = async (uri, options = {}) => {
  try {
    // 构建查询参数
    let queryString = '';
    if (options.queries) {
      const searchParams = new URLSearchParams();
      Object.keys(options.queries).forEach(key => {
        if (options.queries[key] !== undefined && options.queries[key] !== null) {
          searchParams.append(key, options.queries[key]);
        }
      });
      const paramsString = searchParams.toString();
      if (paramsString) {
        // 检查uri是否已经包含查询参数
        const separator = uri.includes('?') ? '&' : '?';
        queryString = `${separator}${paramsString}`;
      }
    }
    
    // 构建完整URL
    const url = combineUrl(uri) + queryString;
    
    // 构建请求配置
    const requestConfig = {
      url,
      method: options.method || 'GET',
      ...options
    };
    
    // 检查是否需要文件上传
    if (options.file || options.files) {
      // 移除options中不属于wx.uploadFile的属性
      delete requestConfig.queries;
      delete requestConfig.headers;
      delete requestConfig.data;
      delete requestConfig.file;
      delete requestConfig.files;
      delete requestConfig.name;
      
      // 应用请求拦截器
      const config = requestInterceptor(requestConfig, options.headers, true);
      
      // 使用wx.uploadFile处理文件上传
      return new Promise((resolve, reject) => {
        // 单文件上传
        if (options.file) {
          wx.uploadFile({
            ...config,
            filePath: options.file,
            name: options.name || 'file',
            formData: options.data,
            success: (response) => {
              // 解析响应数据
              try {
                response.data = JSON.parse(response.data);
              } catch (e) {
                // 如果不是JSON格式，保持原样
              }
              // 应用响应拦截器
              responseInterceptor(response).then(resolve).catch(reject);
            },
            fail: (error) => {
              reject(error);
            }
          });
        } else if (options.files) {
          // 多文件上传（需要逐个上传）
          const uploadPromises = options.files.map((file, index) => {
            return new Promise((fileResolve, fileReject) => {
              wx.uploadFile({
                ...config,
                filePath: file,
                name: options.name || `file${index}`,
                formData: options.data,
                success: (response) => {
                  // 解析响应数据
                  try {
                    response.data = JSON.parse(response.data);
                  } catch (e) {
                    // 如果不是JSON格式，保持原样
                  }
                  fileResolve(response);
                },
                fail: (error) => {
                  fileReject(error);
                }
              });
            });
          });
          
          // 等待所有文件上传完成
          Promise.all(uploadPromises)
            .then((responses) => {
              // 应用响应拦截器到第一个响应
              responseInterceptor(responses[0]).then(resolve).catch(reject);
            })
            .catch(reject);
        }
      });
    } else {
      // 如果有data参数且是POST/PUT请求，设置请求体
      if (options.data && ['POST', 'PUT'].includes(requestConfig.method)) {
        // 微信小程序环境处理
        if (typeof options.data === 'string') {
          // 已序列化的字符串，直接使用
          requestConfig.data = options.data;
        } else {
          // 其他情况进行JSON序列化
          requestConfig.data = JSON.stringify(options.data);
          requestConfig.header = {
            ...requestConfig.header,
            'Content-Type': 'application/json'
          };
        }
      }
      
      // 移除options中不属于wx.request的属性
      delete requestConfig.queries;
      delete requestConfig.headers;
      
      // 应用请求拦截器
      const config = requestInterceptor(requestConfig, options.headers);
      
      // 发送请求（使用Promise包装wx.request）
      return new Promise((resolve, reject) => {
        wx.request({
          ...config,
          success: (response) => {
            // 应用响应拦截器
            responseInterceptor(response).then(resolve).catch(reject);
          },
          fail: (error) => {
            reject(error);
          }
        });
      });
    }
  } catch (error) {
    // 处理请求错误
    return handleRequestError(error);
  }
};

/**
 * 封装GET请求
 * @param {string} uri - 请求路径
 * @param {object} queries - 查询参数
 * @param {object} headers - 请求头
 * @returns {Promise<any>} 请求结果
 */
const get = async (uri, queries, headers) => {
  return request(uri, {
    method: 'GET',
    queries,
    headers
  });
};

/**
 * 封装POST请求
 * @param {string} uri - 请求路径
 * @param {any} data - 请求数据
 * @param {object} queries - 查询参数
 * @param {object} headers - 请求头
 * @returns {Promise<any>} 请求结果
 */
const post = async (uri, data, queries, headers) => {
  return request(uri, {
    method: 'POST',
    data,
    queries,
    headers
  });
};

/**
 * 封装PUT请求
 * @param {string} uri - 请求路径
 * @param {any} data - 请求数据
 * @param {object} queries - 查询参数
 * @param {object} headers - 请求头
 * @returns {Promise<any>} 请求结果
 */
const put = async (uri, data, queries, headers) => {
  return request(uri, {
    method: 'PUT',
    data,
    queries,
    headers
  });
};

/**
 * 封装DELETE请求
 * @param {string} uri - 请求路径
 * @param {object} queries - 查询参数
 * @param {object} headers - 请求头
 * @returns {Promise<any>} 请求结果
 */
const del = async (uri, queries, headers) => {
  return request(uri, {
    method: 'DELETE',
    queries,
    headers
  });
};

/**
 * 登录方法
 * @param {string} uri - 登录接口路径
 * @param {any} credentials - 登录凭证
 * @param {object} customHeaders - 自定义请求头
 * @returns {Promise<any>} 登录结果
 */
const login = async (uri, credentials, customHeaders) => {
  // 合并自定义headers和默认headers
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };
  
  // 发送请求
  const response = await request(uri, {
    method: 'POST',
    headers,
    data: credentials
  });
  
  // 存储token
  if (response.data) {
    setCookie(X_USER_TOKEN, response.data, 365);
  }
  
  return response;
};

/**
 * 注册方法
 * @param {string} uri - 注册接口路径
 * @param {any} userData - 用户数据
 * @returns {Promise<any>} 注册结果
 */
const register = async (uri, userData) => {
  return post(uri, userData);
};

/**
 * 登出方法
 * @returns {Promise<void>} 登出结果
 */
const logout = async () => {
  try {
    const token = userToken();
    await del('/open/user/auth/logout', { token });
  } finally {
    // 无论成功失败都清除token
    clearCookie(X_USER_TOKEN);
    // 跳转到首页
    wx.redirectTo({
      url: '/pages/index/index'
    });
  }
};

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
const userHadLoggedIn = () => {
  return userToken() !== undefined;
};

// 统一导出API对象
const api = {
  request,
  get,
  post,
  put,
  delete: del,
  login,
  register,
  logout,
  userToken,
  userHadLoggedIn
};

// CommonJS导出
module.exports = {
  api,
  ...api
};