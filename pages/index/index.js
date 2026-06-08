const { AimamsClient } = require('../../utils/aimams/index.js');
const app = getApp();

Page({
  data: {
    messages: [],
    inputText: '',
    waiting: false,
    sessionId: '',
    thinkingText: ''
  },

  sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.waiting) return;
    this.setData({ inputText: '' });
    this._appendMessage('user', { type: 'text', content: text });
    this._callAi(text);
  },

  onInput(e) { this.setData({ inputText: e.detail.value }); },

  _callAi(message) {
    this.setData({ waiting: true, thinkingText: '正在连接…' });

    const client = new AimamsClient({
      url: 'https://api.aimams.cn/ai/chat',
      token: app.globalData.userSession?.token || '',
      platform: 'wechat',
      onThinking: (p) => {
        this.setData({ thinkingText: p.text || '思考中…' });
        this._updateLastAiMessage({ type: 'thinking', content: p.text });
      },
      onToolCall: (p) => {
        this.setData({ thinkingText: `正在调用: ${p.tool}` });
        this._updateLastAiMessage({ type: 'thinking', content: `正在调用: ${p.tool}` });
      },
      onText: (p) => {
        this._updateLastAiMessage({ type: 'text', content: p.text });
        this.setData({ thinkingText: '' });
      },
      onUi: (p) => {
        this._updateLastAiMessage({ type: 'ui', content: p });
        this.setData({ thinkingText: '' });
      },
      onData: (p) => {
        this._updateLastAiMessage({ type: 'data', content: p });
        this.setData({ thinkingText: '' });
      },
      onError: (p) => {
        this._updateLastAiMessage({ type: 'error', content: p.message || '出错了' });
        this.setData({ waiting: false, thinkingText: '' });
      },
      onRequireInput: (p) => {
        this._updateLastAiMessage({ type: 'text', content: p.question });
        this.setData({ waiting: false, thinkingText: '' });
      },
      onDone: () => this.setData({ waiting: false, thinkingText: '' })
    });

    client.send(message, this.data.sessionId);
    this._client = client;
  },

  _appendMessage(role, content) {
    const msg = { id: Date.now().toString(), role, content, timestamp: Date.now() };
    this.setData({ messages: [...this.data.messages, msg] });
    this._scrollToBottom();
  },

  _updateLastAiMessage(content) {
    let messages = [...this.data.messages];
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant') {
      messages[messages.length - 1] = { ...last, content };
    } else {
      messages.push({ id: Date.now().toString(), role: 'assistant', content, timestamp: Date.now() });
    }
    this.setData({ messages });
    this._scrollToBottom();
  },

  _scrollToBottom() {
    wx.nextTick(() => { wx.pageScrollTo({ scrollTop: 99999 }); });
  },

  onUnload() {
    if (this._client) { this._client.close(); this._client = null; }
  }
});
