// 引入env.js中的配置
const { baseUrl, apiPrefix } = require('./env');

/**
 * 构建开放页面URL
 * @param {string} uri - 要打开的页面路径(必须以 / 开头，如果不以 / 开头则在功能中添加 / 前缀)
 * @param {Object} queries - 要传递的查询参数对象，格式为 {key: value}
 * @returns {string} 完整的URL
 */
function open(uri, queries = {}) {
  // 检查并处理uri前缀
  if (!uri.startsWith('/')) {
    uri = '/' + uri;
  }
  
  // 构建基础URL
  let url = baseUrl + apiPrefix + '/open' + uri;
  
  // 处理查询参数
  if (queries && typeof queries === 'object' && Object.keys(queries).length > 0) {
    // 检查URL是否已经包含查询参数
    const hasQuery = url.includes('?');
    const separator = hasQuery ? '&' : '?';
    
    // 转换查询参数对象为查询字符串
    const queryString = Object.entries(queries)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // 添加查询字符串到URL
    url += separator + queryString;
  }
  
  return url;
}

// 导出open函数
module.exports = { open };