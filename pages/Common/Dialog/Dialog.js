Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    data: {
        isShow: false,
        option: {
            title: '消息框',
            type: '',
            btnArray: [{
                    title: '取消',
                    name: 'cancel',
                    class: ''
                },
                {
                    title: '确定',
                    name: 'confirm',
                    class: 'confirm'
                }
            ],
            messageType: 'success',
            time: 1500,
            callback: null,
            customize: null
        }
    },
    methods: {
        //展示弹框
        ShowDialog(option) {
            //默认参数
            let defaultOption = {
                title: '消息框',
                type: '',
                btnArray: [{
                        title: '取消',
                        name: 'cancel',
                        class: ''
                    },
                    {
                        title: '确定',
                        name: 'confirm',
                        class: 'confirm'
                    }
                ],
                messageType: 'success',
                time: 1500,
                callback: null,
                customize: null
            }
            //合并参数
            let _option = Object.assign(defaultOption, option);
            this.setData({
                option: _option,
                isShow: true
            })
            //定时关闭
            setTimeout(() => {
                this.DialogTimeOut()
            }, 0);
        },
        CloseDialog() {
            if (this.data.isShow) {
                //关闭弹窗触发toastClose事件
                this.triggerEvent("toastClose");
            }
            this.setData({
                isShow: false
            })
        },
        DialogTimeOut() {
            //定时消失
            if (this.data.isShow && (this.data.option.type === "Message" || this.data.option.type === "Slot") && this.data.option.time > 0) {
                setTimeout(() => {
                    this.setData({
                        isShow: false
                    });
                    //触发toastClose事件
                    this.triggerEvent("toastClose");
                }, this.properties.option.time)
            }
        },
        _tapEvent(event) {
            //调用回调
            if (this.data.option.callback && typeof this.data.option.callback == 'function') {
                this.data.option.callback({
                    index: event.target.dataset.index,
                    name: event.target.dataset.name,
                    customize: this.data.customize
                });
            }
            this.triggerEvent("toastEvent", {
                index: event.target.dataset.index,
                name: event.target.dataset.name,
                customize: this.data.customize
            });
        }
    }
})