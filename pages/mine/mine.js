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
    idNumber: '',
    showIdTypeSelect: false,
    idCardTypes: [] // 证件类型列表
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
    // 初始化证件类型列表
    const idCardTypes = IdCardType.getAllTypes();
    this.setData({
      showRealNameForm: true,
      showIdTypeSelect: false,
      idCardTypes: idCardTypes
    });
  },
  
  // 隐藏实名认证表单
  hideRealNameForm() {
    this.setData({
      showRealNameForm: false,
      idName: '',
      idNumber: '',
      showIdTypeSelect: false 
    });
  },
  
  // 切换证件类型下拉列表显示
  toggleIdTypeSelect() {
    this.setData({
      showIdTypeSelect: !this.data.showIdTypeSelect
    });
  },
  
  // 选择证件类型（只有身份证可用）
  selectIdType(e) {
    const code = e.currentTarget.dataset.code;
    this.setData({
      idType: code,
      showIdTypeSelect: false
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
  
  // 执行人脸验证（使用微信官方推荐的生物识别人脸核身接口）
  async performFaceVerification() {
    try {
      this.setData({ isLoading: true });
      
      // 1. 获取用户输入的姓名和身份证号
      const { idName, idNumber } = this.data;
      if (!idName || !idNumber) {
        throw new Error('请先填写姓名和身份证号');
      }
      
      // 2. 检查是否支持人脸核身功能
      if (!wx.startFacialRecognitionVerify) {
        // 设备不支持人脸核身，直接调用后台接口（不负载verifyResult）
        console.log('设备不支持人脸核身，直接调用后台认证接口');
        await this.submitRealNameInfo();
        return;
      }
      
      // 3. 探测是否具有人脸核身的权限
      const hasFaceRecognitionPermission = await this.checkDeviceSupportFacialRecognition();
      
      if (hasFaceRecognitionPermission) {
        // 3.1 有权限，调用微信生物识别人脸核身接口
        wx.startFacialRecognitionVerify({
          name: idName,          // 姓名
          idCardNumber: idNumber, // 身份证号
          checkAliveType: 0,     // 人脸核验的交互方式，0表示读数字（默认）
          success: async (res) => {
            try {
              console.log('人脸核身成功', res);
              // 在成功回调函数中调用后台接口，并且将verifyResult负载到请求体中
              const verifyResultData = {
                verifyResult: res.verifyResult,
                timestamp: Date.now()
              };
              await this.submitRealNameInfo(verifyResultData);
            } catch (error) {
              console.error('提交认证信息失败:', error);
              wx.showToast({ 
                title: error.message || '认证失败，请重试', 
                icon: 'none' 
              });
              this.setData({ isLoading: false });
            }
          },
          fail: async (err) => {
            // 在失败回调函数中，在控制台打印人脸核身失败，然后再调用后台接口（不负载verifyResult参数）
            console.error('人脸核身失败，继续提交认证信息:', err);
            try {
              await this.submitRealNameInfo();
            } catch (error) {
              console.error('提交认证信息失败:', error);
              wx.showToast({ 
                title: error.message || '认证失败，请重试', 
                icon: 'none' 
              });
              this.setData({ isLoading: false });
            }
          }
        });
      } else {
        // 3.2 没有权限，直接调用后台接口（不负载verifyResult参数）
        console.log('没有人脸核身权限，直接调用后台认证接口');
        await this.submitRealNameInfo();
      }
    } catch (error) {
      console.error('认证失败:', error);
      wx.showToast({ 
        title: error.message || '认证失败，请重试', 
        icon: 'none' 
      });
      this.setData({ isLoading: false });
    }
  },
  
  // 探测是否具有人脸核身的权限
  async checkDeviceSupportFacialRecognition() {
    return new Promise((resolve) => {
      if (!wx.checkIsSupportFacialRecognition) {
        console.warn('当前微信版本不支持检查人脸核身权限');
        resolve(false);
        return;
      }
      
      try {
        wx.checkIsSupportFacialRecognition({
          checkAliveType: 0, // 读数字模式
          success: (res) => {
            // Android设备会返回errCode，0表示支持
            // iOS设备不返回errCode
            const isSupported = res.errCode === undefined || res.errCode === 0;
            console.log('人脸核身权限检查结果:', isSupported);
            resolve(isSupported);
          },
          fail: (err) => {
            console.error('检查人脸核身权限失败:', err);
            // 调用失败，认为没有权限
            resolve(false);
          }
        });
      } catch (e) {
        console.error('检查人脸核身权限异常:', e);
        resolve(false);
      }
    });
  },
  
  // 提交实名认证信息（支持带或不带人脸核身结果）
  async submitRealNameInfo(verifyResultData) {
    try {
      this.setData({ isLoading: true });
      
      const { idType, idName, idNumber } = this.data;
      // 获取环境配置中的应用信息
      const { wxAppId, xAppChlAppType } = require('../../utils/wx-env');
      
      // 构建请求参数
      const requestParams = {
        chl: 'wechat', // 渠道代码
        chlAppId: wxAppId, // 渠道应用ID
        chlAppType: xAppChlAppType, // 渠道应用类型
        idType, // 证件类型代码
        name: idName, // 姓名
        number: idNumber // 证件号
      };
      
      // 如果有人脸核身结果，添加verifyResult参数
      const hasVerifyResult = verifyResultData && verifyResultData.verifyResult;
      if (hasVerifyResult) {
        requestParams.verifyResult = verifyResultData.verifyResult;
      }
      
      // 调用后端接口提交认证信息
      // 注意：这里使用统一的接口，后台根据是否有verifyResult参数来处理不同的认证流程
      const response = await api.post('/rest/user/service/user/id-card/authenticate/withface', requestParams);
      
      if (response && response.code === 0 && response.data) {
        const { isVerified, realNameInfo } = response.data;
        
        // 如果有人脸核身结果，再次获取核验结果（提高安全性）
        let finalResult = null;
        if (hasVerifyResult) {
          finalResult = await this.getVerificationResult(verifyResultData.verifyResult);
        }
        
        if ((isVerified || (finalResult && finalResult.isVerified)) && realNameInfo) {
          // 缓存认证结果
          wx.setStorageSync('isRealNameVerified', true);
          wx.setStorageSync('realNameInfo', realNameInfo);
          
          this.setData({
            isRealNameVerified: true,
            realNameInfo: realNameInfo,
            showRealNameForm: false
          });
          
          wx.showToast({ title: '实名认证成功' });
        } else {
          wx.showToast({ title: '实名认证未通过', icon: 'none' });
        }
      } else {
        wx.showToast({ title: '提交认证信息失败', icon: 'none' });
      }
    } catch (error) {
      console.error('提交实名认证信息失败:', error);
      // 提供更具体的错误提示
      let errorMsg = '网络异常，请重试';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      wx.showToast({ title: errorMsg, icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },
  
  // 根据文档第四部分要求，再次获取核验结果，提高业务方安全性
  async getVerificationResult(verifyResult) {
    try {
      // 调用后端接口再次获取核验结果
      const response = await api.get('/rest/user/service/user/id-card/verify-result', {
        verifyResult: verifyResult // 使用verifyResult字符串作为参数
      });
      
      if (response && response.code === 0 && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('获取核验结果失败:', error);
      // 此接口失败不应影响主流程，返回null让主流程继续判断
      return null;
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