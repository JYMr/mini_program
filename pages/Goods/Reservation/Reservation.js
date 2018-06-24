// pages/cart/reservation.js
const cartController = require('../../controllers/cartController').controller;
const reservationController = require('../../controllers/reservationController').controller;
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        NeedList: [],
        editMode: false,
        isAllSelect: false,
        GoodsTotalNum: 0,
        GoodsTotalPrice: 0,
        DefaultImage: '',
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        hasUserInfo: false,
        isLoading: true,
        RequestError: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        if (app.globalData.userInfo) {
            this.setData({
                hasUserInfo: true
            })
        } else if (this.data.canIUse) {
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.setData({
                    hasUserInfo: true
                })
            }
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    })
                }
            })
        }

        this.GetList();

        //设置默认底图
        this.setData({
            DefaultImage: app.globalData.defaultImg
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.Dialog = this.selectComponent("#Dialog");
        this.ReservationInput = this.selectComponent("#ReservationInput");
    },
    onShow(){
        this.GetList();
    },
    //获取购物车数据
    GetList() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        this.setData({
            isLoading: false
        });
        cartController.getCartData({
            shopcart_type: 2
        }).then(res => {
            if (res.done) {
                this.setData({
                    NeedList: res.result.shopCartApiList,
                    isLoading: true
                });
            }
            wx.hideLoading();
        }).catch(err => {
            this.setData({
                RequestError: true
            });
        });
    },
    //复选框事件
    HandleCheckBox(e) {
        let _id = e.currentTarget.dataset.id;
        let _List = this.data.NeedList;
        for (let item of _List) {
            if (item.shopcart_id == _id) {
                item.isChoose = item.isChoose == '1' ? '0' : '1'
            }
        }
        this.setData({
            NeedList: _List
        });
        this.CheckAllSelect();
    },
    //检查是否全选
    CheckAllSelect() {
        let _List = this.data.NeedList;
        let length = _List.length;
        let ChooseLength = 0;
        for (let item of _List) {
            if (item.isChoose == '1') {
                ChooseLength++;
            }
        }
        this.setData({
            isAllSelect: ChooseLength == length
        })
    },
    //全选或反选
    AllSelect() {
        let _status = this.data.isAllSelect;
        let _List = this.data.NeedList;
        for (let item of _List) {
            item.isChoose = !_status;
        }
        this.setData({
            isAllSelect: !_status,
            NeedList: _List
        })
    },
    //编辑模式
    editMode() {
        this.setData({
            editMode: !this.data.editMode
        })
    },
    //删除购物车操作
    DelList() {
        let _List = this.data.NeedList;
        let DelList = new Array();
        for (let item of _List) {
            if (item.isChoose == '1') {
                DelList.push(item.shopcart_id);
            }
        }
        if (DelList.length == 0) {
            this.Dialog.ShowDialog({
                title: '请勾选你需要删除的商品',
                type: 'Message',
                messageType: 'fail'
            });
            return;
        }
        /*this.Dialog.ShowDialog({
            title: '确定删除选中预定清单的商品',
            type: 'Confirm',
            callback: res => {
                if (res.name == 'confirm') {
                    //此处删除接口
                    
                    this.Dialog.CloseDialog();
                    wx.showLoading({
                        mask: true
                    });
                    cartController.delCart({
                        shopcartids: DelList.toString(),
                        shopcart_type: 2
                    }).then(res => {
                        if (res.done) {
                            this.Dialog.ShowDialog({
                                type: 'Message',
                                title: '删除成功'
                            })
                            setTimeout(() => {
                                this.GetList()
                            }, 1500)
                        } else {
                            this.Dialog.ShowDialog({
                                type: 'Message',
                                title: res.msg || '删除失败',
                                messageType: 'fail'
                            })
                        }
                        wx.hideLoading();
                    });
                } else {
                    this.Dialog.CloseDialog();
                }
            }
        });*/
        wx.showLoading({
            mask: true
        });
        cartController.delCart({
            shopcartids: DelList.toString(),
            shopcart_type: 2
        }).then(res => {
            if (res.done) {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: '删除成功'
                })
                setTimeout(() => {
                    this.GetList()
                }, 1500)
            } else {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: res.msg || '删除失败',
                    messageType: 'fail'
                })
            }
            wx.hideLoading();
        });
    },
    ShowReservationInput() {
        let _ChooseId = this.GetChooseId();
        if (_ChooseId == '') {
            this.Dialog.ShowDialog({
                title: '请选择需要预定的商品',
                type: 'Message',
                messageType: 'fail'
            });
            return;
        }
        this.ReservationInput.Show({
            chooseid: _ChooseId
        });
    },
    //获取选择预定商品ID
    GetChooseId() {
        let _List = this.data.NeedList;
        let _ChooseArr = [];
        for (let item of _List) {
            if (item.isChoose == '1') {
                _ChooseArr.push(item.shopcart_id);
            }
        }
        return _ChooseArr.toString();
    },
    //提交预定
    ConfirmNeedOrder(e) {
        let UserInfo = e.detail;
        wx.showLoading({
            title: '提交中...',
            mask: true
        });
        reservationController.CreatelNeedByCart({
            needPerson: UserInfo.name,
            needPhone: UserInfo.mobile,
            shopCartIds: UserInfo.chooseid
        }).then(res => {
            if (res.done) {
                wx.navigateTo({
                    url: '/pages/Order/ReservationOrder/ReservationOrder'
                });
                //关闭预定弹窗
                this.ReservationInput.CloseEdit();
            } else {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: res.msg || '提交预定失败',
                    messageType: 'fail'
                })
            }
            wx.hideLoading();
        });
    },
    //申请授权判断
    getUserInfo(e) {
        if (e.detail.userInfo) {
            this.setData({
                hasUserInfo: true
            })
            app.globalData.userInfo = e.detail.userInfo
            //此处提交订单
            this.ShowReservationInput();
        } else {
            this.Dialog.ShowDialog({
                title: '授权登录，方可购买商品',
                type: 'Alert',
                callback: res => {
                    this.Dialog.CloseDialog();
                }
            })
        }
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})