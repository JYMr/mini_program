// pages/search.js
const searchController = require('../../controllers/searchController').controller;
Page({
    data: {
        inputValue: '',
        selectHide: false,
        searchstory: [],
        hotgoods: [],
        SearchHotListLoading: false
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.GetKeyWordList();
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
        //从本地获取搜索记录
        let searchstory = wx.getStorageSync('searchData');
        if (searchstory && searchstory.length > 0) {
            //进行倒序
            searchstory = searchstory.reverse();
        }
        this.setData({
            searchstory: searchstory,
            inputValue: '',
            selectHide: false
        });
    },
    clearSearchStorage() {
        /*this.Dialog.ShowDialog({
            type: 'Confirm',
            title: '确定清除历史记录?',
            callback: res => {
                if (res.name == 'confirm') {
                    */
                    wx.setStorageSync('searchData', []);
                    this.setData({
                        searchstory: []
                    });
                    /*
                    this.Dialog.CloseDialog();
                } else {
                    this.Dialog.CloseDialog();
                }
            }
        });
        */
    },
    searchSubmit(e) {
        if (e.target.dataset.search) {
            this.setData({
                inputValue: e.target.dataset.search
            });
        }
        let data;
        let localStorageValue = [];
        if (this.data.inputValue != '') {
            //调用API从本地缓存中获取数据
            var searchData = wx.getStorageSync('searchData') || [];
            var tempSearchData = [];
            //过滤历史列表中相同的搜索记录
            for (let item of searchData) {
                if (item != this.data.inputValue) {
                    tempSearchData.push(item);
                }
            }
            tempSearchData.push(this.data.inputValue);
            wx.setStorageSync('searchData', tempSearchData);
            //跳转列表
            wx.navigateTo({
                url: "/pages/List/GoodsList/GoodsList?search=" + this.data.inputValue
            });
        } else {
            wx.showToast({
                title: '请输入关键词！',
                icon: 'none',
                duration: 2000
            });
        }
    },
    //处理搜索事件
    SearchtoList(e) {
        let keyword = e.detail.keyword;
        wx.navigateTo({
            url: '/pages/List/GoodsList/GoodsList?search=' + keyword
        });
    },
    //获取关键字列表
    GetKeyWordList() {
        this.setData({
            SearchHotListLoading: true
        });
        searchController.GetSearchKeyWord().then(res => {
            if (res.done) {
                this.setData({
                    hotgoods: res.result.kewordlist,
                    SearchHotListLoading: false
                });
            } else {
                this.setData({
                    SearchHotListLoading: false
                });
            }
        }).catch(err => {
            this.setData({
                SearchHotListLoading: false
            });
        });
    }
})