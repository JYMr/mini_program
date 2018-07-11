//index.js
const indexControllers = require('../controllers/indexController.js').controller;
const app = getApp();

Page({
    data: {
        navmeau: [], //菜单
        collage: [], //拼团
        recommendgoods: [], //推荐单品
        isLoading: true,
        searchTop: 0,
        titleStatus: false,
        DefaultImage: ''
    },
    onLoad() {
        //获取全局默认图片底图
        this.setData({
            DefaultImage: app.globalData.defaultImg
        });

        let token = wx.getStorageSync('token') || '';

        if (token) {
            //加载首页数据
            this.GetHomeData();
        } else {
            //无token，等待login登录回调
            app.tokenReadyCallback = res => {
                this.GetHomeData();
            }
        }
    },
    onReady() {
        this.search = this.selectComponent("#search");
    },
    onShow() {
        this.getgoodsnavTop();
    },
    getgoodsnavTop() {
        var that = this;
        var query = wx.createSelectorQuery()
        query.select('#search').boundingClientRect(function(res) {
            that.setData({
                searchTop: res.top
            });
        }).exec();
    },
    onPageScroll: function(e) {
        console.log(e.scrollTop)
        // 获取滚动条当前位置
        if (e.scrollTop > this.data.searchTop) {
            //设置标题
            this.SetTitle(true);
        } else {
            this.SetTitle(false);
        }
    },
    SetTitle(flag) {
        if (!this.data.titleStatus && flag) {
            console.log('123')
            this.setData({
                titleStatus: true
            });
            wx.setNavigationBarTitle({
                title: '康之家智慧药房'
            });
        } else if (this.data.titleStatus && !flag) {
            this.setData({
                titleStatus: false
            });
            wx.setNavigationBarTitle({
                title: ''
            });
        }
    },
    //导航菜单事件响应
    IndexCategroyTap(e) {
        let _actid = e.currentTarget.dataset.actid;
        let _oneid = e.currentTarget.dataset.oneid || '';
        let _twoid = e.currentTarget.dataset.twoid || '';
        let type = e.currentTarget.dataset.type;
        if (type == 0) {
            if (_twoid) {
                //二级分类跳转搜索页
                wx.navigateTo({
                    url: '/pages/List/GoodsList/GoodsList?id=' + _twoid
                });
            } else {
                //分类页跳转
                wx.navigateTo({
                    url: '/pages/List/Category/Category?id=' + _oneid
                });
            }
        } else if (type == 1) {
            //活动页跳转
            wx.navigateTo({
                url: '/pages/List/Activity/Activity?id=' + _actid
            });
        }
    },
    //获取首页数据
    GetHomeData() {
        wx.showLoading({
            title: '加载数据中...',
            mask: true
        });
        //获取数据
        indexControllers.getIndex({
            no: this.data.pageNo
        }).then(res => {
            if (res.done) {
                this.setData({
                    navmeau: res.result.activities,
                    collage: res.result.purchases,
                    recommendgoods: res.result.reGoods,
                    isLoading: false
                });
                wx.hideLoading();
            } else {
                wx.showToast({
                    title: '服务器出错,请重试',
                    icon: 'none'
                });
            }
            //测试用
            wx.stopPullDownRefresh();
        });
    },
    //拨打电话
    calling() {
        app.calling();
    },
    ErrorImage(e) {
        app.errImg(e, this);
    }
})