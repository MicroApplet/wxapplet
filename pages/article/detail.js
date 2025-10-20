// 文章详情页面逻辑
Page({
  data: {
    articleId: '',
    article: null,
    isLoading: true,
    webViewUrl: ''
  },

  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    // 获取从上一个页面传来的文章ID
    if (options.id) {
      this.setData({
        articleId: options.id
      });
      this.loadArticleDetail();
    } else {
      // 如果没有ID参数，显示错误信息
      wx.showToast({
        title: '文章ID不存在',
        icon: 'none'
      });
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载文章详情
  loadArticleDetail: function () {
    this.setData({
      isLoading: true
    });

    // 模拟API请求获取文章详情
    // 由于没有实际的文章服务，这里使用mock数据
    setTimeout(() => {
      // 模拟从文章列表中找到对应的文章
      const articleList = this.getMockArticleList();
      const article = articleList.find(item => item.id === this.data.articleId);

      if (article) {
        this.setData({
          article: article,
          webViewUrl: article.url,
          isLoading: false
        });
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: article.title
        });
      } else {
        this.setData({
          isLoading: false
        });
        wx.showToast({
          title: '文章不存在',
          icon: 'none'
        });
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }, 500);
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

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
});
