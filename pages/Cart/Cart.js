// pages/cart.js
const cartController = require('../controllers/cartController').controller;
const app = getApp();
Page({
    /**
     * 页面的初始数据
     */
    data: {
        CartList: [],
        editMode: false,
        isAllSelect: false,
        GoodsTotalNum: 0,
        GoodsTotalPrice: 0,
        MaxExpress: 99, //买满包邮
        ExpressPrice: '10', //运费
        ExpressText: '',
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        hasUserInfo: false,
        timer: null,
        DefaultImage: '',
        RequestError: false,
        isLoading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

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
                    });
                }
            })
        }

        //取消红点
        wx.hideTabBarRedDot({
            index: 2
        });

        this.setData({
            DefaultImage: app.globalData.defaultImg
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        this.Dialog = this.selectComponent("#Dialog");
    },

    onShow() {
        this.GetCartList();
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        this.GetCartList(false);
    },
    //获取购物车数据
    GetCartList(flag) {

        if (flag !== false) {
            wx.showLoading({
                title: '加载数据中...',
                mask: true
            });
        }

        cartController.getCartData({
            shopcart_type: 1
        }).then(res => {
            if (res.done) {

                //获取缓存选择状态
                //res.result.shopCartApiList = this.GetCartChoose(res.result.shopCartApiList);

                this.setData({
                    CartList: res.result.shopCartApiList,
                    isLoading: true,
                    RequestError: false
                });

                //检查是否全选
                this.CheckAllSelect();
                //处理优惠套餐
                //this.handleGroup();
                //统计
                this.ListTotal();

            } else {
                this.setData({
                    RequestError: true
                });
            }
            wx.hideLoading();
            wx.stopPullDownRefresh();
        }).catch(err => {
            this.setData({
                RequestError: true
            });

            wx.stopPullDownRefresh();
        });
    },
    //处理优惠套餐
    handleGroup() {
        let _List = this.data.CartList;
        /*
         * 这里可更改为接口查询
         */
        for (let item of _List) {
            let _Length = item.goods_group.length;
            item.price = item.marketprice;
            item.GroupName = item.goods_group[_Length - 1].name;
            item.GroupStatus = -1;
            for (let gItem of item.goods_group) {
                //goods_group 注意需为升序
                if (item.total >= gItem.num) {
                    item.price = gItem.price; //更改套餐价格
                    if (gItem.name) item.GroupName = gItem.name; //更改套餐名称
                    item.GroupStatus = 1; //更改套餐状态
                }
            }
        }
        this.setData({
            CartList: _List
        })
    },
    //统计价格数量方法
    ListTotal() {
        let _List = this.data.CartList;
        let _TotalNum = 0;
        let _TotalPrice = 0;
        for (let item of _List) {
            //是否选中
            if (item.isChoose == '1') {
                _TotalNum = _TotalNum + parseInt(item.shopcart_num);
                _TotalPrice = parseFloat(
                    parseFloat(_TotalPrice) + (parseInt(item.shopcart_num) * parseFloat(item.goods_price))
                )
            }
        }
        this.handleExpress(_TotalPrice);
        this.setData({
            GoodsTotalNum: _TotalNum,
            GoodsTotalPrice: _TotalPrice
        });
    },
    //邮费判断
    //return 处理后价格
    handleExpress(TotalPrice) {
        if (TotalPrice < this.data.MaxExpress) {
            if (TotalPrice > 0) {
                this.setData({
                    ExpressText: '还差' + parseFloat(this.data.MaxExpress - parseFloat(TotalPrice)).toFixed(2) + '元可以包邮'
                })
            } else {
                this.setData({
                    ExpressText: '（买满99包邮）'
                })
            }
        } else {
            this.setData({
                ExpressText: '(已免邮)'
            })
        }
    },
    //数量增加
    bindPlus(e) {
        //编辑模式下不可用
        if (this.data.editMode) return;
        let _id = e.currentTarget.dataset.id;
        let _total = 0;
        let _List = this.data.CartList;
        for (let item of _List) {
            if (item.shopcart_id == _id) {
                if (item.goods_stock > item.shopcart_num) {
                    _total = ++item.shopcart_num;
                } else {
                    //到达最大库存，提示
                    wx.showToast({
                        title: '已经是库存上限咯!',
                        icon: 'none'
                    });
                }
            }
        }
        if (_total != 0)
            this.setTotal(_id, _total);
        this.setData({
            CartList: _List
        });
        //this.handleGroup();
        this.ListTotal();
    },
    //数量减少
    bindMinus(e) {
        //编辑模式下不可用
        if (this.data.editMode) return;
        let _id = e.currentTarget.dataset.id;
        let _total = 0;
        let _List = this.data.CartList;
        for (let item of _List) {
            if (item.shopcart_id == _id && item.shopcart_num > 1) {
                _total = --item.shopcart_num;
            }
        }
        if (_total != 0)
            this.setTotal(_id, _total);
        this.setData({
            CartList: _List
        });
        //this.handleGroup();
        this.ListTotal();
    },
    //数量提交函数,延迟提交，避免连续点击
    setTotal(id, total) {
        if (this.data.timer) {
            clearTimeout(this.data.timer);
        }
        let _List = this.data.CartList;
        let _thistime = setTimeout(() => {
            cartController.setCartTotal({
                shopcart_id: id,
                shopcart_num: total
            }).then(res => {
                if (res.done) {
                    for (let item of _List) {
                        if (item.shopcart_id == id) {
                            item.promotion = res.result.shopCartApi1.promotion;
                            item.goods_stock = res.result.shopCartApi1.goods_stock;
                            item.goods_price = res.result.shopCartApi1.goods_price;
                            item.promotionF = res.result.shopCartApi1.promotionF;
                        }
                    }
                    this.setData({
                        CartList: _List
                    });
                    //重新统计
                    this.ListTotal();
                } else {
                    wx.showToast({
                        title: res.msg || '服务器出错,请重试',
                        icon: 'none'
                    });
                }
            })
        }, 500)
        this.setData({
            timer: _thistime
        })
    },
    //复选框事件
    HandleCheckBox(e) {
        let _id = e.currentTarget.dataset.id;
        let _isChoose = 0;
        let _List = this.data.CartList;
        for (let item of _List) {
            if (item.shopcart_id == _id) {
                item.isChoose = item.isChoose == '1' ? '0' : '1'
                _isChoose = item.isChoose;
            }
        }
        //非编辑模式下，提交选中状态
        /*if (!this.data.editMode) {
            //此处接口提交选中状态
            cartController.setCartChoose({
                id: _id,
                isChoose: _isChoose
            })
        }*/

        this.setData({
            CartList: _List
        });

        //this.SetCartChoose();
        this.CheckAllSelect();
        this.ListTotal();
    },
    //检查是否全选
    CheckAllSelect() {
        let _List = this.data.CartList;
        let length = _List.length;
        let ChooseLength = 0;
        for (let item of _List) {
            if (item.isChoose == '1') {
                ChooseLength++;
            }
        }
        this.setData({
            isAllSelect: ChooseLength == length
        });
    },
    //全选或反选
    AllSelect() {
        let _status = this.data.isAllSelect;
        let _List = this.data.CartList;
        for (let item of _List) {
            item.isChoose = !_status;
        }
        this.setData({
            isAllSelect: !_status,
            CartList: _List
        })
        this.ListTotal();
    },
    //编辑模式
    editMode() {
        this.setData({
            editMode: !this.data.editMode
        });
    },
    //删除购物车操作
    DelCartList() {
        let _List = this.data.CartList;
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
        this.Dialog.ShowDialog({
            title: '确定删除选中的购物车商品',
            type: 'Confirm',
            callback: res => {
                if (res.name == 'confirm') {
                    /**
                     * 此处删除接口
                     */

                    this.Dialog.CloseDialog();
                    wx.showLoading({
                        mask: true
                    });
                    cartController.delCart({
                        shopcartids: DelList.toString(),
                        shopcart_type: 1
                    }).then(res => {
                        if (res.done) {
                            this.Dialog.ShowDialog({
                                type: 'Message',
                                title: '删除成功'
                            })
                            setTimeout(() => {
                                this.GetCartList()
                            }, 1500)
                        } else {
                            this.Dialog.ShowDialog({
                                type: 'Message',
                                title: res.msg || '删除失败',
                                messageType: 'fail'
                            })
                        }
                        wx.hideLoading();
                    })
                } else {
                    this.Dialog.CloseDialog();
                }
            }
        })
    },
    ConfirmOrder() {
        let idList = this.GetChoose();
        if (idList != '') {
            wx.showLoading({
                mask: true,
                title: '加载中...'
            });
            wx.navigateTo({
                url: '/pages/Order/ConfirmOrder/ConfirmOrder?mode=0&id=' + idList
            })
        }
    },
    //获取已选择的ID，并检查选择商品库存上下架
    GetChoose() {
        let _List = this.data.CartList;
        let _ChooseID = [];
        for (let item of _List) {
            if (item.isChoose == 1) {
                //判断是否选中了下架商品
                if (item.goods_added == 0) {
                    this.Dialog.ShowDialog({
                        type: 'Message',
                        title: '有商品已下架了!',
                        messageType: 'fail'
                    });
                    return '';
                }
                if (item.goods_stock <= 0) {
                    this.Dialog.ShowDialog({
                        type: 'Message',
                        title: '有商品无货了!',
                        messageType: 'fail'
                    });
                    return '';
                }
                _ChooseID.push(item.shopcart_id);
            }
        }
        //若没有选中
        if (_ChooseID.length <= 0) {
            this.Dialog.ShowDialog({
                type: 'Message',
                title: '请选择你要结算的商品',
                messageType: 'fail'
            });
            return '';
        }
        return _ChooseID.toString();
    },
    //缓存选择状态
    SetCartChoose(){
        let _List = this.data.CartList;
        let _ChooseList = [];

        for(let item of _List){
            if(item.isChoose == 1) _ChooseList.push(item.shopcart_id);
        }

        wx.setStorageSync('CartChooseList', _ChooseList);
    },
    GetCartChoose(list){
        let _chooselist = wx.getStorageSync('CartChooseList');
        if(_chooselist.length > 0){
            for(let item of list){
                for(let uitem of _chooselist){
                    if(item.shopcart_id == uitem) item.isChoose = 1;
                }
            }
        }
        console.log(_chooselist);
        return list;
    },
    //申请授权判断
    getUserInfo(e) {
        if (e.detail.userInfo) {
            this.setData({
                hasUserInfo: true
            })
            app.globalData.userInfo = e.detail.userInfo
            //此处提交订单
            this.ConfirmOrder();
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