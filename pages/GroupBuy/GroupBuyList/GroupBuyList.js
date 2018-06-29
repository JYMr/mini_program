// pages/GroupBuy/GroupBuyList/GroupBuyList.js
const GroupBuyController = require('../../controllers/groupBuyController').controller;
var app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        GroupBuyData: [],
        pageNo: 1,
        pageSize: 6,
        isEnd: false,
        DefaultImage: '',
        RequestError: false,
        isLoading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.GetGroupList();

        //获取全局默认图片底图
        this.setData({
            DefaultImage: app.globalData.defaultImg
        })
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onShow() {
        //判断是否存在需要拼团提示
        let PaySuccessGroupId = app.globalData.PaySuccessGroupId;

        //取消提示
        if (PaySuccessGroupId) {
            app.globalData.PaySuccessGroupId = '';
        }
    },
    onReachBottom() {
        if (this.data.isEnd) return;
        this.GetGroupList();
    },
    //监听用户下拉动作
    onPullDownRefresh() {
        this.setData({
            pageNo: 1,
            isEnd: false
        })
        this.GetGroupList(false);
    },
    //获取团购列表数据
    GetGroupList(flag) {

        if (flag !== false) {
            wx.showLoading({
                title: '加载数据中...',
                mask: true
            });
        }

        GroupBuyController.getList({
            pageNo: this.data.pageNo,
            pageSize: this.data.pageSize
        }).then(res => {
            if (res.done) {
                //当请求为第一页时，清空页面数据
                if (this.data.pageNo == 1) {
                    this.setData({
                        GroupBuyData: []
                    });
                }
                this.setData({
                    GroupBuyData: this.data.GroupBuyData.concat(res.result.purchases.list),
                    pageNo: res.result.purchases.nextPage,
                    isEnd: res.result.purchases.totalPage == this.data.pageNo,
                    isLoading: true
                });
            }
            wx.hideLoading();
            wx.stopPullDownRefresh();
        }).catch(err => {
            this.setData({
                RequestError: true
            });

            wx.stopPullDownRefresh();
        });
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})