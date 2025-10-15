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
  
  // 执行人脸验证（使用微信官方推荐的生物识别人脸核身接口）
  async performFaceVerification() {
    try {
      this.setData({ isLoading: true });
      
      // 1. 检查是否支持人脸核身功能
      if (!wx.startFacialRecognitionVerify) {
        throw new Error('当前设备不支持人脸核身功能，请升级微信至最新版本（读数字：Android 6.5.4+ / iOS 6.5.6+；屏幕闪烁：Android 6.7.2+ / iOS 6.7.2+）');
      }
      
      // 2. 获取用户输入的姓名和身份证号
      const { idName, idNumber } = this.data;
      if (!idName || !idNumber) {
        throw new Error('请先填写姓名和身份证号');
      }
      
      // 3. 根据文档要求，先检查设备是否支持人脸检测
      await this.checkDeviceSupportFacialRecognition();
      
      // 3. 调用微信生物识别人脸核身接口
      const verifyResult = await new Promise((resolve, reject) => {
        wx.startFacialRecognitionVerify({
          name: idName,          // 姓名
          idCardNumber: idNumber, // 身份证号
          checkAliveType: 0,     // 人脸核验的交互方式，0表示读数字（默认）
          success: (res) => {
            console.log('人脸核身成功', res);
            // 根据文档要求，直接使用返回的verifyResult字符串
            resolve({
              verifyResult: res.verifyResult, // 人脸核验凭证，用于后端校验
              timestamp: Date.now()
            });
          },
          fail: (err) => {
            console.error('人脸核身失败', err);
            // 根据错误码提供更具体的提示
            let errorMsg = '人脸验证失败，请重试';
            switch(err.errCode) {
              case -1:
                errorMsg = '系统错误';
                break;
              case 10001:
                errorMsg = '用户取消验证';
                break;
              case 10002:
                errorMsg = '验证未通过';
                break;
              case 10003:
                errorMsg = '验证超时';
                break;
              case 10004:
                errorMsg = '未检测到人脸';
                break;
              case 10005:
                errorMsg = '设备不支持';
                break;
              case 10006:
                errorMsg = '微信版本过低，请升级';
                break;
            }
            reject(new Error(errorMsg));
          }
        });
      });
      
      // 4. 提交认证信息到后端
      await this.submitRealNameInfo(verifyResult);
      
    } catch (error) {
      console.error('人脸验证失败:', error);
      wx.showToast({ 
        title: error.message || '人脸验证失败', 
        icon: 'none' 
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },
  
  // 根据文档要求，检查设备是否支持人脸检测
  async checkDeviceSupportFacialRecognition() {
    try {
      if (!wx.checkIsSupportFacialRecognition) {
        console.warn('当前微信版本不支持设备人脸检测检查');
        return;
      }
      
      await new Promise((resolve, reject) => {
        wx.checkIsSupportFacialRecognition({
          checkAliveType: 2, // 先检查是否可以屏幕闪烁，不可以则自动为读数字
          success: (res) => {
            // Android设备会返回errCode，0表示支持
            // iOS设备不返回errCode
            if (res.errCode !== undefined && res.errCode !== 0) {
              // 仅对Android设备的错误进行处理
              if (res.errCode === 10001) {
                reject(new Error('设备没有前置摄像头，不支持人脸采集'));
              } else if (res.errCode === 10002) {
                reject(new Error('没有下载到必要模型，不支持人脸采集'));
              } else if (res.errCode === 10003) {
                reject(new Error('后台控制不支持人脸采集'));
              } else {
                reject(new Error('设备不支持人脸采集'));
              }
            } else {
              resolve();
            }
          },
          fail: (err) => {
            console.error('检查设备支持失败:', err);
            // iOS设备调用此接口可能会进入fail回调，但实际可能支持人脸核身
            // 因此仅记录错误，不阻止后续流程
            resolve();
          },
          complete: () => {
            // 无论成功失败都会调用
          }
        });
      });
    } catch (error) {
      console.error('设备检查异常:', error);
      throw error;
    }
  },
  
  // 提交实名认证信息（使用微信生物识别人脸核身结果）
  async submitRealNameInfo(verifyResultData) {
    try {
      this.setData({ isLoading: true });
      
      const { idType, idName, idNumber } = this.data;
      // 获取环境配置中的应用信息
      const { wxAppId, xAppChlAppType } = require('../../utils/wx-env');
      
      // 1. 调用后端接口提交认证信息
      const response = await api.post('/rest/user/service/user/id-card/authenticate/withface', {
        chl: 'wechat', // 渠道代码
        chlAppId: wxAppId, // 渠道应用ID
        chlAppType: xAppChlAppType, // 渠道应用类型
        idType, // 证件类型代码
        name: idName, // 姓名
        number: idNumber, // 证件号
        verifyResult: verifyResultData.verifyResult // 根据文档要求，直接使用verifyResult字符串
      });
      
      if (response && response.code === 0 && response.data) {
        const { isVerified, realNameInfo } = response.data;
        
        // 2. 再次获取核验结果（提高安全性）
        const finalResult = await this.getVerificationResult(verifyResultData.verifyResult);
        
        if ((isVerified || (finalResult && finalResult.isVerified)) && realNameInfo) {
          // 3. 缓存认证结果
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