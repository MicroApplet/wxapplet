//clinc.js

/**
 * 医疗页面组件
 * 基础页面结构
 */
Page({
  /**
   * 页面初始数据
   */
  data: {
    // 基础数据结构
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    console.log('医疗页面加载');
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    console.log('医疗页面渲染完成');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log('医疗页面显示');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    console.log('医疗页面隐藏');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log('医疗页面卸载');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    wx.stopPullDownRefresh();
  },

  /**
   * 监听用户点击页面内转发按钮
   */
  onShareAppMessage: function() {
    return {
      title: '微信小程序医疗服务',
      path: '/pages/clinc/clinc'
    };
  }
});
