/**
 * 微信小程序环境配置文件
 * 根据不同环境提供对应的配置参数
 */

// 不同环境的配置
const configs = {
  // 开发环境
  develop: {
    baseUrl: 'https://dev.api.asialjim.cn',
    apiPrefix: '/api',
    debug: true,
    xAppId: '335233980152156161',
  },
  // 测试环境
  trial: {
    baseUrl: 'http://test.api.example.com',
    apiPrefix: '/api',
    debug: true,
    xAppId: '335233980152156161',
  },
  // 生产环境
  release: {
    baseUrl: 'http://api.example.com',
    apiPrefix: '/api',
    debug: false,
    xAppId: '335233980152156161',
  }
};

/**
 * 获取当前环境
 * 在微信小程序中，通过全局配置或编译条件来区分环境
 */
function getCurrentEnv() {
  // 获取当前小程序的运行版本
  return wx.getAccountInfoSync().miniProgram.envVersion;
}

/**
 * 获取当前环境配置
 */
function env() {
  const currentEnv = getCurrentEnv();
  return configs[currentEnv] || configs.develop;
}

// 导出当前环境的配置作为默认值
const currentConfig = env();

// 导出模块
exports.configs = configs;
exports.getCurrentEnv = getCurrentEnv;
exports.env = env;
exports.default = currentConfig;

// 导出常用的配置项
exports.baseUrl = currentConfig.baseUrl;
exports.apiPrefix = currentConfig.apiPrefix;
exports.debug = currentConfig.debug;
// 导出应用相关配置
exports.xAppId = currentConfig.xAppId;
exports.xAppChl = "wechat";
exports.wxAppId =   wx.getAccountInfoSync().miniProgram.appId;
exports.xAppChlAppid = this.wxAppId;
exports.xAppChlAppType = "wechat:applet";