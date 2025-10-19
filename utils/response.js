
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
module.exports = { parse };