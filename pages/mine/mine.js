// mine.js
// 导入wx-api.js中的API
const { api } = require('../../utils/wx-api');

Page({
  data: {
    nickname: '',
    isLoading: true
  },

  onLoad() {
    try {
      // 添加延迟以确保页面完全加载
      setTimeout(() => {
        this.getUserSessionInfo();
      }, 100);
    } catch (error) {
      console.error('页面加载异常:', error);
      this.setData({ isLoading: false });
    }
  },

  onShow() {
    try {
      // 每次显示页面时刷新用户信息
      this.getUserSessionInfo();
    } catch (error) {
      console.error('页面显示异常:', error);
      this.setData({ isLoading: false });
    }
  },

  // 安全获取用户会话信息
  async getUserSessionInfo() {
    // 双重检查确保页面实例有效
    if (!this || typeof this.setData !== 'function') {
      console.error('页面实例无效，无法设置数据');
      return;
    }
    
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
      // 确保在任何错误情况下都能重置加载状态
      if (this && typeof this.setData === 'function') {
        this.setData({ isLoading: false });
      }
    }
  },

  // 引导用户授权获取昵称
  authorizeUserInfo() {
    try {
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
    } catch (error) {
      console.error('授权操作异常:', error);
      wx.showToast({ title: '授权操作异常', icon: 'none' });
    }
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
  },
  
  // 全局错误处理器
  onError(error) {
    console.error('页面错误:', error);
    // 在这里可以添加统一的错误处理逻辑
  }
});