//index.js

// 导入API工具
const api = require('../../utils/wx-api');
const { RoleCode, RoleUtil } = require('../../utils/role-enum.js');

Page({
  data: {
    message: 'Hello 微信小程序!',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    articleList: [],
    isLoading: false,
    currentPage: 1,
    hasMoreData: true,
    videoList: [],
    isVideoLoading: false,
    // 用药提醒/处方台账模块相关数据
    isCheckingRole: true,
    showPrescriptionModule: false,
    userRole: '', // normal, idCard, nurse, doctor
    prescriptionInfo: {
      lastDate: '',
      lastDays: 0,
      nextDate: ''
    },
    daysRemaining: -1,
    ledgerList: []
  },

  // 生命周期函数--监听页面加载
  onLoad: function () {
    console.log('首页加载');

    // 注册到全局通知系统，以便接收会话信息变更通知
    const app = getApp();
    app.registerPage(this);

    // 获取用户会话信息
    this.getUserSessionInfo();

    // 加载文章列表和视频列表
    this.loadArticleList();
    this.loadVideoList();
  },

  // 获取用户会话信息
  async getUserSessionInfo() {
    try {
      this.setData({ isCheckingRole: true });
      // 调用获取用户会话接口
      const response = await api.get('/rest/user/service/user/session');

      if (response && response.code === '0' && response.data) {
        const userData = response.data;
        // 检查用户角色
        this.checkUserRole(userData.roleBit);
      } else {
        // 没有data或roleBit字段，隐藏整个功能
        this.setData({
          showPrescriptionModule: false,
          isCheckingRole: false
        });
        // 这里不强制跳转登录页，让用户可以继续使用首页其他功能
        console.log('用户未登录或会话过期，显示首页基础内容');
      }
    } catch (error) {
      console.error('获取用户会话信息失败:', error);
      this.setData({
        showPrescriptionModule: false,
        isCheckingRole: false
      });
      // 捕获到错误时也不强制跳转登录页，让用户可以继续使用首页其他功能
      console.log('获取会话信息出错，显示首页基础内容');
    }
  },

  // 检查用户角色
  checkUserRole(roleBit) {
    if (!roleBit) {
      this.setData({
        showPrescriptionModule: false,
        isCheckingRole: false,
        showBothModules: false
      });
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
      this.setData({
        showPrescriptionModule: false,
        showBothModules: false,
        isCheckingRole: false
      });
    }
  },

  // 获取用药提醒信息
  async getPrescriptionReminder() {
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
    }
  },

  // 获取处方台账信息
  async getPrescriptionLedger() {
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
    }
  },

  // 计算距离下次开药的剩余天数
  calculateDaysRemaining(nextDateStr) {
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

  // 获取模拟用药提醒数据
  getMockPrescriptionReminder() {
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

  // 获取模拟处方台账数据
  getMockPrescriptionLedger() {
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

  // 格式化日期为yyyy-MM-dd格式
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 加载视频列表
  loadVideoList: function () {
    if (this.data.isVideoLoading) {
      return;
    }

    this.setData({
      isVideoLoading: true
    });

    // 模拟API请求获取视频列表
    setTimeout(() => {
      const mockVideoList = this.getMockVideoList();

      this.setData({
        videoList: mockVideoList,
        isVideoLoading: false
      });
    }, 800);
  },

  // 获取模拟视频列表数据
  getMockVideoList: function () {
    return [
      {
        id: '101',
        title: '微信小程序开发基础教程',
        thumbnail: 'https://via.placeholder.com/360x480/1aad19/ffffff?text=小程序教程',
        url: 'https://example.com/videos/tutorial1.mp4',
        duration: '05:30',
        views: 12580
      },
      {
        id: '102',
        title: '微信小程序性能优化技巧分享',
        thumbnail: 'https://via.placeholder.com/360x480/1aad19/ffffff?text=性能优化',
        url: 'https://example.com/videos/performance.mp4',
        duration: '08:45',
        views: 8920
      },
      {
        id: '103',
        title: '云开发实战演示',
        thumbnail: 'https://via.placeholder.com/360x480/1aad19/ffffff?text=云开发',
        url: 'https://example.com/videos/cloud.mp4',
        duration: '10:20',
        views: 6450
      },
      {
        id: '104',
        title: '微信小程序UI设计原则',
        thumbnail: 'https://via.placeholder.com/360x480/1aad19/ffffff?text=UI设计',
        url: 'https://example.com/videos/ui.mp4',
        duration: '06:15',
        views: 9870
      },
      {
        id: '105',
        title: '小程序安全开发指南',
        thumbnail: 'https://via.placeholder.com/360x480/1aad19/ffffff?text=安全开发',
        url: 'https://example.com/videos/security.mp4',
        duration: '07:30',
        views: 7630
      },
      {
        id: '106',
        title: '微信小程序最新特性介绍',
        thumbnail: 'https://via.placeholder.com/360x480/1aad19/ffffff?text=新特性',
        url: 'https://example.com/videos/new-features.mp4',
        duration: '04:50',
        views: 15230
      }
    ];
  },

  // 播放视频
  playVideo: function (e) {
    const videoId = e.currentTarget.dataset.id;
    const videoUrl = e.currentTarget.dataset.url;

    // 由于是模拟环境，我们使用微信小程序内置的视频播放器组件
    // 在实际项目中，可以跳转到专门的视频播放页面
    wx.showModal({
      title: '播放视频',
      content: `即将播放视频ID: ${videoId}`,
      confirmText: '播放',
      success: (res) => {
        if (res.confirm) {
          // 使用微信小程序的视频组件播放
          wx.createVideoContext('myVideo').play();

          // 记录播放历史（实际项目中）
          console.log('播放视频:', videoId, videoUrl);
        }
      }
    });
  },

  // 加载文章列表
  loadArticleList: function (refresh = false) {
    if (this.data.isLoading) {
      return;
    }

    // 如果是刷新操作，重置页面和数据
    if (refresh) {
      this.setData({
        currentPage: 1,
        articleList: [],
        hasMoreData: true
      });
    }

    // 如果没有更多数据，不再加载
    if (!this.data.hasMoreData) {
      return;
    }

    this.setData({
      isLoading: true
    });

    // 模拟API请求获取文章列表
    // 由于没有实际的文章服务，这里使用mock数据
    setTimeout(() => {
      const mockArticleList = this.getMockArticleList();

      // 模拟分页加载
      const pageSize = 5;
      const start = (this.data.currentPage - 1) * pageSize;
      const end = start + pageSize;
      const newArticles = mockArticleList.slice(start, end);

      // 将新数据添加到现有列表
      const updatedArticleList = refresh ? newArticles : [...this.data.articleList, ...newArticles];

      // 判断是否还有更多数据
      const hasMoreData = end < mockArticleList.length;

      this.setData({
        articleList: updatedArticleList,
        isLoading: false,
        hasMoreData: hasMoreData,
        currentPage: this.data.currentPage + 1
      });

      // 停止下拉刷新动画
      if (refresh) {
        wx.stopPullDownRefresh();
      }
    }, 1000);
  },

  // 获取模拟文章列表数据
  getMockArticleList: function () {
    return [
      {
        id: '1',
        title: '微信小程序开发入门指南',
        cover: 'https://via.placeholder.com/300x200/1aad19/ffffff?text=小程序开发',
        summary: '本文介绍微信小程序开发的基础知识，包括项目结构、页面开发、API调用等内容。',
        author: '微信开发团队',
        publishTime: '2024-01-15',
        readCount: 12580,
        url: 'https://developers.weixin.qq.com/miniprogram/dev/framework/'
      },
      {
        id: '2',
        title: '微信小程序性能优化实战',
        cover: 'https://via.placeholder.com/300x200/1aad19/ffffff?text=性能优化',
        summary: '深入探讨微信小程序的性能优化技巧，帮助开发者提升应用体验。',
        author: '技术专家张三',
        publishTime: '2024-01-20',
        readCount: 8920,
        url: 'https://developers.weixin.qq.com/miniprogram/dev/framework/performance/'
      },
      {
        id: '3',
        title: '微信小程序云开发实践',
        cover: 'https://via.placeholder.com/300x200/1aad19/ffffff?text=云开发',
        summary: '利用微信小程序云开发功能，快速搭建后端服务，实现数据存储和管理。',
        author: '云计算工程师李四',
        publishTime: '2024-01-25',
        readCount: 6450,
        url: 'https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html'
      },
      {
        id: '4',
        title: '微信小程序UI设计指南',
        cover: 'https://via.placeholder.com/300x200/1aad19/ffffff?text=UI设计',
        summary: '学习如何设计符合微信小程序设计规范的界面，提升用户体验。',
        author: 'UI设计师王五',
        publishTime: '2024-02-01',
        readCount: 9870,
        url: 'https://developers.weixin.qq.com/miniprogram/design/'
      },
      {
        id: '5',
        title: '微信小程序安全开发指南',
        cover: 'https://via.placeholder.com/300x200/1aad19/ffffff?text=安全开发',
        summary: '了解微信小程序开发中的安全隐患及防范措施，保障应用安全。',
        author: '安全专家赵六',
        publishTime: '2024-02-05',
        readCount: 7630,
        url: 'https://developers.weixin.qq.com/miniprogram/dev/framework/security/'
      }
    ];
  },

  // 跳转到文章详情页
  navigateToArticleDetail: function (e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${articleId}`
    });
  },

  // 生命周期函数--监听页面初次渲染完成
  onReady: function () {
    console.log('首页渲染完成');
  },

  // 生命周期函数--监听页面显示
  onShow: function () {
    console.log('首页显示');
    // 重新获取用户会话信息，确保显示最新数据
    this.getUserSessionInfo();
  },

  // 监听全局会话信息变更
  onGlobalDataChange: function() {
    // 用户会话信息发生变更，重新获取数据
    console.log('全局会话信息变更，刷新首页模块');
    this.getUserSessionInfo();
  },

  // 生命周期函数--监听页面隐藏
  onHide: function () {
    console.log('首页隐藏');
  },

  // 生命周期函数--监听页面卸载
  onUnload: function () {
    console.log('首页卸载');
    // 从全局通知系统注销
    const app = getApp();
    app.unregisterPage(this);
  },

  // 页面相关事件处理函数--监听用户下拉动作
  onPullDownRefresh: function () {
    console.log('下拉刷新');
    // 重新加载文章列表
    this.loadArticleList(true);
  },

  // 页面上拉触底事件的处理函数
  onReachBottom: function () {
    console.log('上拉触底');
    // 加载更多文章
    this.loadArticleList(false);
  },

  // 监听用户点击页面内转发按钮
  onShareAppMessage: function () {
    return {
      title: '微信小程序示例',
      path: '/pages/index/index'
    };
  },

  // 获取用户信息
  getUserInfo: function (e) {
    console.log('获取用户信息', e);
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      });
      wx.setStorageSync('userInfo', e.detail.userInfo);
    }
  },

  // 登出功能
  logout: function () {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息和token
          try {
            wx.removeStorageSync('userToken');
            wx.removeStorageSync('userInfo');

            // 清除全局数据
            const app = getApp();
            app.globalData.userInfo = null;
          } catch (e) {
            console.error('清除用户信息失败:', e);
          }

          // 跳转到登录页面
          wx.redirectTo({
            url: '/pages/login/login',
            success: () => {
              wx.showToast({
                title: '退出登录成功',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 跳转到日志页面
  goToLogs: function () {
    wx.navigateTo({
      url: '/pages/logs/logs'
    });
  }
});
