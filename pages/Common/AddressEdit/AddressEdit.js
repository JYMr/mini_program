// pages/address/addressEdit/addressEdit.js
const addressController = require('../../controllers/addressController').controller
Component({
    data: {
        isShow: false,
        ValiStatus: false,
        isPicker: false,
        Detail: {
            addr_recipient: '',
            addr_mobile: '',
            addr_province: '',
            addr_city: '',
            addr_area: '',
            addr_address: '',
            addr_id: ''
        },
        region: ['广东省', '广州市', '白云区']
    },
    ready() {
        this.Dialog = this.selectComponent("#Dialog");
    },
    methods: {
        //验证表单
        //status: true 开启错误提示功能
        ValiData(status) {
            let flag = true;
            let msg = '';
            if (this.data.Detail.addr_recipient == '' || this.data.Detail.addr_recipient == undefined) {
                msg = '收货人不能为空';
                flag = false;
            }
            if (this.data.Detail.addr_mobile == '' || this.data.Detail.addr_mobile == undefined) {
                if (msg == '') msg = '联系号码不能为空';
                flag = flag && false;
            }
            if (!/^1([358][0-9]|4[579]|66|7[0135678]|9[89])[0-9]{8}$/.test(this.data.Detail.addr_mobile)) {
                if (msg == '') msg = '联系号码格式错误';
                flag = flag && false;
            }
            if (this.data.Detail.addr_address == '' || this.data.Detail.addr_address == undefined) {
                if (msg == '') msg = '详细地址不能为空';
                flag = flag && false;
            }
            if (status && msg) {
                this.Dialog.ShowDialog({
                    type: "Message",
                    title: msg,
                    messageType: 'fail'
                });
            }
            this.setData({
                ValiStatus: flag
            })
            return flag;
        },
        ShowEdit(option) {
            //接受参数
            var _Detail = option ? Object.assign(this.data.Detail, option) : {};

            this.setData({
                isShow: true
            })

            setTimeout(() => {
                //延时300ms，等待过度动画，避免textarea动画中文字偏移

                this.setData({
                    Detail: _Detail,
                    region: [
                        _Detail.addr_province || this.data.region[0],
                        _Detail.addr_city || this.data.region[1],
                        _Detail.addr_area || this.data.region[2]
                    ]
                });

                this.ValiData();
            }, 300)
        },
        //关闭弹窗
        CloseEdit() {
            this.setData({
                isShow: false,
                Detail: {},
                region: ['广东省', '广州市', '白云区'],
                ValiStatus: false
            })
        },
        //保存编辑地址
        saveEdit() {
            if (this.ValiData(1)) {

                //拼装数据
                let data = {
                    addr_recipient: this.data.Detail.addr_recipient,
                    addr_mobile: this.data.Detail.addr_mobile,
                    addr_province: this.data.Detail.addr_province || this.data.region[0],
                    addr_city: this.data.Detail.addr_city || this.data.region[1],
                    addr_area: this.data.Detail.addr_area || this.data.region[2],
                    addr_address: this.data.Detail.addr_address
                }
                wx.showLoading({
                    mask: true
                });
                if (this.data.Detail.addr_id) {
                    //编辑模式
                    //组合id
                    let temp_data = Object.assign({addr_id: this.data.Detail.addr_id}, data);
                    addressController.editAddress(temp_data).then(res => {
                        if (res.done) {
                            //操作完成，发送EditEvent事件
                            this.triggerEvent("EditEvent");
                        }else{
                            this.Dialog.ShowDialog({
                                type: "Message",
                                title: res.msg,
                                messageType: 'fail'
                            })
                        }
                        wx.hideLoading();
                    });
                } else {
                    //id为空，新增地址
                    addressController.addAddress(data).then(res => {
                        if (res.done) {
                            //操作完成，发送EditEvent事件
                            this.triggerEvent("EditEvent", {
                                addr_id: res.result.addr_id
                            });
                        }else{
                            this.Dialog.ShowDialog({
                                type: "Message",
                                title: res.msg,
                                messageType: 'fail'
                            })
                        }
                        wx.hideLoading();
                    });
                }
            }
        },
        //表单事件绑定
        BindNameChange(e) {
            let _tempData = this.data.Detail;
            _tempData.addr_recipient = e.detail.value;
            this.setData({
                Detail: _tempData
            })
            this.ValiData();
        },
        BindMobileChange(e) {
            let _tempData = this.data.Detail;
            _tempData.addr_mobile = e.detail.value;
            this.setData({
                Detail: _tempData
            })
            this.ValiData();
        },
        BindAddressChange(e) {
            let _tempData = this.data.Detail;
            _tempData.addr_address = e.detail.value;
            this.setData({
                Detail: _tempData
            })
            this.ValiData();
        },
        //Picker改变事件
        bindRegionChange(e) {
            let _ChooseArray = e.detail.value;
            let _Detail = this.data.Detail;
            _Detail.addr_province = _ChooseArray[0];
            _Detail.addr_city = _ChooseArray[1];
            _Detail.addr_area = _ChooseArray[2];
            this.setData({
                region: e.detail.value,
                Detail: _Detail
            })
        }
    }
})