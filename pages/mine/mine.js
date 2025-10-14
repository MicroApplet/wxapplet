// mine.js
Page({
  data: {
    nickname: '',
    isLoading: true
  },

  onLoad() {
    this.getUserSessionInfo();
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    this.getUserSessionInfo();
  },

  async getUserSessionInfo() {
    this.setData({ isLoading: true });
    try {
      const res = await wx.getStorage({ key: 'token' });
      if (res.data) {
        // 有token，调用接口获取用户会话信息
        wx.request({
          url: '/api/rest/user/service/user/session',
          method: 'GET',
          header: {
            'content-type': 'application/json',
            'token': res.data
          },
          success: (result) => {
            if (result.data && result.data.data) {
              const userInfo = result.data.data;
              this.setData({
                nickname: userInfo.nickname || '',
                isLoading: false
              });
            } else {
              wx.showToast({ title: '获取用户信息失败', icon: 'none' });
              this.setData({ isLoading: false });
            }
          },
          fail: (error) => {
            console.error('获取用户会话信息失败:', error);
            wx.showToast({ title: '获取用户信息失败', icon: 'none' });
            this.setData({ isLoading: false });
          }
        });
      } else {
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.setData({ isLoading: false });
      }
    } catch (error) {
      console.error('获取token失败:', error);
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  // 引导用户授权获取昵称
  authorizeUserInfo() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          nickname: userInfo.nickName
        });
        // 这里可以调用接口保存用户昵称
        this.updateUserNickname(userInfo.nickName);
      },
      fail: (error) => {
        console.error('用户授权失败:', error);
        wx.showToast({ title: '授权失败', icon: 'none' });
      }
    });
  },

  // 更新用户昵称到服务器
  updateUserNickname(nickname) {
    try {
      const token = wx.getStorageSync('token');
      if (token) {
        wx.request({
          url: '/api/rest/user/service/user/updateNickname',
          method: 'POST',
          data: {
            nickname: nickname
          },
          header: {
            'content-type': 'application/json',
            'token': token
          },
          success: (res) => {
            if (res.data && res.data.code === 0) {
              wx.showToast({ title: '昵称更新成功' });
            }
          }
        });
      }
    } catch (error) {
      console.error('更新昵称失败:', error);
    }
  }
});