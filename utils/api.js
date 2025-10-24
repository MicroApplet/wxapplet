// 引入依赖模块
const { header, refreshUserToken } = require('./header');
const { parse, authenticated } = require('./response');

/**
 * 通用请求函数
 * @param {string} uri - API路径
 * @param {Object} options - 请求选项
 * @param {string} options.method - HTTP方法
 * @param {Object} options.data - 请求数据
 * @param {Object} options.headers - 请求头
 * @param {boolean} options.tryLogin - 是否尝试登录
 * @param {Function} options.pageCallable - 分页回调
 * @param {Function} options.throwCallable - 错误回调
 * @param {Function} options._401AuthCallable - 401回调
 * @param {Function} options._403ForbiddenCallable - 403回调
 * @returns {Promise} Promise对象
 */
function request(uri, options = {}) {
  const {
    method = 'GET',
    data = {},
    headers = {},
    tryLogin = false,
    pageCallable = null,
    throwCallable = null,
    _401AuthCallable = null,
    _403ForbiddenCallable = null,
    _retryCount = 0 // 用于跟踪重试次数，防止无限重试
  } = options;

  const url = uri;
  
  // 构建请求头
  const requestHeaders = header(headers, tryLogin);

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      data,
      header: requestHeaders,
      method,
      success: (res) => {
        // 检查认证状态
        const authSuccess = authenticated(res, _401AuthCallable, _403ForbiddenCallable);
        if (!authSuccess) {
          console.log('认证失败，状态码:', res.statusCode);
          // 401处理逻辑
          if (!tryLogin && res.statusCode === 401 && _retryCount === 0) {
            // 如果tryLogin为false且还未重试过，则尝试刷新token并重试请求
            console.log('认证失败，尝试刷新token...');
            refreshUserToken();
            return request(uri, { 
                ...options, 
                _retryCount: _retryCount + 1 
            });
          } else {
            // 如果已经重试过一次，或者tryLogin为true，则不再重试
            reject(new Error('认证失败'));
          }
          return;
        }

        // 解析响应数据
        const parsedData = parse(res, pageCallable, throwCallable);
        resolve(parsedData);
      },
      fail: (error) => {
        console.error(`请求失败 [${method} ${uri}]:`, error);
        reject(error);
      }
    });
  });
}

/**
 * GET 请求
 * @param {string} uri - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function get(uri, options = {}) {
  return request(uri, { ...options, method: 'GET' });
}

/**
 * POST 请求
 * @param {string} uri - API路径
 * @param {Object} data - 请求数据
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function post(uri, data = {}, options = {}) {
  return request(uri, { ...options, method: 'POST', data });
}

/**
 * PUT 请求
 * @param {string} uri - API路径
 * @param {Object} data - 请求数据
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function put(uri, data = {}, options = {}) {
  return request(uri, { ...options, method: 'PUT', data });
}

/**
 * DELETE 请求
 * @param {string} uri - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function del(uri, options = {}) {
  return request(uri, { ...options, method: 'DELETE' });
}

/**
 * HEAD 请求
 * @param {string} uri - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function head(uri, options = {}) {
  return request(uri, { ...options, method: 'HEAD' });
}

/**
 * OPTIONS 请求
 * @param {string} uri - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function options(uri, options = {}) {
  return request(uri, { ...options, method: 'OPTIONS' });
}

/**
 * TRACE 请求
 * @param {string} uri - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function trace(uri, options = {}) {
  return request(uri, { ...options, method: 'TRACE' });
}

/**
 * CONNECT 请求
 * @param {string} uri - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise} Promise对象
 */
function connect(uri, options = {}) {
  return request(uri, { ...options, method: 'CONNECT' });
}

// 导出函数和REST API对象
module.exports = {
  // 基础方法
  request,
  get,
  post,
  put,
  delete: del,
  head,
  options,
  trace,
  connect,
};