// 基于 wx.request 实现 HTTP 客户端

/**
 * 通用HTTP请求工具函数（仅处理普通HTTP请求，不处理文件上传）
 * @param {string} method - HTTP方法，可选GET/POST/PUT/DELETE等
 * @param {string} [baseUrl] - 基础URL，不能以/结尾（如果uri已经是以http://或https://开头的完整URL，则baseUrl可以省略）
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径（可以是完整URL，以http://或https://开头）
 * @param {Object} [quires] - 查询参数，Map<String,String>
 * @param {Object} [headers] - 请求头，Map<String,String>
 * @param {any} [data] - 请求体数据
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间，默认10秒
 * @param {Function} [success] - 成功回调函数
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调函数
 * @returns {Promise} 返回Promise对象
 */
function request(method, baseUrl, context, uri, quires, headers, data, retries = 0, timeout = 10000, success, retryWhen, fail) {
  // 验证必需参数
  if (!method || !uri) {
    throw new Error('必需参数缺失：method 和 uri 是必需的');
  }

  // 检查uri是否已经是完整URL
  const isFullUrl = uri.startsWith('http://') || uri.startsWith('https://');
  let url;

  if (isFullUrl) {
    // 如果是完整URL，直接使用
    url = uri;
  } else {
    // 如果不是完整URL，则需要baseUrl
    if (!baseUrl) {
      throw new Error('必需参数缺失：当uri不是完整URL时，baseUrl是必需的');
    }

    // 确保 baseUrl 不以 / 结尾
    let normalizedBaseUrl = baseUrl;
    if (normalizedBaseUrl.endsWith('/')) {
      normalizedBaseUrl = normalizedBaseUrl.slice(0, -1);
    }

    // 构建完整URL
    url = normalizedBaseUrl;

    // 添加上下文路径
    if (context) {
      let normalizedContext = context;
      if (!normalizedContext.startsWith('/')) {
        normalizedContext = '/' + normalizedContext;
      }
      if (normalizedContext.endsWith('/')) {
        normalizedContext = normalizedContext.slice(0, -1);
      }
      url += normalizedContext;
    }

    // 添加请求路径
    if (uri) {
      let normalizedUri = uri;
      if (!normalizedUri.startsWith('/')) {
        normalizedUri = '/' + normalizedUri;
      }
      url += normalizedUri;
    }
  }

  // 添加查询参数
  if (quires && typeof quires === 'object') {
    const queryParams = [];
    for (const [key, value] of Object.entries(quires)) {
      if (value !== null && value !== undefined) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    if (queryParams.length > 0) {
      url += (url.includes('?') ? '&' : '?') + queryParams.join('&');
    }
  }

  // 定义请求配置
  const requestConfig = {
    url,
    method: method.toUpperCase(),
    header: headers || {},
    timeout,
    data
  };

  // 执行普通HTTP请求
  return new Promise((resolve, reject) => {
    const makeRequest = (currentRetries = 0) => {
      const timer = setTimeout(() => {
        const timeoutError = { errMsg: `请求超时：${url}`, timeout: true };
        if (fail && typeof fail === 'function') {
          fail(timeoutError);
        }
        reject(timeoutError);
      }, timeout);

      wx.request({
        ...requestConfig,
        success: (res) => {
          clearTimeout(timer);

          // 检查是否需要重试
          if (currentRetries < retries && retryWhen && typeof retryWhen === 'function' && retryWhen(res)) {
            console.log(`请求失败，正在进行第 ${currentRetries + 1} 次重试...`);
            setTimeout(() => {
              makeRequest(currentRetries + 1);
            }, 1000 * (currentRetries + 1)); // 指数退避策略
            return;
          }

          if (success && typeof success === 'function') {
            success(res);
          }
          resolve(res);
        },
        fail: (error) => {
          clearTimeout(timer);

          // 检查是否需要重试
          if (currentRetries < retries && retryWhen && typeof retryWhen === 'function' && retryWhen(error)) {
            console.log(`请求失败，正在进行第 ${currentRetries + 1} 次重试...`);
            setTimeout(() => {
              makeRequest(currentRetries + 1);
            }, 1000 * (currentRetries + 1)); // 指数退避策略
            return;
          }

          if (fail && typeof fail === 'function') {
            fail(error);
          }
          reject(error);
        },
        complete: () => {
          clearTimeout(timer);
        }
      });
    };

    // 发起请求
    makeRequest();
  });
}

/**
 * GET请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @returns {Promise} 返回Promise对象
 */
function get(baseUrl, context, uri, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail) {
  return request('GET', baseUrl, context, uri, quires, headers, null, retries, timeout, success, retryWhen, fail);
}

/**
 * POST请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @returns {Promise} 返回Promise对象
 */
function post(baseUrl, context, uri, data, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail) {
  // 如果没有提供headers，使用默认的POST请求头
  const defaultHeaders = { ...headers };

  // 确保Content-Type已设置
  if (!defaultHeaders['Content-Type']) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  return request('POST', baseUrl, context, uri, quires, defaultHeaders, data, retries, timeout, success, retryWhen, fail);
}

/**
 * PUT请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @returns {Promise} 返回Promise对象
 */
function put(baseUrl, context, uri, data, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail) {
  // 如果没有提供headers，使用默认的PUT请求头
  const defaultHeaders = { ...headers };

  // 确保Content-Type已设置
  if (!defaultHeaders['Content-Type']) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  return request('PUT', baseUrl, context, uri, quires, defaultHeaders, data, retries, timeout, success, retryWhen, fail);
}

/**
 * DELETE请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据（可选）
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @returns {Promise} 返回Promise对象
 */
function del(baseUrl, context, uri, data, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail) {
  return request('DELETE', baseUrl, context, uri, quires, headers, data, retries, timeout, success, retryWhen, fail);
}

/**
 * HEAD请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @returns {Promise} 返回Promise对象
 */
function head(baseUrl, context, uri, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail) {
  return request('HEAD', baseUrl, context, uri, quires, headers, null, retries, timeout, success, retryWhen, fail);
}

/**
 * OPTIONS请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [retries=0] - 重试次数
 * @param {number} [timeout=10000] - 超时时间
 * @param {Function} [success] - 成功回调
 * @param {Function} [retryWhen] - 重试条件函数
 * @param {Function} [fail] - 失败回调
 * @returns {Promise} 返回Promise对象
 */
function option(baseUrl, context, uri, quires, headers, retries = 0, timeout = 10000, success, retryWhen, fail) {
  return request('OPTIONS', baseUrl, context, uri, quires, headers, null, retries, timeout, success, retryWhen, fail);
}

/**
 * 文件上传专用函数（独立处理文件上传逻辑）
 * @param {string} [baseUrl] - 基础URL（如果uri已经是以http://或https://开头的完整URL，则baseUrl可以省略）
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径（可以是完整URL，以http://或https://开头）
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
 * @returns {Promise} 返回Promise对象
 */
function upload(baseUrl, context, uri, filePath, name = 'file', formData = {}, quires, headers, onProgressUpdate, retries = 0, timeout = 30000, success, retryWhen, fail) {
  // 验证必需参数
  if (!uri || !filePath) {
    throw new Error('必需参数缺失：uri 和 filePath 是必需的');
  }

  // 检查uri是否已经是完整URL
  const isFullUrl = uri.startsWith('http://') || uri.startsWith('https://');
  let url;

  if (isFullUrl) {
    // 如果是完整URL，直接使用
    url = uri;
  } else {
    // 如果不是完整URL，则需要baseUrl
    if (!baseUrl) {
      throw new Error('必需参数缺失：当uri不是完整URL时，baseUrl是必需的');
    }

    // 确保 baseUrl 不以 / 结尾
    let normalizedBaseUrl = baseUrl;
    if (normalizedBaseUrl.endsWith('/')) {
      normalizedBaseUrl = normalizedBaseUrl.slice(0, -1);
    }

    // 构建完整URL
    url = normalizedBaseUrl;

    // 添加上下文路径
    if (context) {
      let normalizedContext = context;
      if (!normalizedContext.startsWith('/')) {
        normalizedContext = '/' + normalizedContext;
      }
      if (normalizedContext.endsWith('/')) {
        normalizedContext = normalizedContext.slice(0, -1);
      }
      url += normalizedContext;
    }

    // 添加请求路径
    if (uri) {
      let normalizedUri = uri;
      if (!normalizedUri.startsWith('/')) {
        normalizedUri = '/' + normalizedUri;
      }
      url += normalizedUri;
    }
  }

  // 添加查询参数
  if (quires && typeof quires === 'object') {
    const queryParams = [];
    for (const [key, value] of Object.entries(quires)) {
      if (value !== null && value !== undefined) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    if (queryParams.length > 0) {
      url += (url.includes('?') ? '&' : '?') + queryParams.join('&');
    }
  }

  // 定义上传配置
  const uploadConfig = {
    url,
    filePath,
    name,
    formData: formData || {},
    header: headers || {},
    timeout
  };

  // 移除Content-Type，由wx.uploadFile自动设置为multipart/form-data
  delete uploadConfig.header['Content-Type'];

  // 实现重试逻辑的上传函数
  const makeUpload = (currentRetries = 0) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const timeoutError = { errMsg: `文件上传超时：${url}`, timeout: true };
        if (fail && typeof fail === 'function') {
          fail(timeoutError);
        }
        reject(timeoutError);
      }, timeout);

      const uploadTask = wx.uploadFile({
        ...uploadConfig,
        success: (res) => {
          clearTimeout(timer);

          // 尝试解析响应数据
          try {
            res.data = JSON.parse(res.data);
          } catch (error) {
            // 解析失败，保留原始数据
            console.log('JSON parse failed, keeping original data', error);
          }

          // 检查是否需要重试
          if (currentRetries < retries && retryWhen && typeof retryWhen === 'function' && retryWhen(res)) {
            console.log(`文件上传失败，正在进行第 ${currentRetries + 1} 次重试...`);
            setTimeout(() => {
              makeUpload(currentRetries + 1)
                .then(resolve)
                .catch(reject);
            }, 1000 * (currentRetries + 1)); // 指数退避策略
            return;
          }

          if (success && typeof success === 'function') {
            success(res);
          }
          resolve(res);
        },
        fail: (error) => {
          clearTimeout(timer);

          // 检查是否需要重试
          if (currentRetries < retries && retryWhen && typeof retryWhen === 'function' && retryWhen(error)) {
            console.log(`文件上传失败，正在进行第 ${currentRetries + 1} 次重试...`);
            setTimeout(() => {
              makeUpload(currentRetries + 1)
                .then(resolve)
                .catch(reject);
            }, 1000 * (currentRetries + 1)); // 指数退避策略
            return;
          }

          if (fail && typeof fail === 'function') {
            fail(error);
          }
          reject(error);
        },
        complete: () => {
          clearTimeout(timer);
        }
      });

      // 支持上传进度回调
      if (onProgressUpdate && typeof onProgressUpdate === 'function') {
        uploadTask.onProgressUpdate(onProgressUpdate);
      }
    });
  };

  // 执行上传
  return makeUpload();
}

// 导出所有函数
module.exports = {
  request,
  get,
  post,
  put,
  delete: del, // 使用del作为内部函数名，导出为delete
  head,
  option,
  upload
};
