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
    //if (this.data.isProfessionalUser && this.data.prescriptionData.length > 0) {
      this.loadPrescriptionData();
    //}
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
      noMoreData: false
    });

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

          // 这里修改为永远替换数据，不考虑是否是搜索操作
          const updatedData = formattedData;

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
   * 模拟生成数据
   */
  generateMockData: function(params) {
    // 模拟总数据量
    const totalCount = 50;
    // 根据页码和每页大小计算返回的数据
    const startIndex = (params.current - 1) * params.size;
    const endIndex = Math.min(startIndex + params.size, totalCount);
    
    // 判断是否有更多数据
    const noMoreData = endIndex >= totalCount;
    
    // 生成模拟数据
    const data = [];
    for (let i = startIndex; i < endIndex; i++) {
      // 模拟一些不同的状态
      const status = i % 4;
      let statusText = '';
      let statusColor = '';
      
      switch (status) {
        case 0:
          statusText = '未执行';
          statusColor = '#e64340'; // 红色
          break;
        case 1:
          statusText = '执行中';
          statusColor = '#1aad19'; // 绿色
          break;
        case 2:
          statusText = '已完成';
          statusColor = '#1989fa'; // 蓝色
          break;
        case 3:
          statusText = '已过期';
          statusColor = '#999999'; // 灰色
          break;
      }
      
      data.push({
        id: `prescription-${i + 1}`,
        patientName: `患者${i + 1}`,
        idNo: `11010119900101${String(i + 1).padStart(4, '0')}`,
        phone: `1380013800${i % 10}`,
        medicineName: `药品${i % 5 + 1}`,
        medicineDosage: `${(i % 3 + 1) * 10}mg/${(i % 2 + 1)}次/日`,
        executionTime: `2023-06-${String(10 + i % 20).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:00`,
        status: status,
        statusText: statusText,
        statusColor: statusColor
      });
    }
    
    // 如果有搜索条件，模拟过滤
    if (params.patientName || params.idNo || params.phone) {
      const filteredData = data.filter(item => {
        if (params.patientName && !item.patientName.includes(params.patientName)) {
          return false;
        }
        if (params.idNo && !item.idNo.includes(params.idNo)) {
          return false;
        }
        if (params.phone && !item.phone.includes(params.phone)) {
          return false;
        }
        return true;
      });
      
      return {
        data: filteredData,
        total: filteredData.length,
        noMoreData: true // 搜索结果不分页
      };
    }
    
    return {
      data: data,
      total: totalCount,
      noMoreData: noMoreData
    };
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
   * 上拉加载更多
   */
  onReachBottom: function() {
    if (this.data.isLoading || this.data.loadingMore || this.data.noMoreData) {
      return;
    }
    
    this.setData({
      loadingMore: true,
      'pagination.page': this.data.pagination.page + 1
    });
    
    this.fetchPrescriptionData();
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
