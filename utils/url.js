// 引入env.js中的配置
const { baseUrl, apiPrefix } = require('./env');

/**
 * 构建基础URL的通用函数
 * @param {string} type - URL类型（open/rest/admin）
 * @param {string} uri - 要打开的页面路径
 * @param {Object} queries - 查询参数对象
 * @returns {string} 完整的URL
 */
function buildUrl(type, uri, queries = {}) {
  // 检查并处理uri前缀
  if (!uri.startsWith('/')) {
    uri = '/' + uri;
  }

  // 构建基础URL
  let url = baseUrl + apiPrefix + '/' + type + uri;

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

/**
 * 构建开放页面URL
 * @param {string} uri - 要打开的页面路径(必须以 / 开头，如果不以 / 开头则在功能中添加 / 前缀)
 * @param {Object} queries - 要传递的查询参数对象，格式为 {key: value}
 * @returns {string} 完整的URL
 */
function open(uri, queries = {}) {
  return buildUrl('open', uri, queries);
}

/**
 * 构建REST API URL
 * @param {string} uri - 要打开的页面路径(必须以 / 开头，如果不以 / 开头则在功能中添加 / 前缀)
 * @param {Object} queries - 要传递的查询参数对象，格式为 {key: value}
 * @returns {string} 完整的URL
 */
function rest(uri, queries = {}) {
  return buildUrl('rest', uri, queries);
}

/**
 * 构建管理后台URL
 * @param {string} uri - 要打开的页面路径(必须以 / 开头，如果不以 / 开头则在功能中添加 / 前缀)
 * @param {Object} queries - 要传递的查询参数对象，格式为 {key: value}
 * @returns {string} 完整的URL
 */
function admin(uri, queries = {}) {
  return buildUrl('admin', uri, queries);
}

// 导出所有函数
module.exports = { open, rest, admin };
