// mine.js
// 导入wx-api.js中的API
const { api } = require('../../utils/wx-api');
// 导入证件类型枚举
const IdCardType = require('../../utils/id-card-type');

Page({
  data: {
    nickname: '',
    isLoading: true,
    // 实名认证相关状态
    isRealNameVerified: false,
    realNameInfo: null,
    showRealNameForm: false,
    // 表单数据
    idType: IdCardType.ResidentIdentityCard.code,  // 身份证代码 01
    idName: '',
    idNumber: ''
  },

  onLoad() {
    try {
      // 用户信息在onShow中统一获取，避免重复调用接口
      this.setData({ isLoading: true });
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
    try {
      // 检查实名认证状态
      this.checkRealNameStatus();
    } catch (error) {
      console.error('检查实名认证状态失败:', error);
    }
  
    // 继续原有逻辑
    // 双重检查确保页面实例有效
    if (!this || typeof this.setData !== 'function') {
      console.error('页面实例无效，无法设置数据');
      return;
    }
    
    this.setData({ isLoading: true });
    try {
      // 直接使用api.get，无需手动获取token，wx-api.js会自动处理
      const response = await api.get('/rest/user/service/user/session');
      
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
      const response = await api.post('/rest/user/service/user/updateNickname', { nickname });
      
      if (response && response.code === 0) {
        wx.showToast({ title: '昵称更新成功' });
      }
    } catch (error) {
      console.error('更新昵称失败:', error);
      // wx-api.js会处理大部分错误情况
    }
  },
  
  // 检查实名认证状态
  async checkRealNameStatus() {
    try {
      // 首先从本地缓存检查
      const localVerified = wx.getStorageSync('isRealNameVerified');
      const localRealNameInfo = wx.getStorageSync('realNameInfo');
      
      if (localVerified && localRealNameInfo) {
        this.setData({
          isRealNameVerified: localVerified,
          realNameInfo: localRealNameInfo
        });
        return;
      }
      
      // 本地未找到或已过期，从服务器获取
      // 支持传入idType参数（可选）
      const { idType } = this.data;
      const params = idType ? { idType } : {};
      const response = await api.get('/rest/user/service/user/id-card/status', params)
      if (response && response.code === 0 && response.data) {
        const { isVerified, realNameInfo } = response.data;
        
        // 缓存到本地
        if (isVerified && realNameInfo) {
          wx.setStorageSync('isRealNameVerified', isVerified);
          wx.setStorageSync('realNameInfo', realNameInfo);
        }
        
        this.setData({
          isRealNameVerified: isVerified,
          realNameInfo: realNameInfo
        });
      }
    } catch (error) {
      console.error('获取实名认证状态失败:', error);
    }
  },
  
  // 显示实名认证表单
  showRealNameForm() {
    this.setData({ showRealNameForm: true });
  },
  
  // 隐藏实名认证表单
  hideRealNameForm() {
    this.setData({
      showRealNameForm: false,
      idName: '',
      idNumber: ''
    });
  },
  
  // 处理表单输入
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [field]: value
    });
  },
  
  // 执行人脸验证
  async performFaceVerification() {
    try {
      this.setData({ isLoading: true });
      
      // 调用微信小程序人脸核身API
      // 注意：实际使用时需要根据微信官方文档调整参数
      const faceResult = await new Promise((resolve, reject) => {
        wx.faceDetect({
          width: 300,
          height: 400,
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });
      
      // 假设获取到verifyResult
      const verifyResult = faceResult.verifyResult;
      
      // 提交认证信息到后端
      await this.submitRealNameInfo(verifyResult);
    } catch (error) {
      console.error('人脸验证失败:', error);
      wx.showToast({ title: '人脸验证失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },
  
  // 提交实名认证信息
  async submitRealNameInfo(verifyResult) {
    try {
      this.setData({ isLoading: true });
      
      const { idType, idName, idNumber } = this.data;
      // 获取环境配置中的应用信息
      const { wxAppId, xAppChlAppType } = require('../../utils/wx-env');
      
      // 调用后端接口提交认证信息
      const response = await api.post('/rest/user/service/user/id-card/authenticate/withface', {
        chl: 'wechat', // 渠道代码
        chlAppId: wxAppId, // 渠道应用ID
        chlAppType: xAppChlAppType, // 渠道应用类型
        idType, // 证件类型代码
        name: idName, // 姓名
        number: idNumber, // 证件号
        verifyResult // 人脸认证结果代码
      });
      
      if (response && response.code === 0 && response.data) {
        const { isVerified, realNameInfo } = response.data;
        
        if (isVerified && realNameInfo) {
          // 缓存认证结果
          wx.setStorageSync('isRealNameVerified', isVerified);
          wx.setStorageSync('realNameInfo', realNameInfo);
          
          this.setData({
            isRealNameVerified: isVerified,
            realNameInfo: realNameInfo,
            showRealNameForm: false
          });
          
          wx.showToast({ title: '实名认证成功' });
        } else {
          wx.showToast({ title: '实名认证失败', icon: 'none' });
        }
      } else {
        wx.showToast({ title: '提交认证信息失败', icon: 'none' });
      }
    } catch (error) {
      console.error('提交实名认证信息失败:', error);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },
  
  // 获取证件类型中文名
  getCnNameById(code) {
    return IdCardType.getCnNameById(code);
  },
  
  // 全局错误处理器
  onError(error) {
    console.error('页面错误:', error);
    // 在这里可以添加统一的错误处理逻辑
  }
});