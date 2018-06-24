//app.js
const Util = require('/utils/util.js')
const indexController = require('/pages/controllers/indexController.js').controller;
App({
    onLaunch: function() {
        //获取token
        let token = wx.getStorageSync('token') || '';

        //优先判断token
        if (token) {

            //获取应用设置
            this.GetParameter();

            //延时获取导航栏红点状态
            setTimeout(() => {
                this.SetHotRed();
            }, 1000);

            //延时判断微信服务器Session状态
            setTimeout(() => {
                wx.checkSession({
                    success: () => {
                        //session_key 未过期，并且在本生命周期一直有效
                    },
                    fail: () => {
                        // session_key 已经失效，需要重新执行登录流程
                        this.GetLogin();
                    }
                });
            }, 1500);
        } else {
            //无token，直接登录
            this.GetLogin();
        }

        // 登录
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    // 未授权，跳转授权页面
                    wx.getUserInfo({
                        success: res => {
                            this.globalData.userInfo = res.userInfo
                            if (this.userInfoReadyCallback) {
                                this.userInfoReadyCallback(res)
                            }
                        }
                    });
                }
            }
        });

        //异步更新 + 强制更新

        // wx.getUpdateManager 在 1.9.90 才可用，请注意兼容
        const updateManager = wx.getUpdateManager()

        updateManager.onCheckForUpdate(function(res) {
            // 请求完新版本信息的回调
            console.log(res.hasUpdate)
        });

        updateManager.onUpdateReady(function() {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否马上重启小程序？',
                success: function(res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                    }
                }
            });
        })

        updateManager.onUpdateFailed(function() {
            // 新的版本下载失败
        });

    },
    //登录请求
    GetLogin() {
        wx.showLoading({
            title: '登录中...',
            mask: true
        });
        wx.login({
            success: res => {
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
                indexController.UserApiLogin({
                    code: res.code
                }).then(result => {
                    if (result.done) {
                        wx.setStorageSync('token', result.result.token)
                        if (this.tokenReadyCallback) {
                            this.tokenReadyCallback(result);
                        }
                        this.GetParameter();

                        setTimeout(() => {
                            this.SetHotRed();
                        }, 1000);
                    }
                    wx.hideLoading();
                });
            }
        });
    },
    //公共变量
    globalData: {
        userInfo: null,
        defaultImg: 'http://www.kzj365.com/mini_program/images/default.png',
        goodsdefault: 'http://www.kzj365.com/mini_program/images/goods_default.png',
        sharedefault: 'http://www.kzj365.com/mini_program/images/share_default.png',
        mobile: '',
        cashStatus: false, //货到付款开启状态
        open_rx: '', //后台设置开启购买
        isOpenCustomerService: false, //是否开启在线客服
        AddressId: '', //用于订单地址选择
        PaySuccessGroupId: '' //用于拼团成功后，返回详情页提示分享
    },
    Util: {
        handleDate: Util
    },
    //图片统一错误处理
    errImg: function(e, that) {
        let _obj = e.target.dataset.obj;
        let _errObj = {};
        _errObj[_obj] = this.globalData.defaultImg;
        that.setData(_errObj);
    },
    //拨打电话
    calling: function() {
        wx.makePhoneCall({
            phoneNumber: this.globalData.mobile,
            success: function() {
                console.log("拨打电话成功！")
            },
            fail: function() {
                console.log("拨打电话失败！")
            }
        })
    },
    //获取全局公共参数
    GetParameter() {
        indexController.GetParameter().then(res => {
            if (res.done) {
                this.globalData.mobile = res.result.parameter.customer_phone;
                this.globalData.cashStatus = res.result.parameter.open_cash_delivery == 1;
                this.globalData.open_rx = res.result.parameter.open_rx;
            }
        });
    },
    //设置导航栏红点
    SetHotRed() {
        indexController.GetCartCountAndOrderCount().then(res => {
            if (res.done) {
                if (res.result.cartCount > 0) {
                    wx.showTabBarRedDot({
                        index: 2
                    });
                } else {
                    wx.hideTabBarRedDot({
                        index: 2
                    });
                }
                if (res.result.orderCount > 0) {
                    wx.showTabBarRedDot({
                        index: 3
                    });
                } else {
                    wx.hideTabBarRedDot({
                        index: 3
                    });
                }
            }
        });
    }
})