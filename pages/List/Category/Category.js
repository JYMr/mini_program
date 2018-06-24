// pages/cate/cate.js
const categoryController = require('../../controllers/categoryController.js').controller;
const app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        chooseId: null,
        CategoryList: [],
        ChildList: [],
        DefaultImage: ''
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        if (options.id) {
            this.setData({
                chooseId: options.id
            });
        }
        this.getCategory();


        //获取全局默认图片底图
        this.setData({
            DefaultImage: app.globalData.defaultImg
        })
    },
    //根据Id获取子数据索引
    getDataIndex(id) {
        let _cateItemData = this.data.cateItems;
        for (let key in _cateItemData) {
            if (_cateItemData[key].cate_id == id) return key;
        }
    },
    //获取一级数据
    getCategory() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        categoryController.getcategory().then(res => {
            if (res.done) {
                this.setData({
                    CategoryList: res.result.categorylist
                })
                this.getcategoryChild();
                wx.hideLoading();
            } else {
                wx.showToast({
                    title: res.msg || '服务器出错,请重试',
                    icon: 'none'
                })
            }
        })
    },
    //获取二级数据
    getcategoryChild() {
        let id = this.data.chooseId;
        if (id) {
            for (let item of this.data.CategoryList) {
                if (item.catId == id) {
                    this.setData({
                        ChildList: item.subCategorys || [],
                        chooseId: item.catId
                    })
                }
            }
        } else {
            this.setData({
                ChildList: this.data.CategoryList[0].subCategorys || [],
                chooseId: this.data.CategoryList[0].catId
            })
        }
    },
    //事件处理函数  
    switchRightTab: function(e) {
        // 获取item项的id，和数组的下标值  
        let id = e.target.dataset.id;
        this.setData({
            chooseId: id
        })
        this.getcategoryChild();
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})