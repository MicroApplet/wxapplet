//clinc.js
const { rest } = require('../../utils/url');
const { get } = require('../../utils/api');
const { refreshSession, getUserSession } = require('../../utils/session');

/**
 * 医疗页面组件
 * 实现处方提醒查询功能
 */
Page({
  /**
   * 页面初始数据
   */
  data: {
    isLoading: true,
    hasPermission: true,
    prescriptionData: [],
    isProfessionalUser: false,
    searchParams: {
      name: '',
      idNo: '',
      phone: ''
    },
    pagination: {
      page: 1,
      size: 3,
      total: 0,
      pages: 0
    },
    loadingMore: false,
    noMoreData: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log('医疗页面加载');
    this.loadPrescriptionData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log('医疗页面显示');
    // 如果是专业用户且数据已加载，可以刷新数据
    if (this.data.isProfessionalUser && this.data.prescriptionData.length > 0) {
      this.loadPrescriptionData();
    }
  },

  /**
   * 加载处方数据
   */
  loadPrescriptionData: function() {
    const that = this;
    that.setData({
      isLoading: true
    });

    // 调用refreshSession函数
    refreshSession().then(() => {
      console.log('会话刷新完成');
      // 检查用户角色
      that.checkUserRole();
    }).catch(error => {
      console.error('刷新会话失败:', error);
      // 即使会话刷新失败，也尝试加载数据
      that.checkUserRole();
    });
  },

  /**
   * 检查用户角色
   */
  checkUserRole: function() {
    const that = this;
    const session = getUserSession();
    
    // 简单判断是否为专业用户（根据session.roleBit）
    // 这里只是示例，实际判断逻辑可能需要根据后台定义的角色位图来确定
    const isProfessional = session && session.roleBit > 0;
    
    that.setData({
      isProfessionalUser: isProfessional
    });
    
    // 加载处方数据
    that.fetchPrescriptionData();
  },

  /**
   * 获取处方数据
   */
  fetchPrescriptionData: function() {
    const that = this;
    const { page, size } = that.data.pagination;
    const { name, idNo, phone } = that.data.searchParams;
    
    // 构建查询参数
    // 非专业用户不能使用搜索参数
    const queryParams = {
      page,
      size,
      // 只有专业用户才能使用搜索参数
      ...(that.data.isProfessionalUser ? { name, idNo, phone } : {})
    };

    // 调用后台接口，传入分页回调函数
    get(rest('/clinc/prescription/reminder/list', queryParams), {
      pageCallable: (response) => {
        // 从完整响应中提取分页信息
        if (response && response.pageable && response.page !== undefined && response.size !== undefined) {
          that.setData({
            pagination: {
              page: response.page || 1,
              size: response.size || 10,
              total: response.total || 0,
              pages: response.pages || 0
            }
          });
        }
      }
    })
      .then(res => {
        console.log('获取处方数据成功:', res);
        
        // 处理返回的数据 - res是响应中的data部分（数组格式）
        if (Array.isArray(res)) {
          // 格式化数据，计算剩余天数
          const formattedData = res.map(item => {
            const today = new Date();
            const nextDate = new Date(item.nextDate);
            const diffTime = nextDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
              ...item,
              remainingDays: diffDays
            };
          });

          // 根据是否是加载更多来决定是替换还是追加数据
          const updatedData = that.data.loadingMore 
            ? [...that.data.prescriptionData, ...formattedData]
            : formattedData;

          that.setData({
            prescriptionData: updatedData,
            hasPermission: true,
            noMoreData: res.length < size
          });
        }
      })
      .catch(error => {
        console.error('获取处方数据失败:', error);
        // 处理无权限情况
        that.setData({
          hasPermission: false
        });
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      })
      .finally(() => {
        that.setData({
          isLoading: false,
          loadingMore: false
        });
        wx.stopPullDownRefresh();
      });
  },

  /**
   * 搜索框输入变化
   */
  onSearchInput: function(e) {
    // 只有专业用户才能修改搜索参数
    if (!this.data.isProfessionalUser) {
      wx.showToast({
        title: '只有专业用户才能使用搜索功能',
        icon: 'none'
      });
      return;
    }
    
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`searchParams.${field}`]: value
    });
  },

  /**
   * 执行搜索
   */
  onSearch: function() {
    // 只有专业用户才能执行搜索
    if (!this.data.isProfessionalUser) {
      wx.showToast({
        title: '只有专业用户才能使用搜索功能',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'pagination.page': 1,
      prescriptionData: []
    });
    this.fetchPrescriptionData();
  },

  /**
   * 清空搜索
   */
  onClearSearch: function() {
    // 只有专业用户才能清空搜索
    if (!this.data.isProfessionalUser) {
      wx.showToast({
        title: '只有专业用户才能使用搜索功能',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      searchParams: {
        name: '',
        idNo: '',
        phone: ''
      },
      'pagination.page': 1,
      prescriptionData: []
    });
    this.fetchPrescriptionData();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   * 根据需求，下拉时加载下一页数据
   */
  onPullDownRefresh: function() {
    console.log('下拉加载下一页');
    // 只有在有更多数据且不在加载中的情况下才加载下一页
    if (!this.data.loadingMore && !this.data.noMoreData) {
      this.setData({
        loadingMore: true,
        'pagination.page': this.data.pagination.page + 1
      });
      this.fetchPrescriptionData();
    } else {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    if (!this.data.loadingMore && !this.data.noMoreData && this.data.isProfessionalUser) {
      this.setData({
        loadingMore: true,
        'pagination.page': this.data.pagination.page + 1
      });
      this.fetchPrescriptionData();
    }
  },

  /**
   * 监听用户点击页面内转发按钮
   */
  onShareAppMessage: function() {
    return {
      title: '处方提醒服务',
      path: '/pages/clinc/clinc'
    };
  }
});
