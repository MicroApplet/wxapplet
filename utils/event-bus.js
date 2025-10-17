/**
 * 小程序事件总线模块
 * 提供全局事件发布订阅功能，实现 wx.$on 和 wx.$emit 接口
 */

class EventBus {
  constructor() {
    // 存储事件监听器的对象
    this.events = {};
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {EventBus} 返回this以支持链式调用
   */
  on(eventName, callback) {
    if (!eventName || typeof callback !== 'function') {
      console.error('事件名称不能为空，回调必须是函数');
      return this;
    }

    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    // 将回调函数添加到事件监听器列表
    this.events[eventName].push(callback);
    console.log(`已订阅事件: ${eventName}`);
    return this;
  }

  /**
   * 发布事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 传递给监听器的数据
   * @returns {EventBus} 返回this以支持链式调用
   */
  emit(eventName, data) {
    const listeners = this.events[eventName];

    if (listeners && listeners.length > 0) {
      console.log(`发布事件: ${eventName}，监听器数量: ${listeners.length}`);

      // 遍历并调用所有监听器
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`执行事件监听器失败 (${eventName}):`, error);
        }
      });
    } else {
      console.warn(`未找到事件监听器: ${eventName}`);
    }

    return this;
  }

  /**
   * 取消订阅特定事件的特定监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 要移除的回调函数
   * @returns {EventBus} 返回this以支持链式调用
   */
  off(eventName, callback) {
    const listeners = this.events[eventName];

    if (listeners) {
      if (callback) {
        // 移除特定的监听器
        this.events[eventName] = listeners.filter(cb => cb !== callback);
        console.log(`已移除事件监听器: ${eventName}`);
      } else {
        // 如果没有提供回调函数，则移除所有该事件的监听器
        delete this.events[eventName];
        console.log(`已移除所有事件监听器: ${eventName}`);
      }
    }

    return this;
  }

  /**
   * 订阅一次性事件，触发后自动移除
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {EventBus} 返回this以支持链式调用
   */
  once(eventName, callback) {
    const onceCallback = (data) => {
      // 调用回调
      callback(data);
      // 触发后移除监听器
      this.off(eventName, onceCallback);
    };

    // 订阅事件
    this.on(eventName, onceCallback);
    console.log(`已订阅一次性事件: ${eventName}`);
    return this;
  }

  /**
   * 获取事件监听器数量
   * @param {string} eventName - 事件名称
   * @returns {number} 监听器数量
   */
  getListenerCount(eventName) {
    const listeners = this.events[eventName];
    return listeners ? listeners.length : 0;
  }

  /**
   * 清空所有事件监听器
   * @returns {EventBus} 返回this以支持链式调用
   */
  clear() {
    this.events = {};
    console.log('已清空所有事件监听器');
    return this;
  }
}

// 创建单例实例
const eventBus = new EventBus();

/**
 * 初始化事件总线，将其挂载到wx全局对象上
 */
function initEventBus() {
  // 挂载事件总线方法到wx对象
  wx.$on = eventBus.on.bind(eventBus);
  wx.$emit = eventBus.emit.bind(eventBus);
  wx.$off = eventBus.off.bind(eventBus);
  wx.$once = eventBus.once.bind(eventBus);

  console.log('事件总线初始化完成');

  return eventBus;
}

// 导出模块
module.exports = eventBus;
module.exports.initEventBus = initEventBus;
