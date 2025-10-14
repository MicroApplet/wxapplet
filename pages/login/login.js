// pages/login/login.js

// 导入HTTP请求工具
import { api } from '../../utils/wx-api';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    username: '', // 用户名
    password: '', // 密码
    loading: false, // 登录中状态
    errorMsg: '', // 错误信息
    canIUseGetUserProfile: false, // 是否支持getUserProfile接口
    canIUseOpenData: false // 是否支持open-data组件
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查是否支持getUserProfile接口
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查是否支持open-data组件
    if (wx.canIUse('open-data.type.userAvatarUrl')) {
      this.setData({
        canIUseOpenData: true
      });
    }
    
    // 检查用户是否已经登录，如果已登录则跳转到首页
    const token = wx.getStorageSync('userToken');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 页面渲染完成后的逻辑
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时的逻辑
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // 页面隐藏时的逻辑
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 页面卸载时的逻辑
  },

  /**
   * 用户名输入事件
   */
  onUsernameInput: function (e) {
    this.setData({
      username: e.detail.value
    });
  },

  /**
   * 密码输入事件
   */
  onPasswordInput: function (e) {
    this.setData({
      password: e.detail.value
    });
  },

  /**
   * 执行登录操作
   */
  doLogin: function () {
    const { username, password } = this.data;
    
    // 表单验证
    if (!username) {
      this.showError('请输入用户名');
      return;
    }
    
    if (!password) {
      this.showError('请输入密码');
      return;
    }
    
    // 设置登录中状态
    this.setData({
      loading: true,
      errorMsg: ''
    });
    
    // 调用登录API
    api.login('/open/user/auth/login', { username, password })
      .then((res) => {
        console.log('登录成功:', res);
        
        // 保存token和用户信息
        try {
          wx.setStorageSync('userToken', res.data);
          // 创建简单的用户信息对象
          const userInfo = {
            username: this.data.username,
            avatarUrl: '',
            nickName: this.data.username
          };
          wx.setStorageSync('userInfo', userInfo);
          
          // 保存到全局数据
          const app = getApp();
          app.globalData.userInfo = userInfo;
        } catch (e) {
          console.error('保存用户信息失败:', e);
        }
        
        // 登录成功后跳转到首页
        wx.switchTab({
          url: '/pages/index/index',
          success: () => {
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });
          }
        });
      })
      .catch((error) => {
        console.error('登录失败:', error);
        this.showError(error.message || '登录失败，请稍后重试');
      })
      .finally(() => {
        // 重置登录中状态
        this.setData({
          loading: false
        });
      });
  },

  /**
   * 微信一键登录
   */
  wechatLogin: function () {
    // 先获取用户信息（如果需要）
    if (this.data.canIUseGetUserProfile) {
      this.getUserProfile();
    } else {
      // 使用旧的登录方式
      this.getWechatCode();
    }
  },

  /**
   * 获取用户信息
   */
  getUserProfile: function () {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        // 保存用户信息到全局
        const app = getApp();
        app.globalData.userInfo = res.userInfo;
        
        // 获取微信登录code
        this.getWechatCode();
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '需要获取用户信息才能登录',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 获取微信登录code
   */
  getWechatCode: function () {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送code到后端换取openid和session_key
          this.wechatAuth(res.code);
        } else {
          console.error('登录失败:', res.errMsg);
          this.showError('获取登录凭证失败');
        }
      },
      fail: (err) => {
        console.error('登录失败:', err);
        this.showError('微信登录失败');
      }
    });
  },

  /**
   * 微信授权登录
   */
  wechatAuth: function (code) {
    this.setData({
      loading: true
    });
    
    // 调用后端微信登录接口
    api.post('/open/user/auth/wechat-login', { code })
      .then((res) => {
        console.log('微信登录成功:', res);
        
        // 保存token和用户信息
        if (res.data) {
          try {
            wx.setStorageSync('userToken', res.data);
            // 保存用户信息到本地存储
            const app = getApp();
            if (app.globalData.userInfo) {
              wx.setStorageSync('userInfo', app.globalData.userInfo);
            }
          } catch (e) {
            console.error('保存用户信息失败:', e);
          }
        }
        
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index',
          success: () => {
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });
          }
        });
      })
      .catch((error) => {
        console.error('微信登录失败:', error);
        this.showError(error.message || '微信登录失败，请稍后重试');
      })
      .finally(() => {
        this.setData({
          loading: false
        });
      });
  },

  /**
   * 显示错误信息
   */
  showError: function (message) {
    this.setData({
      errorMsg: message
    });
    
    // 3秒后自动清除错误信息
    setTimeout(() => {
      this.setData({
        errorMsg: ''
      });
    }, 3000);
  },

  /**
   * 跳转到注册页面
   */
  goToRegister: function () {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  /**
   * 跳转到找回密码页面
   */
  goToForgotPassword: function () {
    wx.navigateTo({
      url: '/pages/forgot-password/forgot-password'
    });
  }
});