// pages/Common/ReservationInput/ReservationInput.js
const reservationController = require('../../controllers/reservationController').controller;
Component({
    /**
     * 组件的初始数据
     */
    data: {
        UserInfo: {
            name: '',
            mobile: ''
        },
        lastInfoLoading: true,//最后一次预定信息加载状态
        isShow: false
    },
    ready() {
        this.Dialog = this.selectComponent("#Dialog");
    },
    /**
     * 组件的方法列表
     */
    methods: {
        //验证表单
        //status: true 开启错误提示功能
        ValiData(status) {
            let flag = true;
            let msg = '';
            //验证数据格式
            if (this.data.UserInfo.name == '' || this.data.UserInfo.name == undefined) {
                msg = '联系人不能为空';
                flag = false;
            }
            if (this.data.UserInfo.mobile == '' || this.data.UserInfo.mobile == undefined) {
                if (msg == '') msg = '联系号码不能为空';
                flag = flag && false;
            }
            if (!/^1([358][0-9]|4[579]|66|7[0135678]|9[89])[0-9]{8}$/.test(this.data.UserInfo.mobile)) {
                if (msg == '') msg = '联系号码格式错误';
                flag = flag && false;
            }
            //错误提示
            if (status && msg) {
                this.Dialog.ShowDialog({
                    type: "Message",
                    title: msg,
                    messageType: 'fail'
                })
            }
            this.setData({
                ValiStatus: flag
            });
            return flag;
        },
        Show(option) {
            //接受参数
            var _Detail = option ? Object.assign(this.data.UserInfo, option) : {};

            this.setData({
                Detail: _Detail,
                isShow: true
            });

            this.GetUserInfo();
            this.ValiData();
        },
        //关闭弹窗
        CloseEdit() {
            this.setData({
                UserInfo: {//清空数据
                    name: '',
                    mobile: ''
                },
                isShow: false
            });
        },
        //保存编辑地址
        save() {
            if (this.ValiData(1)) {
                //操作完成，发送EditEvent事件
                this.triggerEvent("SaveEvent", this.data.UserInfo);
            }
        },
        //表单事件绑定
        BindNameChange(e) {
            let _tempData = this.data.UserInfo;
            _tempData.name = e.detail.value;
            this.setData({
                UserInfo: _tempData
            });
            this.ValiData();
        },
        BindMobileChange(e) {
            let _tempData = this.data.UserInfo;
            _tempData.mobile = e.detail.value;
            this.setData({
                UserInfo: _tempData
            });
            this.ValiData();
        },
        //获取预定信息
        GetUserInfo() {
            reservationController.GetLastNeedPersonInfo().then(res => {
                if (res.done) {
                    let _UserInfo = this.data.UserInfo;
                    _UserInfo.name = res.result.needPerson;
                    _UserInfo.mobile = res.result.needPhone;
                    this.setData({
                        UserInfo: _UserInfo
                    });
                    this.ValiData();
                }
                this.setData({
                    lastInfoLoading: false
                });
            });
        }
    }
})