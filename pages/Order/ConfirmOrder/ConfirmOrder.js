// pages/order/order.js
const orderController = require('../../controllers/orderController').controller;
const addressController = require('../../controllers/addressController').controller;
const app = getApp();

Page({
    data: {
        Mode: 0, //订单提交模式： 0 购物车结算  1 单件购买
        GoodsId: '',
        CartsIdList: '',
        type: '', //type
        num: '',
        OrderData: {},
        PayWay: 2,
        AddressId: '',
        ReMark: '',
        cashStatus: '', //货到付款状态 true为开启
        PayListStatus: false, //选择支付方式列表
        DefaultImage: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        if (options.mode) {
            this.setData({
                Mode: options.mode
            });
        }
        if (options.id) {
            if (this.data.Mode == 0) {
                //购物车结算,获取购物车ID列表
                this.setData({
                    CartsIdList: options.id
                });
            } else {
                //单件购买,获取商品ID
                this.setData({
                    GoodsId: options.id
                });
            }
        }
        //单件购买,获取数量
        if (options.num) {
            this.setData({
                num: options.num || 1
            });
        }

        //获取全局默认图片底图
        this.setData({
            DefaultImage: app.globalData.defaultImg,
            cashStatus: app.globalData.cashStatus
        });

        this.GetOrderData();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.Dialog = this.selectComponent('#Dialog');
        this.AddressEdit = this.selectComponent('#AddressEdit');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        if (app.globalData.AddressId) {
            //选择地址返回，加载选择地址数据
            this.setData({
                AddressId: app.globalData.AddressId
            });
            //查询选择的地址
            this.GetAddress();
            //清除公共存储，选择的地址id
            app.globalData.AddressId = '';
        }
    },
    //查询订单信息
    GetOrderData() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });

        if (this.data.Mode == 0) {
            //购物车结算数据
            orderController.SubmitShopCart({
                shopcartIds: this.data.CartsIdList
            }).then(res => {
                if (res.done) {
                    let _AddressId = res.result.defalutUserAddr ? res.result.defalutUserAddr.addr_id : '';
                    this.setData({
                        OrderData: res.result,
                        AddressId: _AddressId
                    });
                    wx.hideLoading();
                }
            });
        } else {
            //单间商品结算数据
            orderController.getOneData({
                shopcart_goods_id: this.data.GoodsId,
                shopcart_num: this.data.num,
                shopcart_type: 1
            }).then(res => {
                if (res.done) {
                    let _AddressId = res.result.defalutUserAddr ? res.result.defalutUserAddr.addr_id : '';
                    this.setData({
                        OrderData: res.result,
                        AddressId: _AddressId,
                        CartsIdList: res.result.shopCartApi.shopcart_id //单间购买，经过购物车流程，用购物车id提交订单
                    });
                    wx.hideLoading();
                }
            });
        }
    },
    //查询选择地址数据
    GetAddress() {
        wx.showLoading({
            title: '加载地址数据中...',
            mask: true
        });

        addressController.getAddressById({
            addr_id: this.data.AddressId
        }).then(res => {
            if (res.done) {
                let _orderData = this.data.OrderData;
                //组合地址信息
                _orderData.defalutUserAddr = Object.assign(_orderData.defalutUserAddr || {}, res.result.userAddr);

                this.setData({
                    OrderData: _orderData
                });
            } else {
                this.Dialog.ShowDialog({
                    title: res.msg || '拉去数据异常，请重试!',
                    type: 'Message',
                    messageType: 'fail'
                });
            }
            wx.hideLoading();
        });
    },
    //显示添加地址
    ShowEdit() {
        this.AddressEdit.ShowEdit();
    },
    //添加地址
    AddAddress(e) {
        let id = e.detail.addr_id;
        if (id != undefined) {
            this.setData({
                AddressId: id
            });
            this.AddressEdit.CloseEdit();
            this.GetAddress();
        }
    },
    //显示支付列表
    TogglePayList() {
        this.setData({
            PayListStatus: !this.data.PayListStatus
        });
    },
    //切换支付方式
    choosePayWay(e) {
        let type = e.currentTarget.dataset.type;
        this.setData({
            PayWay: type,
            PayListStatus: false
        });
    },
    //提交订单
    ConfirmOrder() {
        if (this.data.AddressId == '') {
            this.Dialog.ShowDialog({
                title: '请添加收货地址!',
                type: 'Message',
                messageType: 'fail'
            });
            return;
        }
        wx.showLoading({
            title: '提交订单中...',
            mask: true
        });
        orderController.CreateOrder({
            addrId: this.data.AddressId,
            shopCartIds: this.data.CartsIdList,
            orderPrice: this.data.OrderData.totalPrice,
            remark: this.data.ReMark,
            payWay: this.data.PayWay
        }).then(res => {
            if (res.done) {

                //如果为在线支付
                if (this.data.PayWay == 2) {
                    let _OrderId = res.result.orderId;
                    wx.requestPayment({
                        timeStamp: res.result.timeStamp,
                        nonceStr: res.result.nonceStr,
                        package: res.result.package,
                        signType: res.result.signType,
                        paySign: res.result.paySign,
                        success: res => {
                            this.Dialog.ShowDialog({
                                title: '支付成功!',
                                type: 'Message'
                            });
                            //等待弹窗
                            setTimeout(() => {
                                //支付取消，跳转待支付订单
                                wx.redirectTo({
                                    url: '/pages/Order/MyOrderDetail/MyOrderDetail?id=' + _OrderId
                                });
                            }, 1500);
                        },
                        fail: res => {
                            this.Dialog.ShowDialog({
                                title: '支付取消!',
                                type: 'Message'
                            });
                            //等待弹窗
                            setTimeout(() => {
                                //支付取消，跳转待支付订单
                                wx.redirectTo({
                                    url: '/pages/Order/MyOrderDetail/MyOrderDetail?id=' + _OrderId
                                });
                            }, 1500);
                        }
                    });
                } else {
                    let _OrderId = res.result.order.orderId;
                    //货到付款状态
                    this.Dialog.ShowDialog({
                        title: '下单成功!',
                        type: 'Message'
                    });
                    //等待弹窗
                    setTimeout(() => {
                        //支付取消，跳转待支付订单
                        wx.redirectTo({
                            url: '/pages/Order/MyOrderDetail/MyOrderDetail?id=' + _OrderId
                        });
                    }, 1500);
                }
            } else {
                //如果为在线支付
                if (this.data.PayWay == 2) {
                    this.Dialog.ShowDialog({
                        title: res.msg || '提交支付失败，请重试!',
                        type: 'Message',
                        messageType: 'fail'
                    });
                }else{
                     this.Dialog.ShowDialog({
                        title: res.msg || '下单失败，请重试!',
                        type: 'Message',
                        messageType: 'fail'
                    });
                }
            }
            wx.hideLoading();
        });
    },
    //备注输入绑定
    BindChange(e) {
        let _val = e.detail.value;
        this.setData({
            ReMark: _val
        });
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})