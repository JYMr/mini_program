// pages/user/CustomerService/CustomerService.js
const orderController = require('../../controllers/orderController').controller;
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        Status: 1, //售后状态
        OrderList: [],
        pageNo: 1,
        isEnd: false,
        DefaultImage: '', //默认底图
        RequestError:false,
        isLoading:false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        
        if (options.status) {
            this.setData({
                Status: options.status
            });
        }

        //获取全局默认图片底图
        this.setData({
            DefaultImage: app.globalData.defaultImg
        });

        this.GetOrderList();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.Dialog = this.selectComponent('#Dialog');
        this.CustomerServiceComponent = this.selectComponent('#CustomerService');
        this.Floatcustomer = this.selectComponent("#Floatcustomer");
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        if (this.data.isEnd) return;
        this.GetOrderList();
    },
    onRefresh: function () {
      this.GetOrderList();
    },
    //获取订单数据
    GetOrderList() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        orderController.GetAfterSalesList({
            aftersalesStatus: this.data.Status,
            pageNo: this.data.pageNo
        }).then(res => {
            if (res.done) {
                this.setData({
                    OrderList: this.data.OrderList.concat(res.result.orderList.list),
                    isEnd: this.data.pageNo == res.result.orderList.totalPage,
                    isLoading:true,
                    RequestError:false
                });
            } else {
                wx.hideLoading();
                wx.showToast({
                    title: res.msg || '服务器出错,请重试',
                    icon: 'none'
                });
                this.setData({
                    RequestError:true
                })
            }
            wx.hideLoading();
        }).catch(err=>{
            this.setData({
                RequestError:true
            })
        })
    },
    //切换订单状态
    TabToggle(e) {
        let _Status = e.currentTarget.dataset.status;
        this.setData({
            Status: _Status,
            pageNo: 1,
            OrderList: []
        });
        this.GetOrderList();
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})