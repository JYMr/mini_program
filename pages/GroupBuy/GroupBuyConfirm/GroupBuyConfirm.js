const addressController = require('../../controllers/addressController').controller;
const groupBuyController = require('../../controllers/groupBuyController').controller;
const orderController = require('../../controllers/orderController').controller;
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        id: '',
        GroupId: '',
        OrderData: {},
        OrderId: '',
        isPayFail: false,
        PayFailTime: '180000',
        PayFailStartTime: '',
        PayTimeout: '',
        TimeOut: {
            hours: '00',
            minute: '00',
            second: '00'
        },
        PayWay: 2,
        AddressId: '',
        ReMark: '',
        PayListStatus: false, //选择支付方式列表
        DefaultImage: '',
        userInfo: '',
        isPay: '' //是否处于支付状态
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        if (options.id) {
            this.setData({
                id: options.id
            });
        }
        if (options.gid) {
            this.setData({
                GroupId: options.gid
            });
        }

        //获取全局默认图片底图
        this.setData({
            DefaultImage: app.globalData.defaultImg,
            // cashStatus: app.globalData.cashStatus,
            userInfo: app.globalData.userInfo
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
        //注意区分用户新下拼团单和支付已有拼团单
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        groupBuyController.getConfirmGroupBuyOrder({
            p_id: this.data.id,
            group_id: this.data.GroupId
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
    //选择地址
    ChooseAddress() {
        //如果为支付取消倒计时状态，无法选择地址
        if (this.data.isPayFail) return;
        wx.navigateTo({
            url: '/pages/User/AddressList/AddressList?ChooseMode=true'
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
    ShowPayList() {
        //如果为支付取消倒计时状态，无法选择支付
        if (this.data.isPayFail) return;
        this.setData({
            PayListStatus: true
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

        //更改为支付状态
        this.setData({
            isPay: true
        });

        //支付取消后的再次调起
        if (this.data.isPayFail) {
            wx.showLoading({
                title: '请求支付中...',
                mask: true
            });
            orderController.getPayMent({
                orderId: this.data.OrderId
            }).then(res => {
                if (res.done) {
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
                            wx.hideLoading();
                            //取消倒计时
                            clearInterval(this.data.PayTimeout);
                            //设置返回拼团详情页提示跳转id
                            app.globalData.PaySuccessGroupId = this.data.OrderId;
                            //跳转分享页
                            setTimeout(() => {
                                wx.redirectTo({
                                    url: '/pages/GroupBuy/GroupBuyShare/GroupBuyShare?orderid=' + this.data.OrderId
                                });
                            }, 1500)
                        },
                        fail: res => {
                            wx.hideLoading();

                            //如果再次请求支付，取消或支付失败后，支付倒计时已结束，则回退页面
                            let thisTime = new Date().getTime();
                            if (this.data.isPay && thisTime - this.data.PayFailStartTime >= this.data.PayFailTime) {
                                this.Dialog.ShowDialog({
                                    type: 'Message',
                                    title: '支付超时！',
                                    messageType: 'fail'
                                });
                                //处于支付状态,不跳转
                                setTimeout(() => {
                                    wx.navigateBack();
                                }, 1500);
                                return;
                            }

                            this.Dialog.ShowDialog({
                                title: '支付已取消!',
                                type: 'Message',
                                messageType: 'fail'
                            });

                            //更改回支付状态
                            this.setData({
                                isPay: false
                            });
                        }
                    })
                }
            });
            return;
        }

        wx.showLoading({
            title: '提交订单中...',
            mask: true
        });
        groupBuyController.CreatePurchaseOrder({
            p_id: this.data.id,
            group_id: this.data.GroupId,
            remark: this.data.ReMark,
            addrId: this.data.AddressId,
            payWay: this.data.PayWay,
            orderPrice: this.data.OrderData.totalPrice,
            headimg: this.data.userInfo.avatarUrl,
            nickname: this.data.userInfo.nickName
        }).then(res => {
            if (res.done) {
                //设置返回的OrderId
                this.setData({
                    OrderId: res.result.orderId
                });
                //开始计时
                this.PayFailTime();

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
                        //设置返回拼团详情页提示跳转id
                        app.globalData.PaySuccessGroupId = this.data.OrderId;
                        //支付成功，跳转分享页
                        setTimeout(() => {
                            wx.redirectTo({
                                url: '/pages/GroupBuy/GroupBuyShare/GroupBuyShare?orderid=' + this.data.OrderId
                            });
                        }, 1500);
                    },
                    fail: res => {
                        //判断是否支付超时
                        //如果再次请求支付，取消或支付失败后，支付倒计时已结束，则回退页面
                        let thisTime = new Date().getTime();
                        if (this.data.isPay && thisTime - this.data.PayFailStartTime >= this.data.PayFailTime) {
                            this.Dialog.ShowDialog({
                                type: 'Message',
                                title: '支付超时！',
                                messageType: 'fail'
                            });

                            //处于支付状态,不跳转
                            setTimeout(() => {
                                wx.navigateBack();
                            }, 1500);
                            return;
                        }

                        this.Dialog.ShowDialog({
                            title: '支付取消!',
                            type: 'Message',
                            messageType: 'fail'
                        });

                        //更改为支付取消，倒计时状态
                        this.setData({
                            isPayFail: true,
                            isPay: false//更改回支付状态
                        });
                    }
                });
            } else {
                this.Dialog.ShowDialog({
                    title: res.msg || '提交支付失败，请重试!',
                    type: 'Message',
                    messageType: 'fail'
                });
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
    //支付失败或者取消倒计时
    PayFailTime() {
        let startTime = new Date().getTime();
        let time = setInterval(() => {
            let _time = this.data.PayFailTime;
            let thisTime = new Date().getTime();
            _time = _time - thisTime + startTime;

            //支付超时
            if (_time < 0) {
                clearInterval(time);
                this.setData({
                    TimeOut: {
                        hours: '00',
                        minute: '00',
                        second: '00'
                    }
                });

                //处于支付状态,不跳转
                if (!this.data.isPay) {
                    setTimeout(() => {
                        wx.navigateBack();
                    }, 1500);
                    return;
                }
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: '支付超时！',
                    messageType: 'fail'
                });
                return;
            }

            let _hours = Math.floor(_time / (1000 * 60));
            let _minute = Math.floor(_time / 1000) % 60;
            let _second = Math.floor((_time - _hours * 60 * 1000 - _minute * 1000) / 10);
            _hours = _hours < 10 ? ('0' + _hours) : _hours
            _minute = _minute < 10 ? ('0' + _minute) : _minute
            _second = _second < 10 ? ('0' + _second) : _second

            this.setData({
                TimeOut: {
                    hours: _hours,
                    minute: _minute,
                    second: _second
                }
            });
        }, 10);
        this.setData({
            PayTimeout: time,
            PayFailStartTime: startTime
        });

    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})