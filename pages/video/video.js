//video.js
Page({
  data: {
    videoList: [
      {
        id: '1',
        src: 'https://vd3.bdstatic.com/mda-kiu0mht49t7200k8/sc/cae_h264/1685730568/mda-kiu0mht49t7200k8.mp4?v_from_s=hkapp-haokan-hnb&auth_key=1717331454-0-0-99272004a3b1736b0c3b24c78e4a39f3&bcevod_channel=searchbox_feed&pd=1&cd=0&pt=3&logid=3204247726&vid=20231213999950109083&abtest=0&klogid=3204247726',
        poster: 'https://t7.baidu.com/it/u=3378735320,4185607940&fm=193&f=GIF',
        title: '自然风光视频1',
        description: '美丽的山水风景，放松心情'
      },
      {
        id: '2',
        src: 'https://vd3.bdstatic.com/mda-kk63a5j06s8s4f3t/sc/cae_h264/1685730475/mda-kk63a5j06s8s4f3t.mp4?v_from_s=hkapp-haokan-hnb&auth_key=1717331454-0-0-530321568d15c3606422ff7913870466&bcevod_channel=searchbox_feed&pd=1&cd=0&pt=3&logid=3204248404&vid=20230619999950102055&abtest=0&klogid=3204248404',
        poster: 'https://t7.baidu.com/it/u=291753772,2463150195&fm=193&f=GIF',
        title: '美食制作教程',
        description: '简单易学的家常菜做法'
      },
      {
        id: '3',
        src: 'https://vd3.bdstatic.com/mda-kuqum3379i7m7l0c/sc/cae_h264/1685730593/mda-kuqum3379i7m7l0c.mp4?v_from_s=hkapp-haokan-hnb&auth_key=1717331454-0-0-355dd2a887bdf8e2c1bd1d82f88f1d3b&bcevod_channel=searchbox_feed&pd=1&cd=0&pt=3&logid=3204248890&vid=20230526999950107075&abtest=0&klogid=3204248890',
        poster: 'https://t7.baidu.com/it/u=2159889052,1683967048&fm=193&f=GIF',
        title: '运动健身指南',
        description: '在家就能做的健身动作'
      },
      {
        id: '4',
        src: 'https://vd3.bdstatic.com/mda-kl1n6ynv23j7i641/sc/cae_h264/1685730364/mda-kl1n6ynv23j7i641.mp4?v_from_s=hkapp-haokan-hnb&auth_key=1717331454-0-0-9a866e6e84b43b4b6968c50c9661988a&bcevod_channel=searchbox_feed&pd=1&cd=0&pt=3&logid=3204249483&vid=20230331999950107003&abtest=0&klogid=3204249483',
        poster: 'https://t7.baidu.com/it/u=3149742613,2798652642&fm=193&f=GIF',
        title: '旅行vlog',
        description: '探索未知的旅行目的地'
      },
      {
        id: '5',
        src: 'https://vd3.bdstatic.com/mda-kk94s7p8fvvx25a6/sc/cae_h264/1685730417/mda-kk94s7p8fvvx25a6.mp4?v_from_s=hkapp-haokan-hnb&auth_key=1717331454-0-0-77f1a24f6e5868e78ad9f93fe5ec2084&bcevod_channel=searchbox_feed&pd=1&cd=0&pt=3&logid=3204249938&vid=20230117999950101068&abtest=0&klogid=3204249938',
        poster: 'https://t7.baidu.com/it/u=3972234259,2416238747&fm=193&f=GIF',
        title: '科技产品评测',
        description: '最新科技产品体验分享'
      }
    ],
    currentVideoIndex: 0,
    startY: 0,
    currentVideoContext: null
  },

  onLoad() {
    console.log('视频页面加载');
    // 初始化视频上下文
    this.initVideoContext();
  },

  onShow() {
    console.log('视频页面显示');
    // 显示时自动播放当前视频
    if (this.data.currentVideoContext) {
      this.data.currentVideoContext.play();
    }
  },

  // 初始化视频上下文
  initVideoContext() {
    this.setData({
      currentVideoContext: wx.createVideoContext('myVideo')
    });
  },

  // 触摸开始事件
  onTouchStart(e) {
    this.setData({
      startY: e.touches[0].clientY
    });
  },

  // 触摸结束事件
  onTouchEnd(e) {
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - this.data.startY;
    
    // 上滑超过50px切换到下一个视频
    if (diffY < -50 && this.data.currentVideoIndex < this.data.videoList.length - 1) {
      this.nextVideo();
    }
    // 下滑超过50px切换到上一个视频
    else if (diffY > 50 && this.data.currentVideoIndex > 0) {
      this.prevVideo();
    }
  },

  // 播放下一个视频
  nextVideo() {
    if (this.data.currentVideoContext) {
      this.data.currentVideoContext.pause();
    }
    this.setData({
      currentVideoIndex: this.data.currentVideoIndex + 1
    }, () => {
      // 等待DOM更新后再创建新的视频上下文并播放
      this.initVideoContext();
      setTimeout(() => {
        if (this.data.currentVideoContext) {
          this.data.currentVideoContext.play();
        }
      }, 300);
    });
  },

  // 播放上一个视频
  prevVideo() {
    if (this.data.currentVideoContext) {
      this.data.currentVideoContext.pause();
    }
    this.setData({
      currentVideoIndex: this.data.currentVideoIndex - 1
    }, () => {
      // 等待DOM更新后再创建新的视频上下文并播放
      this.initVideoContext();
      setTimeout(() => {
        if (this.data.currentVideoContext) {
          this.data.currentVideoContext.play();
        }
      }, 300);
    });
  },

  // 视频播放错误处理
  onVideoError(e) {
    console.error('视频播放错误:', e.detail);
    wx.showToast({
      title: '视频加载失败',
      icon: 'none'
    });
  },

  // 视频加载完成
  onVideoLoaded() {
    console.log('视频加载完成');
  }
});
