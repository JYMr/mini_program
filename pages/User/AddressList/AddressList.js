// pages/address/addressList/addressList.js
const app = getApp()
const addressController = require('../../controllers/addressController').controller

Page({

    /**
     * 页面的初始数据
     */
    data: {
        AddressList: [],
        isLoading: false,
        ChooseMode: false,
        RequestError:false,
        isLoading:false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        if (options.ChooseMode) {
            this.setData({
                ChooseMode: options.ChooseMode
            });

            wx.setNavigationBarTitle({
                title: '选择地址'
            });
        }

        this.getAddressData();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.AddressEdit = this.selectComponent('#AddressEdit');
        this.Dialog = this.selectComponent('#Dialog');
    },
    onRefresh: function () {
      this.getAddressData();
    },
    //获取地址数据列表
    getAddressData() {
        wx.showLoading();
        this.setData({
            isLoading: true
        });
        addressController.getAddressData().then(res => {
            if (res.done) {
                this.setData({
                    AddressList: res.result.list,
                    isLoading: false,
                    RequestError:false
                });
            } else {
                wx.showToast({
                    title: res.msg || '服务器出错,请重试',
                    icon: 'none'
                });
                this.setData({
                    RequestError:true
                })
            }
            wx.hideLoading();
        }).catch(err=>{
            this.setData({
                RequestError:true
            })
        })
    },
    //新增地址
    AddFn() {
        //显示地址编辑窗
        this.AddressEdit.ShowEdit();
    },
    //编辑地址
    EditFn(event) {
        let id = event.currentTarget.dataset.id;
        //根据Id搜索地址对象
        let option = this.SearchObject(id);
        this.AddressEdit.ShowEdit(option);
    },
    //删除地址
    DelFu(e) {
        let _id = e.currentTarget.dataset.id;
        //确认弹窗
        this.Dialog.ShowDialog({
            type: 'Confirm',
            title: '是否删除该地址',
            callback: res => {
                if (res.name == 'confirm') {
                    //调用删除地址接口
                    wx.showLoading({
                        mask: true
                    });

                    addressController.delAddress({
                        addr_id: _id
                    }).then(res => {
                        this.Dialog.CloseDialog();
                        if (res.done) {
                            this.Dialog.ShowDialog({
                                type: 'Message',
                                title: '删除成功!'
                            });
                            //等待Dialog动画
                            setTimeout(() => {
                                this.getAddressData();
                            }, 1500);
                        } else {
                            this.Dialog.ShowDialog({
                                type: 'Message',
                                title: '删除失败!',
                                messageType: 'fail'
                            });
                        }
                        wx.hideLoading();
                    });
                } else {
                    this.Dialog.CloseDialog();
                }
            }
        })
    },
    //选择默认地址
    ChooseDefault(event) {
        let id = event.currentTarget.dataset.id;
        //设置默认值
        wx.showLoading({
            mask: true
        });
        addressController.setAddressDefault({
            addr_id: id,
            status: 　1
        }).then(res => {
            if (res.done) {

                let _Detail = this.data.AddressList;
                //更改数据默认状态
                for (let item of _Detail) {
                    item.isDefault = id == item.id
                }
                this.setData({
                    AddressList: _Detail
                });
                this.getAddressData();
            } else {
                this.Dialog.ShowDialog({
                    type: 'Message',
                    title: res.msg || '设置失败!',
                    messageType: 'fail'
                });
            }
            wx.hideLoading();
        });
    },
    //点击选择地址
    ChooseAddress(e) {
        if (this.data.ChooseMode) {
            //选择地址,id存进公共globalData, 到订单页取用
            app.globalData.AddressId = e.currentTarget.dataset.id;
            wx.navigateBack();
        }
    },
    //响应编辑窗口事件
    HandleEditEvent(e) {
        this.AddressEdit.CloseEdit();

        this.Dialog.ShowDialog({
            type: 'Message',
            title: '保存成功'
        });
        setTimeout(() => {
            //重新加载列表数据
            this.getAddressData();
        }, 1500);
    },
    //遍历查找地址对象
    SearchObject(id) {
        for (let item of this.data.AddressList) {
            if (id == item.addr_id) {
                return item;
            }
        }
        return {};
    }
})