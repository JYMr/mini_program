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
        Default_avatar: 'https://mini.kzj365.com.cn/images/avatar_default.png',
        ShareData: {},
        serviceTime: '',
        GroupTime: '',
        DefaultImage: '', //默认底图
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        hasUserInfo: false,
        ShareImg: ''
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

        let token = wx.getStorageSync('token') || '';
        if (token) {
            this.GetShaerData();
        } else {
            app.tokenReadyCallback = res => {
                this.GetShaerData();
            }
        }
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

                this.creteShareImage();
            } else {
                wx.showToast({
                    title: res.msg || '服务器出错,请重试',
                    icon: 'none'
                });
            }
            setTimeout(()=>{
                wx.hideLoading();
            }, 500);
        });
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
                    //活动或拼团时间到，刷新数据
                    this.GetShaerData();
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
            path: '/' + this.route + '?gid=' + GroupId + '&isShare=true',
            imageUrl: this.data.ShareImg || this.data.ShareData.goods_img || app.globalData.sharedefault
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
    creteShareImage(callback) {

        //获取上下文
        const ctx = wx.createCanvasContext('myCanvas');
        //替换主图二级域名
        let img = this.data.ShareData.goods_img.replace('https://kzj-mini-program.oss-cn-shenzhen.aliyuncs.com/', 'https://oss.kzj365.com.cn/');
        //组装立省文字
        const text = '立省' + this.data.ShareData.preferen_price.toFixed(2) + '元';

        //组装图片绘制队列
        let drawArr = this.data.ShareData.headimgs;
        //主图放在第一张
        drawArr.unshift(img || 'https://mini.kzj365.com.cn/images/goods_default.png');

        //下载图片缓存
        let tempImageArr = [];

        //绘制白色底
        let DrawBackgroud = function() {
            ctx.setFillStyle('#FFF');
            ctx.fillRect(0, 0, 750, 600);
        }

        //绘制队列
        let DrawImageList = function(key = 0) {
            wx.downloadFile({
                url: drawArr[key], //仅为示例，并非真实的资源
                success: res => {
                    // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                    if (res.statusCode === 200) {
                        let y;
                        if (drawArr.length > 6) {
                            y = key > 5 ? 500 : 360;
                        } else {
                            y = 410;
                        }
                        if (key == 0) {
                            ctx.drawImage(res.tempFilePath, 0, 0, 320, 320);
                        } else {
                            if (key == 2) {
                                for (let ukey in drawArr) {

                                }
                            }
                            ctx.save();
                            ctx.beginPath()
                            ctx.arc((key % 6 - 1) * (100 + 30) + 50, y + 50, 50, 0, 2 * Math.PI);
                            ctx.closePath();
                            ctx.clip();
                            ctx.drawImage(res.tempFilePath, (key % 6 - 1) * (100 + 30), y, 100, 100);
                            ctx.restore();
                        }
                        //覆盖绘制
                        ctx.draw(true, () => {
                            if (key < drawArr.length - 1) {
                                key++;
                                DrawImageList(key);
                            } else {
                                //若为最后一张图片，导出canvas
                                wx.canvasToTempFilePath({
                                    x: 0,
                                    y: 0,
                                    width: 750,
                                    height: 600,
                                    destWidth: 750,
                                    destHeight: 600,
                                    quality: 1,
                                    canvasId: 'myCanvas',
                                    success: res => {
                                        this.setData({
                                            ShareImg: res.tempFilePath
                                        });
                                    }
                                })
                            }
                        });
                    }
                },
                fail: err => {}
            });
        }.bind(this);


        //绘制背景矩形："立省"
        let createRect = function(width) {
            ctx.save();
            ctx.rect(360, 0, width, 60);
            ctx.fillStyle = '#FF5C58';
            ctx.fill();
            ctx.restore();
        }

        //绘制圆角
        let roundRect = function(x, y, width, height, radius) {
            ctx.save();
            ctx.lineWidth = 4;
            ctx.fillStyle = '#FFF';
            ctx.strokeStyle = '#FF5C58';
            ctx.beginPath();
            ctx.moveTo(x, y + radius);
            ctx.lineTo(x, y + height - radius);
            ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
            ctx.lineTo(x + width - radius, y + height);
            ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
            ctx.lineTo(x + width, y + radius);
            ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
            ctx.lineTo(x + radius, y);
            ctx.quadraticCurveTo(x, y, x, y + radius);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        //绘制圆角矩形："立即参团"
        let createRect1 = function(ctx) {
            roundRect(360, 252, 208, 60, 30);
        }

        let createWord1 = function(ctx, str, x, y) {
            ctx.setFontSize(48)
            ctx.fillStyle = '#FFF';
            ctx.fillText(str, x, y);
        }

        //绘制文字: 价格
        var createWord2 = function(ctx, str, x, y) {
            //ctx.font = 'bold';
            ctx.setFontSize(60);
            ctx.fillStyle = '#FF5C58';
            ctx.fillText(str, x, y);
        }

        //绘制文字："仅剩", "个名额"
        let createWord3 = function(ctx, str, x, y) {
            ctx.setFontSize(44);
            ctx.fillStyle = '#555555';
            ctx.fillText(str, x, y);
        }

        //绘制文字：剩余名额，数字(红色)
        let createWord4 = function(ctx, str, x, y) {
            ctx.font = "44px Microsoft YaHei";
            ctx.fillStyle = '#FF5C58';
            ctx.fillText(str, x, y);
        }

        //绘制文字："立即参团"
        let createWord5 = function(ctx, str, x, y) {
            ctx.save();
            ctx.font = 'bold';
            ctx.setFontSize(36);
            ctx.fillStyle = '#FF5C58';
            ctx.fillText(str, x, y);
            ctx.restore();
        }

        //绘制白色背景
        DrawBackgroud();


        //绘制参团剩下名额文字
        createWord3(ctx, '仅剩', 360, 120);
        createWord4(ctx, this.data.ShareData.remain_number, 454, 120);
        createWord3(ctx, '个名额', 486, 120);

        //绘制拼团价格
        createWord2(ctx, '¥ ' + this.data.ShareData.purchase_price, 360, 200);

        //测量立省文字宽度
        const metrics = ctx.measureText(text)
        //绘制立省背景色块
        createRect(metrics.width - 55);
        //绘制立省文字
        createWord1(ctx, text, 366, 48);

        //绘制立即参团按钮矩形边框和文字
        createRect1(ctx);
        createWord5(ctx, "立即参团", 394, 294);


        //开始下载图片
        DrawImageList();

    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})