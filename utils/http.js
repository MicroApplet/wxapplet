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
 * @param {number} [timeout=10000] - 超时时间，默认10秒
 * @returns {Promise} 返回Promise对象
 */
function request(method, baseUrl, context, uri, quires, headers, data, timeout = 10000) {
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
    const makeRequest = () => {
      let requestCompleted = false;
      const timer = setTimeout(() => {
        if (!requestCompleted) {
          const timeoutError = { errMsg: `请求超时：${url}`, timeout: true };
          // 保留原有的URL信息以便调试
          reject(timeoutError);
        }
      }, timeout);

      wx.request({
        ...requestConfig,
        success: (res) => {
          requestCompleted = true;
          clearTimeout(timer);

          // 检查响应状态码，如果是错误状态码（4xx或5xx），则reject
          if (res.statusCode && (res.statusCode >= 400)) {
            // 创建错误对象，包含状态码信息
            const error = {
              statusCode: res.statusCode,
              errMsg: `HTTP请求失败: ${res.statusCode}`,
              response: res,
              // 对于401错误特别标记
              is401Error: res.statusCode === 401
            };
            reject(error);
          } else {
            resolve(res);
          }
        },
        fail: (error) => {
          requestCompleted = true;
          clearTimeout(timer);
          reject(error);
        },
        complete: () => {
          requestCompleted = true;
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
 * @param {number} [timeout=10000] - 超时时间
 * @returns {Promise} 返回Promise对象
 */
function get(baseUrl, context, uri, quires, headers, timeout = 10000) {
  return request('GET', baseUrl, context, uri, quires, headers, null, timeout);
}

/**
 * POST请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [timeout=10000] - 超时时间
 * @returns {Promise} 返回Promise对象
 */
function post(baseUrl, context, uri, data, quires, headers, timeout = 10000) {
  // 如果没有提供headers，使用默认的POST请求头
  const defaultHeaders = { ...headers };

  // 确保Content-Type已设置
  if (!defaultHeaders['Content-Type']) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  return request('POST', baseUrl, context, uri, quires, defaultHeaders, data, timeout);
}

/**
 * PUT请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [timeout=10000] - 超时时间
 * @returns {Promise} 返回Promise对象
 */
function put(baseUrl, context, uri, data, quires, headers, timeout = 10000) {
  // 如果没有提供headers，使用默认的PUT请求头
  const defaultHeaders = { ...headers };

  // 确保Content-Type已设置
  if (!defaultHeaders['Content-Type']) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  return request('PUT', baseUrl, context, uri, quires, defaultHeaders, data, timeout);
}

/**
 * DELETE请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [data] - 请求体数据（可选）
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [timeout=10000] - 超时时间
 * @returns {Promise} 返回Promise对象
 */
function del(baseUrl, context, uri, data, quires, headers, timeout = 10000) {
  return request('DELETE', baseUrl, context, uri, quires, headers, data, timeout);
}

/**
 * HEAD请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [timeout=10000] - 超时时间
 * @returns {Promise} 返回Promise对象
 */
function head(baseUrl, context, uri, quires, headers, timeout = 10000) {
  return request('HEAD', baseUrl, context, uri, quires, headers, null, timeout);
}

/**
 * OPTIONS请求便捷函数
 * @param {string} baseUrl - 基础URL
 * @param {string} [context] - 上下文路径
 * @param {string} uri - 请求路径
 * @param {Object} [quires] - 查询参数
 * @param {Object} [headers] - 请求头
 * @param {number} [timeout=10000] - 超时时间
 * @returns {Promise} 返回Promise对象
 */
function option(baseUrl, context, uri, quires, headers, timeout = 10000) {
  return request('OPTIONS', baseUrl, context, uri, quires, headers, null, timeout);
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
 * @param {number} [timeout=30000] - 超时时间，默认30秒
 * @returns {Promise} 返回Promise对象
 */
function upload(baseUrl, context, uri, filePath, name = 'file', formData = {}, quires, headers, onProgressUpdate, timeout = 30000) {
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
  const makeUpload = () => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const timeoutError = { errMsg: `文件上传超时：${url}`, timeout: true };
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

          resolve(res);
        },
        fail: (error) => {
          clearTimeout(timer);

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
