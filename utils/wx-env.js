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
    // 应用相关配置
    xAppId: '335233980152156161',
    appid: "wx4f5939c1b3d39bd2",
  },
  // 测试环境
  trial: {
    baseUrl: 'http://test-api.example.com',
    apiPrefix: '/api',
    debug: true,
    // 应用相关配置
    xAppId: '335233980152156161',
    appid: "wxd5013edcdd858d83",
  },
  // 生产环境
  release: {
    baseUrl: 'http://api.example.com',
    apiPrefix: '/api',
    debug: false,
    // 应用相关配置
    xAppId: '335233980152156161',
    appid: "wxd5013edcdd858d83",
  },
};

/**
 * 获取当前环境
 * 在微信小程序中，通过全局配置或编译条件来区分环境
 */
function getCurrentEnv() {
  // 获取当前小程序的运行版本
  const versionInfo = wx.getAccountInfoSync();
  return versionInfo.miniProgram.envVersion;
}

/**
 * 获取当前环境配置
 */
function env() {
  const currentEnv = getCurrentEnv();
  return configs[currentEnv] || configs.development;
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
exports.wxAppId = currentConfig.appid;
exports.xAppChlAppid = currentConfig.appid;
exports.xAppChlAppType = "wechat:applet";