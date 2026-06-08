/**
 * AimamsClient — 统一 SSE 客户端
 *
 * 用法：
 *   const client = new AimamsClient({ url: '/ai/chat', token: 'xxx' });
 *   client.on('text', (payload) => console.log(payload.text));
 *   client.send('你好');
 *
 * CommonJS 版本
 */

const { getTransport } = require('./transport/index.js');

class AimamsClient {
  constructor(options = {}) {
    this.url = options.url;
    this.token = options.token;
    this.platform = options.platform || 'auto';
    this.headers = options.headers || {};
    this._listeners = {};
    this._transport = null;
    this._connected = false;

    // 快捷回调
    if (options.onThinking) this.on('thinking', options.onThinking);
    if (options.onToolCall) this.on('tool_call', options.onToolCall);
    if (options.onToolResult) this.on('tool_result', options.onToolResult);
    if (options.onText) this.on('text', options.onText);
    if (options.onData) this.on('data', options.onData);
    if (options.onUi) this.on('ui', options.onUi);
    if (options.onError) this.on('error', options.onError);
    if (options.onRequireInput) this.on('require_input', options.onRequireInput);
    if (options.onDone) this.on('done', options.onDone);
  }

  /**
   * 注册事件监听
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    return this;
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    const cbs = this._listeners[event];
    if (!cbs) return this;
    if (callback) {
      this._listeners[event] = cbs.filter(cb => cb !== callback);
    } else {
      delete this._listeners[event];
    }
    return this;
  }

  /**
   * 发送消息
   */
  async send(message, sessionId) {
    if (this._connected) {
      this._closeTransport();
    }

    const createTransport = await getTransport(this.platform);

    this._transport = createTransport({
      url: this.url,
      token: this.token,
      headers: this.headers,
      onEvent: (event, payload) => this._emit(event, payload),
      onError: (payload) => this._emit('error', payload),
      onDone: () => {
        this._connected = false;
        this._emit('done', null);
      }
    });

    this._connected = true;
    this._transport.connect({ message, sessionId });
  }

  /**
   * 关闭连接
   */
  close() {
    this._closeTransport();
  }

  _closeTransport() {
    if (this._transport) {
      this._transport.close();
      this._transport = null;
    }
    this._connected = false;
  }

  _emit(event, payload) {
    const cbs = this._listeners[event];
    if (cbs) {
      cbs.forEach(cb => {
        try { cb(payload); } catch (e) { console.error(`AimamsClient 事件处理异常 [${event}]:`, e); }
      });
    }
  }
}

module.exports = { AimamsClient };
module.exports.default = AimamsClient;
