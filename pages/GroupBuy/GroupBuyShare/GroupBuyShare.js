// pages/GroupBuy/GroupBuyShare/GroupBuyShare.js
const GroupBuyController = require('../../controllers/groupBuyController').controller;
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        GroupId: '',
        OrderId: '',
        TimeOut: {
            hours: '00',
            minute: '00',
            second: '00'
        },
        Default_avatar: 'http://www.kzj365.com/mini_program/images/avatar_default.png',
        ShareData: {},
        serviceTime: '',
        GroupTime: '',
        DefaultImage: '', //默认底图
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        hasUserInfo: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        //判断用户权限
        if (app.globalData.userInfo) {
            this.setData({
                hasUserInfo: true
            });
        } else if (this.data.canIUse) {
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.setData({
                    hasUserInfo: true
                });
            }
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    });
                }
            });
        }

        if (options.gid) {
            this.setData({
                GroupId: options.gid
            });
        }
        if (options.orderid) {
            this.setData({
                OrderId: options.orderid
            });
        }

        //设置默认底图
        this.setData({
            DefaultImage: app.globalData.goodsdefault
        });
        
        let token = wx.getStorageSync('token') || '';
        if (token) {
            this.GetShaerData();
        } else {
            app.tokenReadyCallback = res => {
                this.GetShaerData();
            }
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.Dialog = this.selectComponent('#Dialog');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        this.GetShaerData();
    },
    onHide() {
        clearInterval(this.data.GroupTime);
    },
    onUnload() {
        clearInterval(this.data.GroupTime);
    },
    //获取拼团数据
    GetShaerData(id) {

        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        GroupBuyController.getGroupBuyShare({
            group_id: this.data.GroupId,
            order_id: this.data.OrderId
        }).then(res => {
            if (res.done) {
                res.result.prg = this.MakeDefaultData(res.result.prg, res.result.prg.people_number)
                this.setData({
                    ShareData: res.result.prg,
                    serviceTime: res.result.serviceTime
                });

                //判断是否满团
                if (res.result.prg.group_state == 0) {
                    this.TimeOutFn();
                }
            } else {
                wx.showToast({
                    title: res.msg || '服务器出错,请重试',
                    icon: 'none'
                });
            }
            wx.hideLoading();

        })
    },
    //补全数据列表
    MakeDefaultData(list, n) {
        if (n > list.headimgs.length) {
            let _Length = list.headimgs.length
            for (let i = 0; i < n - _Length; i++) {
                list.headimgs.push(this.data.Default_avatar)
            }
        }
        return list;
    },
    //拼团计时
    TimeOutFn() {
        let FinishTime = Math.floor(this.data.ShareData.unite_end_time / 1000);
        let ServerTime = Math.floor(this.data.serviceTime / 1000);
        let _TimeOut = this.data.TimeOut
        let _time = FinishTime - ServerTime

        if (_time > 0) {
            let GroupTime = setInterval(() => {
                _time = FinishTime - ServerTime
                if (_time > 0) {
                    let _hours = Math.floor(_time / (60 * 60));
                    let _minute = Math.floor((_time - _hours * 60 * 60) / 60);
                    let _second = Math.floor(_time - _hours * 60 * 60 - _minute * 60);
                    _TimeOut.hours = _hours < 10 ? ('0' + _hours) : _hours
                    _TimeOut.minute = _minute < 10 ? ('0' + _minute) : _minute
                    _TimeOut.second = _second < 10 ? ('0' + _second) : _second
                } else {
                    _TimeOut.hours = '00'
                    _TimeOut.minute = '00'
                    _TimeOut.second = '00'
                    clearInterval(GroupTime);
                }
                ServerTime = ServerTime + 1;
                this.setData({
                    TimeOut: _TimeOut
                })
            }, 1000);

            this.setData({
                GroupTime: GroupTime
            });
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        let GroupId = this.data.ShareData.group_id;
        let ShareOption = {
            title: '只要' + this.data.ShareData.purchase_price.toFixed(2) + '元就能拼到' + this.data.ShareData.goods_title,
            path: '/' + this.route + '?gid=' + GroupId,
            imageUrl: this.data.ShareData.goods_img || app.globalData.sharedefault
        }
        return ShareOption;
    },
    //提交拼团订单
    ConfirmGroupOrder() {
        let _id = this.data.ShareData.purchase_id;
        let _gid = this.data.ShareData.group_id;
        wx.navigateTo({
            url: '/pages/GroupBuy/GroupBuyConfirm/GroupBuyConfirm?gid=' + _gid + '&id=' + _id
        });
    },
    //处理权限
    getUserInfo(e) {
        if (e.detail.userInfo) {
            let _id = this.data.ShareData.purchase_id;
            let _gid = this.data.ShareData.group_id;

            this.setData({
                hasUserInfo: true
            });
            app.globalData.userInfo = e.detail.userInfo
            //此处提交订单
            wx.navigateTo({
                url: '/pages/GroupBuy/GroupBuyConfirm/GroupBuyConfirm?gid=' + _gid + '&id=' + _id
            });
        } else {
            this.Dialog.ShowDialog({
                title: '授权登录，方可购买商品',
                type: 'Alert',
                callback: res => {
                    this.Dialog.CloseDialog();
                }
            });
        }
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})