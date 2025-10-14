/**
 * 微信小程序环境配置文件
 * 根据不同环境提供对应的配置参数
 */

// 不同环境的配置
const configs = {
  // 开发环境
  development: {
    baseUrl: 'https://dev.api.asialjim.cn',
    apiPrefix: '/api',
    debug: true,
    // 应用相关配置
    xAppId: '335233980152156161',
    xAppChl: 'wechat',
    xAppChlAppid: 'touristappid',
    xAppChlAppType: 'miniProgram',
    // 当前项目的微信小程序appid
    wxAppId: 'touristappid',
  },
  // 测试环境
  test: {
    baseUrl: 'http://test-api.example.com',
    apiPrefix: '/api',
    debug: true,
    // 应用相关配置
    xAppId: '335233980152156161',
    xAppChl: 'wechat',
    xAppChlAppid: 'touristappid',
    xAppChlAppType: 'miniProgram',
    // 当前项目的微信小程序appid
    wxAppId: 'touristappid',
  },
  // 生产环境
  production: {
    baseUrl: 'http://api.example.com',
    apiPrefix: '/api',
    debug: false,
    // 应用相关配置
    xAppId: '335233980152156161',
    xAppChl: 'wechat',
    xAppChlAppid: 'touristappid',
    xAppChlAppType: 'miniProgram',
    // 当前项目的微信小程序appid
    wxAppId: 'touristappid',
  },
};

/**
 * 获取当前环境
 * 在微信小程序中，通过全局配置或编译条件来区分环境
 */
function getCurrentEnv() {
  // 在实际项目中，可以通过小程序全局配置或编译条件来设置当前环境
  // 例如：使用微信开发者工具的条件编译，或者从全局配置中读取
  
  // 这里为了演示，默认返回development环境
  // 实际应用中，可以从app.js的globalData或者其他配置中获取
  return 'development';
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
exports.xAppChl = currentConfig.xAppChl;
exports.xAppChlAppid = currentConfig.xAppChlAppid;
exports.xAppChlAppType = currentConfig.xAppChlAppType;
exports.wxAppId = currentConfig.wxAppId;