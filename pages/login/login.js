// pages/login/login.js

// 导入HTTP请求工具
const { api } = require('../../utils/wx-api');
// 导入环境配置
const { xAppId, xAppChl, wxAppId, xAppChlAppType } = require('../../utils/wx-env');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false, // 登录中状态
    errorMsg: '' // 错误信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查用户是否已经登录，如果已登录则跳转到首页
    const token = api.userToken();
    
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
    
    // 构建请求头 - 从环境配置中获取
    const headers = {
      'x-app-id': xAppId,
      'x-app-chl': xAppChl,
      'x-app-chl-appid': wxAppId,
      'x-app-chl-app-type': xAppChlAppType
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
        // if (response.data && response.data.token) {
        //   wx.setStorageSync('userToken', response.data.token);
        //   // 如果有用户信息也存储起来
        //   if (response.data.userInfo) {
        //     wx.setStorageSync('userInfo', response.data.userInfo);
        //   }
        // }
        
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
  },
  
  /**
   * 处理用户授权手机号
   */
  onGetPhoneNumber: function(e) {
    const that = this;
    
    // 设置加载状态
    this.setData({
      loading: true,
      errorMsg: ''
    });
    
    // 检查用户是否授权
    if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
      this.setData({
        loading: false,
        errorMsg: '请授权手机号以完成注册'
      });
      return;
    }
    
    // 用户授权成功，获取手机号信息
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 获取到手机号信息，准备调用注册接口
      const phoneInfo = e.detail;
      console.log('获取到的手机号信息:', phoneInfo);
      
      // 构建注册请求参数
      const registerData = {
        id: '', // 忽略
        userid: '', // 忽略
        appid: xAppId, // 取xAppid
        chlType: xAppChl, // 取xAppChl
        chlAppId: wxAppId, // 取wxAppId
        chlAppType: 'WX-PHONE', // 微信手机号
        chlUserId: phoneInfo.encryptedData, // 取手机号
        chlUnionId: '',
        roleBit: 0,
        chlUserCode: phoneInfo.code,
        chlUserToken: phoneInfo.iv
      };
      
      // 构建请求头
      const headers = {
        'x-app-id': xAppId,
        'x-app-chl': xAppChl,
        'x-app-chl-appid': wxAppId
      };
      
      // 调用后台注册接口
      api.post('/rest/user/service/user/registrar/register', registerData, null, headers)
        .then(function(response) {
          console.log('注册成功:', response);
          
          // 重置加载状态
          that.setData({
            loading: false
          });
          
          // 注册成功后跳转到首页
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
          console.error('注册失败:', error);
          that.setData({
            loading: false,
            errorMsg: error.message || '注册失败，请重试'
          });
        });
    } else {
      // 授权失败的其他情况
      this.setData({
        loading: false,
        errorMsg: '获取手机号失败，请重试'
      });
    }
  }
});