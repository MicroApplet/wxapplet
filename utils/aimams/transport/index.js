/**
 * Transport 选择器
 * 根据平台自动选择对应的 transport 实现
 * CommonJS 版本
 */

async function getTransport(platform) {
  switch (platform) {
    case 'mock': {
      // 测试用 mock transport，由测试代码注入
      return () => null;
    }
    case 'browser': {
      const mod = await Promise.resolve().then(() => require('./browser.js'));
      return mod.createBrowserTransport;
    }
    case 'wechat': {
      const mod = await Promise.resolve().then(() => require('./wechat.js'));
      return mod.createWechatTransport;
    }
    case 'douyin': {
      const mod = await Promise.resolve().then(() => require('./douyin.js'));
      return mod.createDouyinTransport;
    }
    case 'alipay': {
      const mod = await Promise.resolve().then(() => require('./alipay.js'));
      return mod.createAlipayTransport;
    }
    default:
      // 自动检测
      if (typeof window !== 'undefined' && window.fetch) {
        const mod = require('./browser.js');
        return mod.createBrowserTransport;
      }
      if (typeof wx !== 'undefined' && wx.request) {
        const mod = require('./wechat.js');
        return mod.createWechatTransport;
      }
      if (typeof tt !== 'undefined' && tt.request) {
        const mod = require('./douyin.js');
        return mod.createDouyinTransport;
      }
      if (typeof my !== 'undefined' && my.request) {
        const mod = require('./alipay.js');
        return mod.createAlipayTransport;
      }
      throw new Error(`不支持的平台: ${platform}`);
  }
}

module.exports = { getTransport };
