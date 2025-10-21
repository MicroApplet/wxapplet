/**
 * 解析wx.request返回结果
 * @param {Object} res - wx.request成功回调函数的返回结果
 * @returns {*} 业务数据负载
 */
function authenticated(res, _401AuthCallable = null, _403ForbiddenCallable = null) {
  console.log('响应信息：', res);
  console.log('响应状态码：', res.statusCode);
  if (res.statusCode >= 200 && res.statusCode < 300){
    return true;
  }

  if (res.statusCode === 401 && _401AuthCallable && typeof _401AuthCallable === 'function') {
    console.log('401 未授权错误');
    _401AuthCallable(res);
    return false;
  }

  if (res.statusCode === 403 && _403ForbiddenCallable && typeof _403ForbiddenCallable === 'function') {
    console.log('403 拒绝访问错误');
    _403ForbiddenCallable(res);
    return false;
  }
  return false;
}

/**
 * 解析wx.request返回结果
 * @param {Object} res - wx.request成功回调函数的返回结果
 * @param {Function} pageCallable - 处理分页展示逻辑的回调函数，可选，默认为null
 * @param {Function} throwCallable - 处理错误弹窗的回调函数，可选，默认为null
 * @returns {*} 业务数据负载
 */
function parse(res, pageCallable = null, throwCallable = null) {
  // 1. 从res中提取data字段值
  const responseData = res.data;

  if (!responseData) {
    return null;
  }

  // 2. 如果thr === true，且throwCallable不为空，则调用throwCallable函数
  if (responseData.thr === true && throwCallable && typeof throwCallable === 'function') {
    throwCallable(res);
  }

  // 3. 如果pageable === true，且pageCallable不为空，则调用pageCallable函数
  if (responseData.pageable === true && pageCallable && typeof pageCallable === 'function') {
    pageCallable(res);
  }

  // 4. 提取data字段值并返回
  return responseData.data;
}

// 导出parse函数
module.exports = { parse, authenticated };
