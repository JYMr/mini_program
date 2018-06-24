// pages/Common/MenuCustomer/MenuCustomer.js
const app = getApp();
Component({
    data: {
        isShow: false,
        mobile: '',
        flag: true
    },
    methods: {
        ToggleChaticonMenu() {
            this.setData({
                isShow: !this.data.isShow
            })
        },
        ShowMenu(flag) {
            if (flag === undefined) {
                flag = true
            }
            this.setData({
                mobile: app.globalData.mobile,
                isOpenCustomerService: app.globalData.isOpenCustomerService,
                isShow: true,
                flag: flag
            })
        },
        Calling() {
            app.calling();
        }
    }
})