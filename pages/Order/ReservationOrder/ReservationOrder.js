// pages/user/myreservation.js
const reservationController = require('../../controllers/reservationController').controller;
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        Status: "",
        OrderList: [],
        ListNo: 1,
        ListSize: 8,
        isEnd: false,
        DefaultImage: '', //默认底图
        RequestError: false,
        isLoading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

        if (options.status) {
            this.setData({
                Status: options.status
            })
        }
        //设置默认底图
        this.setData({
            DefaultImage: app.globalData.defaultImg
        })

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
    onRefresh: function() {
        this.GetOrderList();
    },
    //获取订单数据
    GetOrderList() {
        var that = this;
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        reservationController.GetNeedOrderList({
            needStatus: this.data.Status,
            pageNo: this.data.ListNo
        }).then(res => {
            if (res.done) {
                this.setData({
                    OrderList: this.data.OrderList.concat(res.result.needList.list),
                    ListNo: res.result.needList.nextPage,
                    isEnd: this.data.ListNo == res.result.needList.totalPage,
                    RequestError: false,
                    isLoading: true
                })
            } else {
                this.setData({
                    RequestError: true
                })
                wx.showToast({
                    title: res.msg || '服务器错误',
                    icon: 'none'
                })
            }
            wx.hideLoading();

        }).catch(err => {
            this.setData({
                RequestError: true
            })
        })
    },
    //重新加载数据
    ReloadData() {
        this.setData({
            OrderList: [],
            ListNo: 1
        })
        this.GetOrderList();
    },
    //切换订单状态
    TabToggle(e) {
        let _Status = e.currentTarget.dataset.status;
        this.setData({
            OrderList: [],
            Status: _Status,
            ListNo: 1
        })
        this.GetOrderList();
    },
    //取消预定
    CancelReservation(e) {
        let _id = e.currentTarget.dataset.id;

        this.Dialog.ShowDialog({
            title: '亲，是否取消该预定？',
            type: 'Confirm',
            btnArray: [
                { title: '是', name: 'yes' },
                { title: '否', name: 'no' }
            ],
            callback: res => {
                if (res.name == 'yes') {

                    //请求取消预定
                    wx.showLoading({
                        title: '加载数据中...',
                        mask: true
                    });

                    reservationController.CancelNeed({
                        needId: _id
                    }).then(res => {
                        if (res.done) {
                            this.Dialog.ShowDialog({
                                title: '取消成功!',
                                type: 'Message',
                            });
                            setTimeout(() => {
                                this.ReloadData();
                            }, 1500)
                        } else {
                            this.Dialog.ShowDialog({
                                title: res.msg || '取消失败，请重试!',
                                type: 'Message',
                                messageType: 'fail'
                            });
                        }
                        wx.hideLoading();
                    });
                }
                this.Dialog.CloseDialog();
            }
        })
    },
    //重新提交
    AgainReservation(e) {
        let _id = e.currentTarget.dataset.id;
        reservationController.NeedBuyAgain({
            needId: _id
        }).then(res => {
            if (res.done) {
                this.Dialog.ShowDialog({
                    title: '已经成功添加至预定清单!',
                    type: 'Message'
                });
                setTimeout(() => {
                    wx.navigateTo({
                        url: '/pages/Goods/Reservation/Reservation'
                    });
                }, 1500);
            } else {
                this.Dialog.ShowDialog({
                    title: res.msg || '添加预定清单失败，请重试!',
                    type: 'Message',
                    messageType: 'fail'
                });
            }
        });
    },
    //删除预定
    DeleteReservation(e) {
        let _id = e.currentTarget.dataset.id;
        console.log('预定 - id:' + _id);
        this.Dialog.ShowDialog({
            title: '亲，是否删除该预定？',
            type: 'Confirm',
            btnArray: [
                { title: '是', name: 'yes' },
                { title: '否', name: 'no' }
            ],
            callback: res => {
                if (res.name == 'yes') {

                    //请求删除预定
                    wx.showLoading({
                        title: '加载数据中...',
                        mask: true
                    });

                    reservationController.DeleteNeed({
                        needId: _id
                    }).then(res => {
                        if (res.done) {
                            this.Dialog.ShowDialog({
                                title: '删除成功!',
                                type: 'Message',
                            });
                            setTimeout(() => {
                                this.ReloadData();
                            }, 1500)
                        } else {
                            this.Dialog.ShowDialog({
                                title: res.msg || '取消失败，请重试!',
                                type: 'Message',
                                messageType: 'fail'
                            });
                        }
                        wx.hideLoading();
                    });
                }
                this.Dialog.CloseDialog();
            }
        })
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})