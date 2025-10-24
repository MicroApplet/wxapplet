//clinc.js
const { rest } = require('../../utils/url');
const { get } = require('../../utils/api');
const { refreshSession } = require('../../utils/session');

/**
 * 医疗页面组件
 * 实现处方提醒查询功能
 */
Page({
  /**
   * 页面初始数据
   */
  data: {
    prescriptionData: [],
    isLoading: false,
    loadingMore: false,
    refreshing: false,  // 用于scroll-view的下拉刷新状态
    hasPermission: true,
    pagination: {
      page:1,
      size:3,
      pages: 1,
      total: 0
    },
    noMoreData: false
  },
  
  /**
   * 页面私有变量
   */
  lastScrollTop: 0, // 上次滚动位置
  isLoadingPage: false, // 是否正在加载页面数据

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
    // 仅在数据为空时加载数据，避免重复加载
    if (this.data.prescriptionData.length === 0) {
      this.loadPrescriptionData();
    }
  },

  /**
   * 加载处方数据
   */
  loadPrescriptionData: function() {
    const that = this;
    that.setData({
      isLoading: true,
      prescriptionData: [], // 清空现有数据
      'pagination.page': 1, // 重置为第一页
      noMoreData: false,
      refreshing: false     // 确保刷新状态关闭
    });
    that.lastScrollTop = 0; // 重置滚动位置

    // 调用refreshSession函数
    refreshSession().then(() => {
      console.log('会话刷新完成');
      // 直接加载处方数据
      that.fetchPrescriptionData();
    }).catch(error => {
      console.error('刷新会话失败:', error);
      // 即使会话刷新失败，也尝试加载数据
      that.fetchPrescriptionData();
    });
  },

  /**
   * 获取处方数据
   */
  fetchPrescriptionData: function() {
    const that = this;
    const { page, size } = that.data.pagination;
    
    // 构建查询参数（仅包含分页信息）
    const queryParams = {
      page,
      size
    };

    // 调用后台接口，传入分页回调函数
    get(rest('/clinc/prescription/reminder/list', queryParams), {
      pageCallable: (response) => {
        // 从完整响应中提取分页信息
        if (response && response.pageable) {
          that.setData({
            pagination: {
              ...that.data.pagination,
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

          // 根据当前页码决定是替换数据还是追加数据
          const updatedData = page === 1 ? formattedData : [...that.data.prescriptionData, ...formattedData];

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
          loadingMore: false,
          refreshing: false  // 关闭刷新状态
        });
        wx.stopPullDownRefresh();
        that.isLoadingPage = false;
      });
  },




  /**
   * 监听滚动事件，根据滚动方向调整页码
   */
  onScroll: function(e) {
    const that = this;
    const scrollTop = e.detail.scrollTop;
    const scrollHeight = e.detail.scrollHeight;
    const clientHeight = e.detail.clientHeight;
    
    // 计算滚动到底部的阈值
    const bottomThreshold = scrollHeight - clientHeight - 10;
    
    // 避免频繁触发，只有在页面稳定时才处理滚动方向
    if (!that.isLoadingPage) {
      // 向上滑动 - 当滚动到底部附近时，加载下一页
      if (scrollTop > that.lastScrollTop && scrollTop >= bottomThreshold) {
        // 确保还有更多数据且不在加载中
        if (!that.data.noMoreData && !that.data.loadingMore) {
          console.log('向上滑动，加载下一页');
          that.loadNextPage();
        }
      } 
      // 向下滑动 - 当滚动到顶部附近且不是第一页时，加载上一页
      else if (scrollTop < that.lastScrollTop && scrollTop <= 50) {
        // 关键优化：只有当页码大于1时才尝试加载上一页
        if (that.data.pagination.page > 1 && !that.isLoadingPage && !that.data.refreshing && !that.data.isLoading && !that.data.loadingMore) {
          console.log('向下滑动，加载上一页');
          that.loadPreviousPage();
        }
      }
    }
    
    // 更新最后滚动位置
    that.lastScrollTop = scrollTop;
  },
  
  /**
   * 加载下一页数据
   */
  loadNextPage: function() {
    const that = this;
    const currentPage = that.data.pagination.page;
    const maxPages = Math.ceil(that.data.pagination.total / that.data.pagination.size);
    
    // 检查是否还有下一页
    if (currentPage < maxPages || !that.data.pagination.total) {
      that.setData({
        loadingMore: true,
        'pagination.page': currentPage + 1
      });
      that.isLoadingPage = true;
      that.fetchPrescriptionData().finally(() => {
        that.isLoadingPage = false;
      });
    } else {
      that.setData({ noMoreData: true });
    }
  },
  
  /**
   * 加载上一页数据
   */
  loadPreviousPage: function() {
    const that = this;
    const currentPage = that.data.pagination.page;
    
    // 确保页码不会小于1，这是一个额外的安全检查
    if (currentPage > 1) {
      // 设置加载状态
      that.isLoadingPage = true;
      // 减少页码并设置加载状态
      that.setData({
        isLoading: true,
        'pagination.page': currentPage - 1
      });
      
      // 加载上一页数据
      that.fetchPrescriptionData().finally(() => {
        that.isLoadingPage = false;
      });
    }
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   * 下拉时重置为第一页并刷新数据
   */
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    // 设置刷新状态并重置分页
    this.setData({
      refreshing: true,
      'pagination.page': 1,
      noMoreData: false
    });
    // 重新加载数据
    this.fetchPrescriptionData();
  },

  /**
   * 上拉加载更多 - 作为备用触发方式
   */
  onReachBottom: function() {
    if (!this.isLoadingPage && !this.data.isLoading && !this.data.loadingMore && !this.data.noMoreData) {
      this.loadNextPage();
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
