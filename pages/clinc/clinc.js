//clinc.js

// 导入工具和会话管理
const { RoleCode, RoleUtil } = require('../../utils/role-enum.js');
const { refresh, refreshSession } = require('../../utils/session.js');
const { rest } = require('../../utils/api.js');
const { rest: buildRestUrl } = require('../../utils/url.js');

/**
 * 医疗页面组件
 * 负责展示用药提醒和处方台账功能
 */
Page({
  /**
   * 页面初始数据
   */
  data: {
    // 用药提醒/处方台账模块相关数据
    isCheckingRole: true,
    showPrescriptionModule: false,
    showBothModules: false,
    userRole: '', // normal, professional, both
    prescriptionInfo: {
      lastDate: '',
      lastDays: 0,
      nextDate: ''
    },
    daysRemaining: -1,
    ledgerList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log('医疗页面加载');

    // 注册到全局通知系统，以便接收会话信息变更通知
    const app = getApp();
    app.registerPage(this);

    console.log('clinc页面加载');
    // 在所有操作之前先调用session的refresh函数
    refreshSession().then(() => {
      // refresh函数调用完成后，加载其他信息
      this.load();
    }).catch(error => {
      console.error('刷新会话失败:', error);
      // 即使刷新失败也继续加载用户信息
      this.load();
    });

  },

  
  // 加载clinc信息的统一方法
  load() {
   
    // 设置加载状态为完成
    this.setData({
      isLoading: false
    });
  },


  /**
   * 检查用户角色并设置对应的数据展示
   * @param {BigInt|number} roleBit - 用户角色位图
   */
  checkUserRole: function(roleBit) {
    if (!roleBit) {
      this._handleSessionError();
      return;
    }

    // 检查是否为超管或同时拥有普通用户和专业用户权限
    const isRootUser = RoleUtil.contains(roleBit, RoleCode.ROOT);
    const isAdmin = RoleUtil.isAdmin(roleBit);
    const hasBothPermissions = RoleUtil.isNormalUser(roleBit) && RoleUtil.isProfessionalUser(roleBit);

    if (isRootUser || isAdmin || hasBothPermissions) {
      // 超管、管理员或同时拥有两种权限的用户，同时显示两个模块
      this.setData({
        userRole: 'both',
        showPrescriptionModule: true,
        showBothModules: true,
        isCheckingRole: false
      });
      // 同时获取用药提醒和处方台账数据
      this.getPrescriptionReminder();
      this.getPrescriptionLedger();
    } else if (RoleUtil.isNormalUser(roleBit)) {
      this.setData({
        userRole: 'normal',
        showPrescriptionModule: true,
        showBothModules: false,
        isCheckingRole: false
      });
      this.getPrescriptionReminder();
    } else if (RoleUtil.isProfessionalUser(roleBit)) {
      this.setData({
        userRole: 'professional',
        showPrescriptionModule: true,
        showBothModules: false,
        isCheckingRole: false
      });
      this.getPrescriptionLedger();
    } else {
      this._handleSessionError();
    }
  },

  /**
   * 获取用药提醒信息
   * 根据接口文档实现真实的API调用
   */
  getPrescriptionReminder: async function() {
    try {
      // 构建API URL
      const apiUrl = buildRestUrl('/clinc/prescription/reminder/list', { page: 1, size: 1 });
      
      // 调用API获取数据
      const response = await rest.get(apiUrl);

      if (response && response.length > 0) {
        // 接口返回的是数组，我们取第一个元素作为用药提醒信息
        const prescriptionInfo = response[0];
        // 计算剩余天数
        const daysRemaining = this.calculateDaysRemaining(prescriptionInfo.nextDate);

        this.setData({
          prescriptionInfo: prescriptionInfo,
          daysRemaining: daysRemaining
        });
      }
    } catch (error) {
      console.error('获取用药提醒失败:', error);
      wx.showToast({
        title: '获取用药提醒失败',
        icon: 'none'
      });
    }
  },

  /**
   * 获取处方台账信息
   * 在实际环境中调用真实接口获取数据
   */
  getPrescriptionLedger: async function() {
    try {
      // 构建API URL - 这里使用通用的用药提醒接口，但可以添加筛选条件
      const apiUrl = buildRestUrl('/clinc/prescription/reminder/list', { page: 1, size: 5 });
      
      // 调用API获取数据
      const response = await rest.get(apiUrl);

      if (response && response.length > 0) {
        // 由于接口返回的数据结构可能与台账数据不完全匹配，我们进行一些转换
        const ledgerList = response.map(item => ({
          patientName: item.phone || '未知用户', // 使用手机号作为患者标识
          prescriptionDate: item.lastDate || '',
          status: '已完成' // 简单处理状态
        }));
        
        this.setData({
          ledgerList: ledgerList
        });
      }
    } catch (error) {
      console.error('获取处方台账失败:', error);
      wx.showToast({
        title: '获取处方台账失败',
        icon: 'none'
      });
    }
  },

  /**
   * 计算距离下次开药的剩余天数
   * @param {string} nextDateStr - 下次开药日期字符串
   * @returns {number} 剩余天数
   */
  calculateDaysRemaining: function(nextDateStr) {
    if (!nextDateStr) return -1;

    try {
      const nextDate = new Date(nextDateStr);
      const currentDate = new Date();

      // 只比较年月日，忽略时间
      nextDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      const diffTime = nextDate - currentDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('计算剩余天数失败:', error);
      return -1;
    }
  },

  // 模拟数据方法已移除，现在使用真实API调用

  /**
   * 格式化日期为yyyy-MM-dd格式
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    console.log('医疗页面渲染完成');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log('医疗页面显示');
    // 重新从全局数据更新用户会话信息，确保显示最新数据
    this.updateUserSessionInfo();
  },
  
  /**
   * 从全局数据更新用户会话信息
   * 获取用户角色并更新页面内容
   */
  updateUserSessionInfo: function() {
    try {
      const app = getApp();
      if (app && app.globalData && app.globalData.sessionInfo) {
        const sessionInfo = app.globalData.sessionInfo;
        // 检查用户角色并设置对应的数据展示
        this.checkUserRole(sessionInfo.roleBit || 0);
      } else {
        // 如果没有会话信息，尝试刷新会话
        console.log('未获取到全局会话信息，尝试刷新');
        this._handleSessionError();
      }
    } catch (error) {
      console.error('更新用户会话信息失败:', error);
      this._handleSessionError();
    }
  },

  /**
   * 监听全局会话信息变更
   */
  onGlobalDataChange: function() {
    // 用户会话信息发生变更，重新更新数据
    console.log('全局会话信息变更，刷新医疗模块');
    this.updateUserSessionInfo();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    console.log('医疗页面隐藏');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log('医疗页面卸载');
    // 从全局通知系统注销
    const app = getApp();
    if (app && typeof app.unregisterPage === 'function') {
      app.unregisterPage(this);
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    // 重新加载数据
    this.updateUserSessionInfo();
    wx.stopPullDownRefresh();
  },

  /**
   * 监听用户点击页面内转发按钮
   * @returns {Object} 转发配置
   */
  onShareAppMessage: function() {
    return {
      title: '微信小程序医疗服务',
      path: '/pages/clinc/clinc'
    };
  }
});
