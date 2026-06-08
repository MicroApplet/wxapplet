/**
 * WeChat Transport — 基于 wx.request + enableChunked + onChunkReceived
 * 适用于微信小程序环境
 */

function createWechatTransport({ url, token, headers, onEvent, onError, onDone }) {
  let requestTask = null;
  let aborted = false;

  function connect(body) {
    return new Promise((resolve) => {
      if (aborted) return resolve();

      // 检测基础库版本
      const SDKVersion = wx.getSystemInfoSync().SDKVersion;
      if (compareVersion(SDKVersion, '2.14.0') < 0) {
        wx.showModal({
          title: '版本过低',
          content: '当前微信版本过低，请升级至最新版本后使用 AI 对话功能。',
          showCancel: false
        });
        onError({ code: 'LOW_VERSION', message: '微信基础库版本过低，需 ≥ 2.14.0' });
        return resolve();
      }

      requestTask = wx.request({
        url,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(headers || {})
        },
        data: body,
        enableChunked: true,
        responseType: 'text',
        success: () => {
          // 请求正常结束
          onDone && onDone();
        },
        fail: (err) => {
          if (aborted) return;
          onError({ code: 'REQUEST_FAILED', message: err.errMsg || '请求失败' });
        },
        complete: () => {
          resolve();
        }
      });

      // 监听 chunk 到达
      let buffer = '';
      requestTask.onChunkReceived((res) => {
        if (aborted) return;

        const { parseSseChunk } = require('../parser/sse-parser.js');
        const chunk = arrayBufferToString(res.data);
        buffer += chunk;

        // 按 \n\n 分割事件
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part.trim()) {
            parseSseChunk(part, (event, payload) => {
              if (event === 'done') {
                onDone && onDone();
              } else {
                onEvent(event, payload);
              }
            });
          }
        }
      });
    });
  }

  function close() {
    aborted = true;
    if (requestTask) {
      requestTask.abort();
      requestTask = null;
    }
  }

  return { connect, close };
}

/**
 * ArrayBuffer 转字符串
 */
function arrayBufferToString(buffer) {
  const uint8 = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < uint8.length; i++) {
    str += String.fromCharCode(uint8[i]);
  }
  return str;
}

/**
 * 版本号比较
 */
function compareVersion(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a !== b) return a - b;
  }
  return 0;
}

module.exports = { createWechatTransport };
