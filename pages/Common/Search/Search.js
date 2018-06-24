const searchController = require('../../controllers/searchController').controller;
Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    /**
     * 组件的属性列表
     * 用于组件自定义设置
     */
    properties: {
        inputValue: {
            type: String,
            value: ''
        },
        classtype: {
            type: String,
            value: ''
        },
        selectHide: {
            type: Boolean,
            value: true
        },
        clickable: {
            type: Boolean,
            value: false
        },
    },

    /**
     * 私有数据,组件的初始数据
     * 可用于模版渲染
     */
    data: {
        // clickable:false
    },
    ready() {
        this.Dialog = this.selectComponent("#Dialog");
    },
    /**
     * 组件的方法列表
     */
    methods: {
        //搜索框输入数据绑定
        bindInput(e) {
            let selectValue = e.detail.value;
            this.setData({
                selectHide: selectValue != '', //切换扫码按钮和清空按钮
                inputValue: e.detail.value
            });
        },
        searchSubmit(e) {
            let inputValue = e.detail.value;

            if (inputValue != '') {

                this.setData({
                    inputValue: inputValue
                });

                //调用API从本地缓存中获取数据
                let searchData = wx.getStorageSync('searchData') || [];

                let tempSearchData = [];
                for (let item of searchData) {
                    //查找是否有重复历史记录
                    if (item != this.data.inputValue) {
                        tempSearchData.push(item);
                    }
                }
                //将搜索内容加入数组（前端输出为倒序）
                tempSearchData.push(this.data.inputValue);
                wx.setStorageSync('searchData', tempSearchData);
                //触发搜索事件
                this.triggerEvent("SearchEvent", {
                    keyword: this.data.inputValue
                });
            } else {
                //搜索词为空
                this.Dialog.ShowDialog({
                    title: '请输入关键词!',
                    type: 'Message',
                    messageType: 'fail'
                });
            }
        },
        //清除搜索框内容
        clearInput() {
            this.setData({
                inputValue: '',
                selectHide: false
            });
        },
        //搜索框跳转
        tosearch() {
            if (this.properties.clickable) {
                wx.navigateTo({
                    url: '/pages/List/Search/Search'
                });
            }
        },
        //处理扫码
        scan() {
            wx.scanCode({
                success: res => {
                    wx.showLoading({
                        title: '识别中...',
                        mask: true
                    });

                    searchController.ScalCode({
                        barcode: res.result
                    }).then(res => {
                        if (res.done) {
                            //获取商品id
                            wx.navigateTo({
                                url: '/pages/Goods/GoodsDetail/GoodsDetail?id=' + res.result.goods_id
                            });
                        } else {
                            this.Dialog.ShowDialog({
                                type: 'Slot'
                            });
                        }
                        wx.hideLoading();
                    });
                },
                fail: res => {
                    wx.showToast({
                        title: '调用摄像头出错, 请重试！',
                        icon: 'none'
                    });
                }
            });
        }
    }
})