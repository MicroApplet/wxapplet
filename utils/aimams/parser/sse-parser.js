/**
 * SSE 帧解析器
 * 平台无关，输入文本块，逐 event 回调
 *
 * SSE 标准格式：
 *   event: eventName
 *   data: {"key": "value"}
 *
 *   空行表示事件结束
 */

export function parseSseChunk(chunk, callback) {
  if (!chunk || typeof chunk !== 'string') return;

  const lines = chunk.split('\n');
  let currentEvent = 'message';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.substring(7).trim();
    } else if (line.startsWith('data: ')) {
      currentData = line.substring(6).trim();
    } else if (line === '') {
      // 空行 = 事件结束
      if (currentData === '[DONE]') {
        callback('done', null);
      } else if (currentData) {
        try {
          const payload = JSON.parse(currentData);
          callback(currentEvent, payload);
        } catch (e) {
          callback('error', { code: 'PARSE_ERROR', message: 'SSE 数据解析失败', raw: currentData });
        }
      }
      currentEvent = 'message';
      currentData = '';
    }
    // 忽略注释行（以 : 开头）和未知行
  }

  // 处理流末尾可能缺少空行的情况
  if (currentData) {
    if (currentData === '[DONE]') {
      callback('done', null);
    } else {
      try {
        const payload = JSON.parse(currentData);
        callback(currentEvent, payload);
      } catch (e) {
        // 不完整的行，等待下一个 chunk
      }
    }
  }
}
