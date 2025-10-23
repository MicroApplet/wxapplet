// mine.js
const { rest } = require('../../utils/url');
const { get, put, post } = require('../../utils/api');
const { xAppId, xAppChl, wxAppId } = require('../../utils/env');
const {header} = require('../../utils/header');
const IdCardType = require('../../utils/id-card-type');
const { refreshSession } = require('../../utils/session');


Page({
  data: {
    pageTitle: '个人中心',
    introText: '欢迎使用我们的小程序，这里是您的个人中心页面。',
    userInfo: {
      avatarUrl: '',
      nickName: '加载中...',
      phoneNumber: '加载中...'
    },
    showNicknameForm: false,
    tempNickname: '',
    showIdCardInfo: false,
    showIdCardAuth: false,
    realNameInfo: {},
    availableIdCardTypes: [],
    idCardTypeIndex: 0,
    selectedIdCardType: {},
    isLoading: true
  },

  onLoad() {
    console.log('个人中心页面加载');
    // 在所有操作之前先调用session的refresh函数
    refreshSession().then(() => {
      // refresh函数调用完成后，加载其他信息
      this.loadUserInfo();
    }).catch(error => {
      console.error('刷新会话失败:', error);
      // 即使刷新失败也继续加载用户信息
      this.loadUserInfo();
    });
  },
  
  // 直接使用从session.js导入的refreshSession函数
  
  // 加载用户信息的统一方法
  loadUserInfo() {
    console.log('开始加载用户信息');
    // 从后台获取用户头像
    this.getAvatarFromBackend();
    // 从后台获取用户昵称
    this.getNicknameFromBackend();
    // 尝试获取用户手机号
    this.getUserPhoneNumber();
    // 初始化可用证件类型
    this.initAvailableIdCardTypes();
    
    // 设置加载状态为完成
    this.setData({
      isLoading: false
    });
  },
  
  // 初始化可用证件类型
  initAvailableIdCardTypes: function() {
    const allTypes = IdCardType.getAllTypes();
    const availableTypes = allTypes.filter(type => type.available);
    this.setData({
      availableIdCardTypes: availableTypes,
      selectedIdCardType: availableTypes[0] || {}
    });
  },
  
  // 证件按钮点击事件
  onIdCardClick: function() {
    // 调用后端接口获取证件信息
    this.getIdCardStatus();
  },
  
  // 获取证件状态信息
  getIdCardStatus: function() {
    wx.showLoading({ title: '加载中' });
    get(rest( '/user/id-card/status'))
      .then(res => {
        wx.hideLoading();
        if (res && res.isVerified && res.realNameInfo) {
          // 格式化证件信息，添加证件类型中文名
          const realNameInfo = res.realNameInfo;
          if (realNameInfo.type) {
            realNameInfo.typeName = IdCardType.getCnNameById(realNameInfo.type);
          }
          this.setData({
            realNameInfo: realNameInfo,
            showIdCardInfo: true
          });
        } else {
          // 未实名，显示实名认证弹窗
          this.setData({ showIdCardAuth: true });
        }
      })
      .catch(error => {
        wx.hideLoading();
        console.error('获取证件信息失败:', error);
        wx.showToast({ title: '获取证件信息失败', icon: 'none' });
      });
  },
  
  // 证件类型选择变化
  onIdCardTypeChange: function(e) {
    const index = e.detail.value;
    this.setData({
      idCardTypeIndex: index,
      selectedIdCardType: this.data.availableIdCardTypes[index]
    });
  },
  
  // 实名认证提交
  onIdCardAuthSubmit: function(e) {
    const formData = e.detail.value;
    const { name, number } = formData;
    
    if (!this.data.selectedIdCardType.code) {
      wx.showToast({ title: '请选择证件类型', icon: 'none' });
      return;
    }
    
    if (!name) {
      wx.showToast({ title: '请输入证件姓名', icon: 'none' });
      return;
    }
    
    if (!number) {
      wx.showToast({ title: '请输入证件编号', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '提交中' });
    
    const requestData = {
      idType: this.data.selectedIdCardType.code,
      name: name,
      number: number
      // verifyChl 和 verifyParam 暂时不传
    };
    
    post(rest( '/user/id-card/authenticate'), requestData)
      .then(res => {
        wx.hideLoading();
        wx.showToast({ title: '实名认证成功', icon: 'success' });
        this.setData({ showIdCardAuth: false });
        // 重新获取证件信息并显示
        this.getIdCardStatus();
      })
      .catch(error => {
        wx.hideLoading();
        console.error('实名认证失败:', error);
        wx.showToast({ title: '实名认证失败', icon: 'none' });
      });
  },
  
  // 关闭证件信息弹窗
  onCloseIdCardInfo: function() {
    this.setData({ showIdCardInfo: false });
  },
  
  // 关闭实名认证弹窗
   onCloseIdCardAuth: function() {
     this.setData({ showIdCardAuth: false });
   },
   
   // 阻止事件冒泡
   stopPropagation: function(e) {
     // 阻止事件冒泡到遮罩层
   },
  
  // 从后台获取用户昵称
  getNicknameFromBackend() {
    const that = this;
    get(rest('/user/nickname'))
    .then(res => {
        console.log('从后台获取昵称成功:', res);
        that.setData({
          userInfo: {
            ...that.data.userInfo,
            nickName: res || '微信用户'
          }
        });
    }).catch(err => {
      console.log('从后台获取昵称失败:', err);
      // 请求失败，使用默认昵称
      that.setData({
        userInfo: {
          ...that.data.userInfo,
          nickName: '微信用户'
        }
      });
    })

  },

  onShow() {
    console.log('个人中心页面显示');
  },

  // 从后台获取用户头像
  getAvatarFromBackend() {
    const that = this;
    get(rest('/user/avatar'))
      .then(res => {
        console.log('从后台获取头像成功:', res);
        let avatarUrl = res;
        
        // 适配逻辑：检查是否为base64字符串
        if (res && typeof res === 'string') {
          // 如果不是以http://或https://开头，则认为是base64字符串
          if (!res.startsWith('http://') && !res.startsWith('https://')) {
            console.log('处理base64格式头像');
            // 为base64字符串添加必要的前缀
            avatarUrl = `data:image/jpeg;base64,${res}`;
          }
        }
        
        that.setData({
          userInfo: {
            ...that.data.userInfo,
            avatarUrl: avatarUrl
          }
        });
      })
      .catch(err => {
        console.log('从后台获取头像失败:', err);
        // 请求失败，使用默认头像
        that.setData({
          userInfo: {
            ...that.data.userInfo,
            avatarUrl: '../../images/default_avatar.jpg'
          }
        });
      });
  },

  // 处理微信头像选择事件
  onChooseAvatar(e) {
    const that = this;
    console.log('获取的微信头像事件:', e);
    const { avatarUrl } = e.detail;
    console.log('获取的微信头像路径:', avatarUrl);
    
    // 先临时显示选择的头像
    that.setData({
      userInfo: {
        ...that.data.userInfo,
        avatarUrl: avatarUrl
      }
    });
    
    // 上传头像到后台
    that.uploadAvatar(avatarUrl);
  },
    
    // 处理昵称点击事件
    onNicknameClick() {
      this.setData({
        showNicknameForm: true,
        tempNickname: this.data.userInfo.nickName
      });
    },
    
    // 处理昵称提交
    onNicknameSubmit(e) {
      const that = this;
      const { nickname } = e.detail.value;
      
      if (!nickname || nickname.trim() === '') {
        wx.showToast({
          title: '昵称不能为空',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 显示加载提示
      wx.showLoading({
        title: '保存中...',
      });
      
      // 调用后台接口更新昵称
      put(rest('/user/nickname'), { data: { nickname: nickname}})
        .then(res => {
          // 隐藏加载提示
          wx.hideLoading();
          // 更新本地昵称
            that.setData({
              userInfo: {
                ...that.data.userInfo,
                nickName: res || nickname
              },
              showNicknameForm: false
            });
          console.log('更新昵称成功:', res);
        })
        .catch(err => {
          // 隐藏加载提示
          wx.hideLoading();
          console.log('更新昵称请求失败:', err);
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
            duration: 2000
          });
        });
    },
    
    // 取消昵称修改
    onCancelNickname() {
      this.setData({
        showNicknameForm: false,
        tempNickname: ''
      });
    },
    
    // 阻止事件冒泡
  stopPropagation() {
      // 空函数，用于阻止点击弹窗内容时触发遮罩层的关闭事件
    },

  // 上传头像到后台
  uploadAvatar(tempFilePath) {
    const that = this;
    
    // 显示上传中提示
    wx.showLoading({
      title: '上传中...',
    });
    
    // 检查tempFilePath是否以http://或https://开头，且不以http://tmp或https://tmp开头
    const isHttpUrl = tempFilePath.startsWith('http://') || tempFilePath.startsWith('https://');
    const isTmpUrl = tempFilePath.startsWith('http://tmp') || tempFilePath.startsWith('https://tmp');
    
    // 如果是HTTP/HTTPS URL且不是临时文件URL，则使用PUT请求
    if (isHttpUrl && !isTmpUrl) {
      // 使用PUT请求上传HTTP/HTTPS路径
      put(rest('/user/service/user/avatar'), { data: { avatar: tempFilePath }})
        .then(res => {
          // 隐藏加载提示
          wx.hideLoading();
          
          if (res && res.code === 0) {
            console.log('头像URL上传成功');
            wx.showToast({
              title: '头像更新成功',
              icon: 'success',
              duration: 2000
            });
          } else {
            console.log('头像URL上传失败:', res?.message || '未知错误');
            wx.showToast({
              title: '头像更新失败',
              icon: 'none',
              duration: 2000
            });
            
            // 恢复原来的头像
            that.getAvatarFromBackend();
          }
        })
        .catch(err => {
          // 隐藏加载提示
          wx.hideLoading();
          console.log('上传请求失败:', err);
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
            duration: 2000
          });
          
          // 恢复原来的头像
          that.getAvatarFromBackend();
        });
    } else {
      // 使用文件上传方式（由于api.js中未封装uploadFile，暂时保留原生调用）
        wx.uploadFile({
          url: rest('/user/avatar'),
          header: header(),
          filePath: tempFilePath,
          name: 'avatar',
        success: (res) => {
          // 隐藏加载提示
          wx.hideLoading();
          
          console.log('上传头像成功:', res.data);
          try {
            const data = JSON.parse(res.data);
            if (data && data.avatarUrl) {
              that.setData({
                userInfo: {
                  ...that.data.userInfo,
                  avatarUrl: data.avatarUrl
                }
              });
              wx.showToast({
                title: '头像更新成功',
                icon: 'success',
                duration: 2000
              });
            }
          } catch (e) {
            console.log('解析返回数据失败:', e);
            wx.showToast({
              title: '服务器响应错误',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          // 隐藏加载提示
          wx.hideLoading();
          console.log('上传头像失败:', err);
          wx.showToast({
            title: '头像更新失败',
            icon: 'none',
            duration: 2000
          });
          // 恢复原来的头像
          that.getAvatarFromBackend();
        }
      });
    }
  },

  // 获取用户手机号
  getUserPhoneNumber() {
    const that = this;
    // 调用后台接口获取用户授权手机号
    get(rest(  '/user/phone'))
      .then(res => {
        console.log('从后台获取手机号成功:', res);
        // 如果返回结果不为空且有长度则直接显示，否则显示请授权手机号
        const phoneNumber = res && res.length > 0 ? res : '请授权手机号';
        that.setData({
          userInfo: {
            ...that.data.userInfo,
            phoneNumber: phoneNumber
          }
        });
      })
      .catch(err => {
        console.log('从后台获取手机号失败:', err);
        // 请求失败，显示请授权手机号
        that.setData({
          userInfo: {
            ...that.data.userInfo,
            phoneNumber: '请授权手机号'
          }
        });
      });
  },

  // 用于页面中button组件的getPhoneNumber事件
  onGetPhoneNumber(e) {
    console.log('手机号事件:', e);
    const that = this;
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      console.log('获取手机号成功，需要调用后端接口解密:', e.detail);
      
      // 显示加载提示
      wx.showLoading({
        title: '授权中...',
      });
      
      // 准备请求参数
      const data = {
        appid: xAppId,
        chlType: xAppChl,
        chlAppId: wxAppId,
        chlAppType: 'WX-PHONE',
        chlUserId: e.detail.encryptedData,
        chlUserCode: e.detail.code,
        chlUserToken: e.detail.iv
      };
      
      // 调用后台接口进行手机号注册
      post( rest( '/user/registrar/register'),data)
        .then(res => {
          // 隐藏加载提示
          wx.hideLoading();
          
          console.log('手机号注册成功:', res);
          // 注册成功后重新获取手机号
          that.getUserPhoneNumber();
          
          // 显示成功提示
          wx.showToast({
            title: '手机号授权成功',
            icon: 'success',
            duration: 2000
          });
        })
        .catch(err => {
          // 隐藏加载提示
          wx.hideLoading();
          console.log('手机号注册失败:', err);
          wx.showToast({
            title: '手机号授权失败',
            icon: 'none',
            duration: 2000
          });
        });
    } else {
      console.log('用户拒绝授权手机号');
      wx.showToast({
        title: '已取消授权',
        icon: 'none',
        duration: 2000
      });
    }
  }
});
