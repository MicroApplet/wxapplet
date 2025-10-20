//video.js

/**
 * 视频页面组件
 * 负责展示视频列表和播放视频
 */
Page({
  /**
   * 页面初始数据
   */
  data: {
    // 视频列表相关
    videoList: [],
    isVideoLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log('视频页面加载');
    // 加载视频列表
    this.loadVideoList();
  },

  /**
   * 加载视频列表
   */
  loadVideoList: function() {
    if (this.data.isVideoLoading) {
      return;
    }

    this.setData({
      isVideoLoading: true
    });

    // 模拟API请求获取视频列表
    setTimeout(() => {
      try {
        const mockVideoList = this.getMockVideoList();

        this.setData({
          videoList: mockVideoList,
          isVideoLoading: false
        });
      } catch (error) {
        console.error('加载视频列表失败:', error);
        this.setData({
          isVideoLoading: false
        });
        wx.showToast({
          title: '加载视频列表失败',
          icon: 'none'
        });
      }
    }, 800);
  },

  /**
   * 获取模拟视频列表数据
   * @returns {Array} 视频列表数据
   */
  getMockVideoList: function() {
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

  /**
   * 播放视频
   * @param {Object} e - 事件对象
   */
  playVideo: function(e) {
    const videoId = e.currentTarget.dataset.id;
    const videoUrl = e.currentTarget.dataset.url;

    // 由于是模拟环境，我们使用微信小程序内置的视频播放器组件
    wx.showModal({
      title: '播放视频',
      content: `即将播放视频ID: ${videoId}`,
      confirmText: '播放',
      success: (res) => {
        if (res.confirm) {
          // 使用微信小程序的视频组件播放
          const videoContext = wx.createVideoContext('myVideo');
          if (videoContext && typeof videoContext.play === 'function') {
            videoContext.play();
          }

          // 记录播放历史
          console.log('播放视频:', videoId, videoUrl);
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    console.log('视频页面渲染完成');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log('视频页面显示');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    console.log('视频页面隐藏');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log('视频页面卸载');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    // 重新加载视频列表
    this.loadVideoList();
    wx.stopPullDownRefresh();
  },

  /**
   * 监听用户点击页面内转发按钮
   * @returns {Object} 转发配置
   */
  onShareAppMessage: function() {
    return {
      title: '微信小程序视频',
      path: '/pages/video/video'
    };
  }
});
