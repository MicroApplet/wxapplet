//clinc.js

// 导入工具和会话管理
const { RoleCode, RoleUtil } = require('../../utils/role-enum.js');
const { refresh, UserSession } = require('../../utils/session.js');

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

  },


  /**
   * 处理会话错误的通用逻辑
   * @private
   */
  _handleSessionError: function() {
    this.setData({
      showPrescriptionModule: false,
      isCheckingRole: false,
      showBothModules: false
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
   * 在实际环境中，这里会调用真实接口获取数据
   */
  getPrescriptionReminder: async function() {
    try {
      // 在实际环境中调用接口
      // const response = await api.get('/rest/clinc/prescription/reminder/user/status');

      // 使用mock数据进行测试
      const mockResponse = this.getMockPrescriptionReminder();

      if (mockResponse.code === '0' && mockResponse.data) {
        const prescriptionInfo = mockResponse.data;
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
   * 在实际环境中，这里会调用真实接口获取数据
   */
  getPrescriptionLedger: async function() {
    try {
      // 在实际环境中调用接口
      // const response = await api.get('/rest/clinc/prescription/ledger', { page: 1, size: 5 });

      // 使用mock数据进行测试
      const mockResponse = this.getMockPrescriptionLedger();

      if (mockResponse.code === '0' && mockResponse.data) {
        this.setData({
          ledgerList: mockResponse.data
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

  /**
   * 获取模拟用药提醒数据
   * @returns {Object} 模拟的用药提醒响应数据
   */
  getMockPrescriptionReminder: function() {
    // 生成一些模拟数据
    const today = new Date();
    const lastDate = new Date(today);
    lastDate.setDate(today.getDate() - 30);

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 2); // 设置为2天后，测试少于3天的情况

    return {
      'status': 200,
      'thr': false,
      'pageable': false,
      'code': '0',
      'msg': '成功',
      'data': {
        'lastDate': this.formatDate(lastDate),
        'lastDays': 30,
        'nextDate': this.formatDate(nextDate)
      },
      'errs': [],
      'page': 1,
      'size': 1,
      'pages': 1,
      'total': 1
    };
  },

  /**
   * 获取模拟处方台账数据
   * @returns {Object} 模拟的处方台账响应数据
   */
  getMockPrescriptionLedger: function() {
    return {
      'status': 200,
      'thr': false,
      'pageable': false,
      'code': '0',
      'msg': '成功',
      'data': [
        {
          'patientName': '张三',
          'prescriptionDate': '2024-10-10',
          'status': '已完成'
        },
        {
          'patientName': '李四',
          'prescriptionDate': '2024-10-08',
          'status': '处理中'
        },
        {
          'patientName': '王五',
          'prescriptionDate': '2024-10-05',
          'status': '已完成'
        },
        {
          'patientName': '赵六',
          'prescriptionDate': '2024-10-01',
          'status': '已完成'
        },
        {
          'patientName': '孙七',
          'prescriptionDate': '2024-09-28',
          'status': '已取消'
        }
      ],
      'errs': [],
      'page': 1,
      'size': 5,
      'pages': 2,
      'total': 10
    };
  },

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
