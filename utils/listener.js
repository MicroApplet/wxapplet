/**
 * 全局事件监听器管理模块
 * 使用事件总线event-bus.js统一管理所有事件监听
 */

// 导入所需的模块和函数
const { userSession } = require('./api');

/**
 * 注册全局事件监听器，监听App.onShow事件并执行用户会话更新
 */
function registerAppShowListener() {
  console.log('正在注册App.onShow事件监听器（使用事件总线）');

  // 使用事件总线监听App.onShow事件
  if (wx.$on) {
    wx.$on('App.onShow', async (eventData) => {
      console.log('事件总线监听到App.onShow事件:', eventData);
      try {
        await userSession();
        console.log('App.onShow事件处理完成，已执行userSession');
      } catch (error) {
        console.error('App.onShow事件处理失败:', error);
      }
    });
    console.log('已通过事件总线注册App.onShow事件监听器');
  } else {
    console.error('事件总线未初始化，无法注册App.onShow事件监听器');
  }
}

/**
 * 初始化所有全局事件监听器
 */
function initGlobalListeners() {
  // 注册App.onShow事件监听器
  registerAppShowListener();

  console.log('所有全局事件监听器初始化完成');
}

// 当模块加载时自动初始化所有监听器
initGlobalListeners();

// 导出函数供外部调用
module.exports = {
  registerAppShowListener,
  initGlobalListeners
};
