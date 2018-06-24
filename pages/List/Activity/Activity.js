// pages/List/Activity/Activity.js
const activityControllers = require('../../controllers/activityController.js').controller;
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        id: '',
        activityData: {},
        DefaultImage: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        if (options.id) {
            this.setData({
                id: options.id
            })
            this.getActivityData();
        }

        //获取全局默认图片底图
        this.setData({
            DefaultImage: app.globalData.defaultImg
        })
    },
    getActivityData() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        activityControllers.getAddressData({
            actId: this.data.id
        }).then(res => {
            if (res.done) {
                this.setData({
                    activityData: res.result.activity
                })
                
                //设置标题
                wx.setNavigationBarTitle({
                    title: res.result.activity.act_name || '搜索'
                })
            }
            wx.hideLoading();
        })
    },
    //拨打电话
    calling: function() {
        app.calling()
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }

})