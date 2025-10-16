//index.js

// 导入API工具
// const { api } = require('../../utils/wx-api'); // 暂时未使用

Page({
  data: {
    message: 'Hello 微信小程序!',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    articleList: [],
    isLoading: false,
    currentPage: 1,
    hasMoreData: true
  },

  // 生命周期函数--监听页面加载
  onLoad: function () {
    console.log('首页加载');

    // 如果已经授权，可以直接获取用户信息
    if (wx.getStorageSync('userInfo')) {
      this.setData({
        userInfo: wx.getStorageSync('userInfo'),
        hasUserInfo: true
      });
    } else if (this.data.canIUse) {
      // 可以使用开放能力获取用户信息
      console.log('可以使用开放能力获取用户信息');
    } else {
      // 不支持开放能力，使用传统方式获取用户信息
      wx.getUserInfo({
        success: res => {
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          });
          wx.setStorageSync('userInfo', res.userInfo);
        }
      });
    }

    // 加载文章列表
    this.loadArticleList();
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
  },

  // 生命周期函数--监听页面隐藏
  onHide: function () {
    console.log('首页隐藏');
  },

  // 生命周期函数--监听页面卸载
  onUnload: function () {
    console.log('首页卸载');
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
