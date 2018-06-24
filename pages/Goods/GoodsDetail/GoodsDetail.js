const goodscontroller = require('../../controllers/goodsController.js').controller;
const cartController = require('../../controllers/cartController').controller;
const reservationController = require('../../controllers/reservationController').controller;
const app = getApp();

Page({
    data: {
        id: '',
        num: 1,
        tabsindex: 0,
        isShare: false, //是否分享进入
        goodsinfo: {}, //商品信息
        spec: {}, //规格
        chooseSpecId: '', //选择的规格id
        chooseSpecName: '', //选择的商品规格名称
        chooseSpecStock: '', //选择的商品规格库存
        chooseSpecAdded: '', //选择的商品规格上下架
        showModalStatus: false, //是否显示
        ModalMode: 'Buy', //遮罩模式
        goodsnavtop: 0, //tab距离顶部的距离
        goodsnavbool: false, //tab是否浮动
        DefaultImage: '', //默认底图
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        hasUserInfo: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
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
                    app.globalData.userInfo = res.userInfo;
                    this.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    });
                }
            });
        }

        if (options.isShare) {
            //是否分享链接进入
            this.setData({
                isShare: options.isShare
            });
        }

        if (options.id) {
            this.setData({
                id: options.id
            });

            let token = wx.getStorageSync('token') || '';
            if (token) {
                //加载数据
                this.GetGoodsData();
            } else {
                //首次进入，等待login登录回调
                app.tokenReadyCallback = res => {
                    this.GetGoodsData();
                }
            }
        } else {
            //无Id，关闭页面
            wx.navigateBack({
                delta: 1
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
    onReady() {
        this.Dialog = this.selectComponent('#Dialog');
        this.ReservationInput = this.selectComponent('#ReservationInput');
        this.MenuCustomer = this.selectComponent('#MenuCustomer');

        var that = this;
        var query = wx.createSelectorQuery()
        query.select('.goodsnav').boundingClientRect(function(res) {
            that.setData({
                goodsnavtop: res.top
            })
        }).exec()
    },
    onPageScroll: function(e) {
        // 获取滚动条当前位置
        if (e.scrollTop > this.data.goodsnavtop) {
            this.setData({
                goodsnavbool: true
            })
        } else {
            this.setData({
                goodsnavbool: false
            })
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        let _ImageUrl = app.globalData.sharedefault;
        let _GoodsImageList = this.data.goodsinfo.goodsImg;
        let ShareOption = {
            title: '只要' + this.data.goodsinfo.goodsPrice.toFixed(2) + '元就能抢到' + this.data.goodsinfo.goodsName,
            path: '' + this.route + '?id=' + this.data.id + '&isShare=true',
            imageUrl: _GoodsImageList || _ImageUrl
        }
        return ShareOption;
    },
    //加载商品信息
    GetGoodsData() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        //接口加载数据
        goodscontroller.getGoodsDetail({
            goodsId: this.data.id
        }).then(res => {
            if (res.done) {
                //提取规格信息
                let _Spec = {};
                _Spec.name = res.result.goodsdetail.goodsTitle;
                _Spec.price = res.result.goodsdetail.goodsPrice;
                _Spec.src = res.result.goodsdetail.goodsImg;
                _Spec.speclists = res.result.goodsdetail.specGoodsApis || [];
                _Spec.packager = res.result.goodsdetail.goodsCombinations || [];

                //处理商品轮播图为空
                if (res.result.goodsdetail.goodsImages.length == 0) {
                    res.result.goodsdetail.goodsImages.push({
                        imageArtworkName: app.globalData.DefaultImage
                    });
                }

                //框选默认规格，并处理套餐
                _Spec = this.DefaultAttr(_Spec);

                this.setData({
                    goodsinfo: res.result.goodsdetail,
                    spec: _Spec,
                    //保存当前商品id和库存
                    chooseSpecId: res.result.goodsdetail.goodsId,
                    chooseSpecStock: res.result.goodsdetail.goodsStock
                });

                wx.hideLoading();
            } else {
                wx.hideLoading();
                wx.showToast({
                    title: res.msg || '拉取商品数据失败，请返回重试',
                    icon: 'none'
                });
            }
        });
    },
    //加入购物车
    AddCart() {

        cartController.addCart({
            shopcart_goods_id: this.data.chooseSpecId,
            shopcart_num: this.data.num,
            shopcart_type: 1
        }).then(res => {
            if (res.done) {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: '加入购物车成功'
                });
                this.setData({
                    editMode: false
                });
                setTimeout(() => {
                    this.hideModal();
                }, 1500);
            } else {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: res.msg || '加入购物车失败',
                    messageType: 'fail'
                })
            }
        })
    },
    //加入预定清单
    AddRxCart() {
        cartController.addCart({
            shopcart_goods_id: this.data.chooseSpecId,
            shopcart_num: this.data.num,
            shopcart_type: 2
        }).then(res => {
            if (res.done) {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: '加入清单成功'
                })
                setTimeout(() => {
                    this.hideModal();
                }, 1500);

            } else {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: '加入清单失败',
                    messageType: 'fail'
                });
            }
        })
    },
    //非处方药提交订单
    BuyFn() {
        this.hideModal();
        wx.navigateTo({
            url: '/pages/Order/ConfirmOrder/ConfirmOrder?mode=1&id=' + this.data.chooseSpecId + '&num=' + this.data.num
        });
    },
    //预定方法
    RxBuyFn(e) {
        //获取返回用户填写的信息
        let UserInfo = e.detail;
        wx.showLoading({
            title: '提交中...',
            mask: true
        });
        reservationController.CreatelNeed({
            needPerson: UserInfo.name,
            needPhone: UserInfo.mobile,
            goodsId: this.data.chooseSpecId
        }).then(res => {
            if (res.done) {

                setTimeout(() => {
                    this.hideModal();
                }, 1500);
                wx.navigateTo({
                    url: '/pages/Order/ReservationOrder/ReservationOrder'
                });
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
    /* 点击减号 */
    bindMinus(e) {
        let _num = this.data.num;
        if (_num <= 1) return;
        this.setData({
            num: --_num
        });
        //处理套餐
        this.AutoPackager();
    },
    /* 点击加号 */
    bindPlus(e) {
        let _num = this.data.num;
        if (_num >= this.data.chooseSpecStock) {
            //到达最大库存，提示
            wx.showToast({
                title: '已经是库存上限咯!',
                icon: 'none'
            });
            return;
        }
        this.setData({
            num: ++_num
        });
        //处理套餐
        this.AutoPackager();
    },
    /* 输入框事件 */
    bindManual(e) {
        var _num = e.detail.value;
        //判断空值
        if (_num == '') {
            _num = 1;
        }
        //判断库存
        if (_num > this.data.chooseSpecStock) {
            wx.showToast({
                title: '超过库存上限咯!',
                icon: 'none'
            });
            _num = this.data.chooseSpecStock;
        }
        this.setData({
            num: _num
        });

        //处理套餐
        this.AutoPackager();
    },
    //处理加入购物车，立即购买事件
    HandleModal(e) {
        let Mode = e.currentTarget.dataset.type || '';

        this.setData({
            ModalMode: Mode
        });

        //商品为Rx，并商品无有关联规格时，直接跳过规格弹窗确认步骤
        if (this.data.spec.speclists.length == 0 && this.data.goodsinfo.goodsType == 0) {
            //无关联规格，直接加入预定清单
            this.ModalConfirm();
        } else {
            //处理已选择规格，若已选择规格，无库存或者下架恢复默认规格
            if (this.data.chooseSpecAdded == 0 || this.data.chooseSpecStock <= 0) {
                let _Spec = this.data.spec;
                _Spec.speclists = this.data.goodsinfo.specGoodsApis;
                _Spec = this.DefaultAttr(_Spec);
                this.setData({
                    spec: _Spec
                });
            }
            //有关联规格，显示规格弹层
            this.showModal();
        }
    },
    //数量变化自动选择套餐
    AutoPackager() {
        let _List = this.data.spec;
        let _Num = this.data.num;
        //判断是否有套餐
        if (_List.packager && _List.packager.length > 0) {

            //除去套餐选中
            for (let item of _List.packager) {
                item.isselect = false;
            }

            for (let key = _List.packager.length - 1; key >= 0; key--) {
                //判断数量是否符合套餐数量
                if (this.data.num >= _List.packager[key].packageCount) {
                    //添加选中
                    _List.packager[key].isselect = true;
                    break;
                }
            }

            this.setData({
                spec: _List
            });
        }
    },
    //规格选择,套餐选择
    ClickAttr(e) {
        let type = e.currentTarget.dataset.type;
        let _Spec = this.data.spec;
        let _Name = this.data.selectspec;
        if (type == 'spec') {
            //处理规格选择
            let _List = _Spec.speclists;
            let _ChooseIndex = e.currentTarget.dataset.index;
            let _Added = this.data.chooseSpecAdded;
            let _SpecId = this.data.chooseSpecId; //选择的商品规格id
            let _Stock = 1; //选择的商品库存

            let _ChooseFlag = false; //点击规格是否可以选中

            //判断规格id以及规格库存,以及是否上下架
            for (let key in _List) {
                if (_ChooseIndex == key) {
                    //购物车或者立即购买的规格弹窗无库存或下架弹出，无法点击
                    //选择规格可以点击
                    if (this.data.ModalMode != '' && (_List[key].goodsStock <= 0 || _List[key].goodsAdded == 0)) {
                        break;
                    }
                    _ChooseFlag = true;
                    //选中规格
                    _List[key].isselect = true;
                    //获取规格名
                    _Name = _List[key].goodsSpec;
                    //获取规格商品名
                    _Spec.name = _List[key].goodsTitle;
                    //获取规格商品主图
                    _Spec.src = _List[key].goodsImg;
                    //获取规格套餐
                    _Spec.packager = _List[key].goodsCombinations;
                    //获取规格商品价格
                    _Spec.price = _List[key].goodsPrice;
                    //获取规格ID
                    _SpecId = _List[key].goodsId;
                    _Spec.SpecId = _List[key].goodsId;
                    //获取规格
                    _Spec.Stock = _List[key].goodsStock;
                    _Stock = _List[key].goodsStock;
                    //获取规格上下架状态
                    _Spec.Added = _List[key].goodsAdded;
                    _Added = _List[key].goodsAdded;
                    break;
                }
            }

            //处理套餐
            _Spec = this.DefaultAttr(_Spec, 'packager');

            if (_ChooseFlag) {
                //若可以选中，则除点击项外，其他选择状态取消
                for (let ukey in _List) {
                    if (ukey != _ChooseIndex) _List[ukey].isselect = false;
                }
            }

            //如果选择数量大于所选规格库存，则设置为数量为商品最大库存
            let _num = this.data.num >= _Stock ? (_Stock == 0 ? 1 : _Stock) : this.data.num;

            this.setData({
                spec: _Spec,
                chooseSpecId: _SpecId,
                chooseSpecName: _Name || '默认规格',
                chooseSpecStock: _Stock,
                chooseSpecAdded: _Added,
                num: _num
            });

            //刷新套餐选中
            this.AutoPackager();

        } else if (type == 'packager') {
            //处理套餐选择
            //如果为处方药，仅提供展示
            if (this.data.goodsinfo.goodsType == 0) return;

            let _List = _Spec.packager;
            let _ChooseFlag = false; //点击套餐是否可以选中

            //套餐数量
            let _Num = this.data.num;
            let _ChooseIndex = e.currentTarget.dataset.index;
            for (let key in _List) {
                //判断库存是否大于套餐数量
                if (_ChooseIndex == key && _List[key].packageCount <= this.data.chooseSpecStock) {
                    _ChooseFlag = true;
                    _List[key].isselect = true;
                    _Num = _List[key].packageCount;
                }
            }


            if (_ChooseFlag) {
                //若可以选中，则除点击项外，其他选择状态取消
                for (let ukey in _List) {
                    if (ukey != _ChooseIndex) _List[ukey].isselect = false;
                }
            }

            this.setData({
                spec: _Spec,
                num: _Num
            });
        }
    },
    //默认规格选中,处理套餐
    DefaultAttr(spec, mode) {

        if (mode == 'spec' || mode == undefined) {
            //全部取否
            for (let item of spec.speclists) {
                item.isselect = false;
            }
            if (spec.speclists != undefined && spec.speclists.length > 0 && spec.speclists[0].goodsStock > 0 && spec.speclists[0].goodsAdded == 1) {
                spec.speclists[0].isselect = true;
            }
        }

        //处理套餐，若存在套餐，默认添加标准装
        if (mode == 'packager' || mode == undefined) {
            if (spec.packager != undefined && spec.packager.length > 0) {
                //若存在标准装套餐，直接选中
                if (spec.packager[0].packageCount == 1) {
                    spec.packager[0].isselect = true;
                } else {
                    //若不存在标准装，默认添加一个
                    let defaultPaackage = {
                        "combinationPrice": spec.price,
                        "combinationTitle": "标准装",
                        "goodsId": spec.SpecId,
                        "packageCount": 1,
                        "isselect": spec.Added == 1 && spec.Stock > 0//判断库存和上下架状态
                    }
                    spec.packager.unshift(defaultPaackage);
                }
            }
        }
        return spec;
    },
    //规格选择层确定事件
    ModalConfirm() {
        let type = this.data.ModalMode;
        switch (type) {
            case 'Buy':
                //立即购买
                if (this.data.hasUserInfo) {
                    this.BuyFn();
                }
                break;
            case 'Cart':
                //加入购物车
                this.AddCart();
                break;
            case 'RxCart':
                //加入预定清单
                this.AddRxCart();
                break;
            case 'RxBuy':
                //立即预定
                //判断是否拥有用户权限
                if (this.data.hasUserInfo) {
                    this.ReservationInput.Show(this.data.UserInfo);
                }
                break;
            default:
                //处理选择规格
                this.ChooseSpec();
                this.hideModal();
        }
    },
    //选择规格
    ChooseSpec() {

        //刷新为点选规格的商品数据
        if (this.data.id == this.data.chooseSpecId) return;

        this.setData({
            id: this.data.chooseSpecId
        });
        this.GetGoodsData();

    },
    // 选项卡切换
    TabToggle(e) {
        var index = e.target.dataset.id;
        this.setData({
            tabsindex: index
        })
        var goodsnavtop = this.data.goodsnavtop;
        if (wx.pageScrollTo) {
            wx.pageScrollTo({
                scrollTop: goodsnavtop
            });
        }
    },
    // 显示遮罩层
    showModal(e) {
        var animation = wx.createAnimation({
            duration: 300,
            timingFunction: "linear",
            delay: 0
        });
        this.animation = animation
        animation.translateY(420).step()
        this.setData({
            animationData: animation.export(),
            showModalStatus: true
        });
        setTimeout(function() {
            animation.translateY(0).step()
            this.setData({
                animationData: animation.export()
            });
        }.bind(this), 100)
    },
    // 隐藏遮罩层
    hideModal() {
        var animation = wx.createAnimation({
            duration: 300,
            timingFunction: "linear",
            delay: 0
        })
        this.animation = animation
        animation.translateY(420).step()
        this.setData({
            animationData: animation.export(),
        })
        setTimeout(function() {
            animation.translateY(0).step()
            this.setData({
                animationData: animation.export(),
                showModalStatus: false
            })
        }.bind(this), 200)
    },
    //联系客服弹层
    ToggleChaticonMenu() {
        this.MenuCustomer.ShowMenu();
    },
    //处理图片错误
    errImg(event) {
        var that = this;
        app.errImg(event, that);
    },
    //处理用户权限选择
    getUserInfo(e) {
        if (e.detail.userInfo) {
            this.setData({
                hasUserInfo: true
            })
            app.globalData.userInfo = e.detail.userInfo
            //此处提交订单
            let Mode = this.data.ModalMode;
            if (Mode == 'Buy') {
                this.BuyFn();
            } else if (Mode == 'RxBuy') {
                this.ReservationInput.Show(this.data.UserInfo);
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
    ErrorImage(e) {
        app.errImg(e, this);
    }
})