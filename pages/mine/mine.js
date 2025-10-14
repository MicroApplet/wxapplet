// mine.js
// 导入wx-api.js中的API
const { api } = require('../../utils/wx-api');

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
      // 直接使用api.get，无需手动获取token，wx-api.js会自动处理
      const response = await api.get('/user/service/user/session');
      
      if (response && response.data) {
        const userInfo = response.data;
        this.setData({
          nickname: userInfo.nickname || '',
          isLoading: false
        });
      } else {
        wx.showToast({ title: '获取用户信息失败', icon: 'none' });
        this.setData({ isLoading: false });
      }
    } catch (error) {
      console.error('获取用户会话信息失败:', error);
      // wx-api.js会处理大部分错误情况，这里只需要处理UI状态
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
  async updateUserNickname(nickname) {
    try {
      // 直接使用api.post，wx-api.js会自动处理token和请求头等
      const response = await api.post('/user/service/user/updateNickname', { nickname });
      
      if (response && response.code === 0) {
        wx.showToast({ title: '昵称更新成功' });
      }
    } catch (error) {
      console.error('更新昵称失败:', error);
      // wx-api.js会处理大部分错误情况
    }
  }
});