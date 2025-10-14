// pages/login/login.js

// 导入HTTP请求工具
const { api } = require('../../utils/wx-api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false, // 登录中状态
    errorMsg: '', // 错误信息
    appid: 'touristappid' // 从project.config.json获取的appid
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查用户是否已经登录，如果已登录则跳转到首页
    const token = wx.getStorageSync('userToken');
    
    if (token) {
      wx.switchTab({
        url: '/pages/index/index',
        fail: (err) => {
          console.error('跳转到首页失败:', err);
          // 如果switchTab失败，尝试使用redirectTo
          wx.redirectTo({
            url: '/pages/index/index'
          });
        }
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
   * 微信授权登录方法
   */
  doWechatLogin: function() {
    const that = this;
    
    // 设置登录中状态
    this.setData({
      loading: true,
      errorMsg: ''
    });
    
    // 调用wx.login获取用户授权码
    wx.login({
      success: function(res) {
        if (res.code) {
          // 获取到code，调用登录接口
          that.loginWithCode(res.code);
        } else {
          console.error('获取登录授权码失败:', res.errMsg);
          that.setData({
            loading: false,
            errorMsg: '获取登录授权码失败，请重试'
          });
        }
      },
      fail: function(err) {
        console.error('wx.login调用失败:', err);
        that.setData({
          loading: false,
          errorMsg: '登录失败，请检查网络连接'
        });
      }
    });
  },

  /**
   * 使用code调用登录接口
   */
  loginWithCode: function(code) {
    const that = this;
    const appid = this.data.appid;
    
    // 构建请求头
    const headers = {
      'x-app-id': 'mams',
      'x-app-chl': 'wechat',
      'x-app-chl-appid': appid,
      'x-app-chl-app-type': 'wechat:applet'
    };
    
    // 构建请求数据
    const credentials = {
      code: code
    };
    
    // 调用登录接口
    api.login('/open/user/auth/login', credentials, headers)
      .then(function(response) {
        console.log('登录成功:', response);
        
        // 存储登录信息到本地
        if (response.data && response.data.token) {
          wx.setStorageSync('userToken', response.data.token);
          // 如果有用户信息也存储起来
          if (response.data.userInfo) {
            wx.setStorageSync('userInfo', response.data.userInfo);
          }
        }
        
        // 登录成功后跳转到首页
        wx.switchTab({
          url: '/pages/index/index',
          fail: (err) => {
            console.error('跳转到首页失败:', err);
            // 如果switchTab失败，尝试使用redirectTo
            wx.redirectTo({
              url: '/pages/index/index'
            });
          }
        });
      })
      .catch(function(error) {
        console.error('登录失败:', error);
        that.setData({
          loading: false,
          errorMsg: error.message || '登录失败，请重试'
        });
      });
  }
});