// pages/GroupBuy/GroupBuyDetail/GroupBuyDetail.js
const GroupBuyController = require('../../controllers/groupBuyController').controller;
const app = getApp();
Page({
    data: {
        GoodsId: '',
        isAllow: false,
        GroupId: '',
        isShare: false, //是否分享进入
        goodsinfo: {}, //商品详细信息
        GroupList: [], //拼团推荐
        serviceTime: '',
        DetailActive: '0',
        ChaticonMenu: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        hasUserInfo: false,
        goodsnavtop: 0, //tab距离顶部的距离
        goodsnavbool: false, //tab是否浮动
        DefaultImage: '', //默认底图
        GoodsDefaulteImage: '', //主图默认底图
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

        if (options.id) {
            this.setData({
                GoodsId: options.id
            });
        }

        if (options.gid) {
            //有拼团id传入
            this.setData({
                GroupId: options.gid
            });
        }

        if (options.isShare) {
            //是否分享进入
            this.setData({
                isShare: options.isShare
            });
        }

        //设置默认底图
        this.setData({
            DefaultImage: app.globalData.goodsdefault,
            GoodsDefaulteImage: app.globalData.goodsdefault
        });

    },

    onShow() {
        //判断全局是否存在需要提示分享的拼团订单Id
        let PaySuccessGroupId = app.globalData.PaySuccessGroupId;

        if (PaySuccessGroupId) {
            GroupBuyController.GetGroupLastMemberByOrderId({
                order_id: PaySuccessGroupId
            }).then(res => {
                if (res.done) {
                    if (res.result.isLast == 0) {
                        this.Dialog.ShowDialog({
                            title: '您有未完成拼团订单，分享好友能提高拼团成功率，是否分享?',
                            type: 'Confirm',
                            btnArray: [
                                { title: '取消', name: 'no' },
                                { title: '分享好友', name: 'yes' }
                            ],
                            callback: res => {
                                if (res.name == 'yes') {
                                    wx.navigateTo({
                                        url: '/pages/GroupBuy/GroupBuyShare/GroupBuyShare?orderid=' + PaySuccessGroupId
                                    });
                                }
                                this.Dialog.CloseDialog();
                            }
                        });
                    }
                }
            });
            app.globalData.PaySuccessGroupId = '';
        }

        
        let token = wx.getStorageSync('token') || '';
        if (token) {
            this.GetGroupDetailData();
        } else {
            //直接进入等待登录回调
            app.tokenReadyCallback = res => {
                this.GetGroupDetailData();
            }
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.Dialog = this.selectComponent('#Dialog');
        this.MenuCustomer = this.selectComponent('#MenuCustomer');
    },
    scrollTop: function() {
        var that = this;
        var query = wx.createSelectorQuery();
        query.select('.Detail-tab').boundingClientRect(function(res) {
            that.setData({
                goodsnavtop: res.top - 2
            })
        }).exec();
    },
    onPageScroll: function(e) {
        // 获取滚动条当前位置
        if (e.scrollTop > this.data.goodsnavtop) {
            this.setData({
                goodsnavbool: true
            });
        } else {
            this.setData({
                goodsnavbool: false
            });
        }
    },
    //加载拼团详情数据
    GetGroupDetailData() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        GroupBuyController.getDetail({
            p_id: this.data.GoodsId,
            group_id: this.data.GroupId
        }).then(res => {
            if (res.done) {

                //处理商品轮播图为空
                if (res.result.pDetails.goods_images && res.result.pDetails.goods_images.length == 0) {
                    //添加一张默认商品轮播图
                    res.result.pDetails.goods_images.push({
                        imageArtworkName: app.globalData.DefaultImage
                    });
                }

                this.setData({
                    goodsinfo: res.result.pDetails,
                    GroupList: res.result.proList,
                    serviceTime: Math.floor(res.result.serviceTime / 1000) //转化为时间戳
                });

                //团组找不到的情况
                if (res.result.pDetails.group_state == '') {
                    //作为普通商品处理
                    this.setData({
                        GroupId: ''
                    });
                }

                //处理活动时间数据
                this.handleData();
                //推荐团购列表倒计时
                this.GroupTimeOut();
                //判断是否可以购买
                this.handleAllow();
                //滑动初始化
                this.scrollTop();
                wx.hideLoading();
            }
        })
    },
    //判断是否能购买
    handleAllow() {
        let _goodsinfo = this.data.goodsinfo;
        let _isAllow = true;
        if (this.data.GroupId == '') {
            //普通进入
            _isAllow = _goodsinfo.effective_stock > 0 //库存大于0
                &&
                _goodsinfo.effective_stock >= _goodsinfo.people_number //库存大于开团人数
                &&
                _goodsinfo.remain_number > 0 //限购数量大于0
                &&
                (Math.floor(_goodsinfo.end_time / 1000) > this.data.serviceTime); //活动未结束
        } else {
            //从分享页带团购ID进入
            //已经成团无需判断库存
            _isAllow = _goodsinfo.remain_number > 0 //限购数量大于0
                &&
                (Math.floor(_goodsinfo.end_time / 1000) > this.data.serviceTime); //活动未结束
        }
        this.setData({
            isAllow: _isAllow
        });
    },
    //推荐团购列表倒计时
    GroupTimeOut() {
        let _TempGroupList = this.data.GroupList;
        //有推荐拼团
        if (_TempGroupList.length > 0) {
            let grouptime = setInterval(() => {
                for (let item of _TempGroupList) {
                    let _time = Math.floor(item.unite_end_time / 1000) - this.data.serviceTime;
                    if (_time > 0) {
                        let _hours = Math.floor(_time / (60 * 60));
                        let _minute = Math.floor((_time - _hours * 60 * 60) / 60);
                        let _second = Math.floor(_time - _hours * 60 * 60 - _minute * 60);
                        _hours = _hours < 10 ? ('0' + _hours) : _hours
                        _minute = _minute < 10 ? ('0' + _minute) : _minute
                        _second = _second < 10 ? ('0' + _second) : _second
                        item.time = _hours + ':' + _minute + ':' + _second;
                    } else {
                        item.time = '00:00:00';
                        item.number = 0;
                    }
                }
                this.setData({
                    GroupList: _TempGroupList,
                    serviceTime: this.data.serviceTime + 1
                })
            }, 1000);
        }
    },
    //Tab切换
    TabToggle(e) {
        let index = e.currentTarget.dataset.index + '';
        this.setData({
            DetailActive: index
        })
        var goodsnavtop = this.data.goodsnavtop;
        if (wx.pageScrollTo) {
            wx.pageScrollTo({
                scrollTop: goodsnavtop
            })
        }
    },
    //联系客服菜单
    ToggleChaticonMenu() {
        this.MenuCustomer.ShowMenu();
    },
    //处理活动时间数据
    handleData() {
        let _Data = this.data.goodsinfo;
        _Data.starttime = app.Util.handleDate.formatTime_1(new Date(_Data.start_time), '-');
        _Data.endtime = app.Util.handleDate.formatTime_1(new Date(_Data.end_time), '-');
        this.setData({
            goodsinfo: _Data
        })
    },
    //提交拼团订单
    ConfirmGroupOrder(e) {
        let _id = this.data.goodsinfo.purchase_id;
        let _gid = this.data.GroupId;
        let _status = e.currentTarget.dataset.disabled != 'false';
        if (_status || _status == undefined) {
            wx.navigateTo({
                url: '/pages/GroupBuy/GroupBuyConfirm/GroupBuyConfirm?gid=' + _gid + '&id=' + _id
            });
        }
    },
    //拨打电话
    Calling() {
        app.calling();
    },
    //处理权限
    getUserInfo(e) {
        let _status = e.currentTarget.dataset.disabled;
        if (e.detail.userInfo) {
            this.setData({
                hasUserInfo: true
            })
            app.globalData.userInfo = e.detail.userInfo
            //此处提交订单
            if (_status || _status == undefined) {
                this.ConfirmGroupOrder(e);
            }
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
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        let _ImageUrl = this.data.goodsinfo.goods_img || app.globalData.sharedefault;
        let ShareOption = {
            title: '只要' + this.data.goodsinfo.purchase_price.toFixed(2) + '元就能拼到' + this.data.goodsinfo.goods_title,
            path: '/' + this.route + '?id=' + this.data.GoodsId + '&isShare=true',
            imageUrl: _ImageUrl,
        }
        return ShareOption;
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})