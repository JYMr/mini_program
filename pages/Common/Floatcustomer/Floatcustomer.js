// pages/Common/floatcustomer/floatcustomer.js
var app = getApp();
Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        openbool: false,
        isOpenCustomerService: false
    },
    ready(){
        this.setData({
            isOpenCustomerService: app.globalData.isOpenCustomerService
        })
    },
    /**
     * 组件的方法列表
     */
    methods: {
        openfloat: function(e) {
            var openbool = this.data.openbool;
            if (openbool) {
                openbool = false;
            } else {
                openbool = true;
            }
            this.setData({
                openbool: openbool
            })
        },
        closefloat: function() {
            this.setData({
                openbool: false
            })
        },
        calling: function() {
            app.calling()
        }
    }
})