const request = require('../../utils/kzj.request.js');

class ReservationController {

    /**
     * 直接预定
     * @return {Promise}
     */
    CreatelNeed(params) {
        return request.get(`/api/createlNeed.shtml`, params).then(res => res.data)
    }

    /**
     * 预定清单预定
     * @return {Promise}
     */
    CreatelNeedByCart(params) {
        return request.get(`/api/createlNeedByCart.shtml`, params).then(res => res.data)
    }

    /**
     * 需求列表
     * @return {Promise}
     */
    GetNeedOrderList(params) {
        return request.get(`/api/getNeedOrderList.shtml`, params).then(res => res.data)
    }

    /**
     * 取消预定
     * @return {Promise}
     */
    CancelNeed(params) {
        return request.get(`/api/cancelNeed.shtml`, params).then(res => res.data)
    }

    /**
     * 删除预定
     * @return {Promise}
     */
    DeleteNeed(params) {
        return request.get(`/api/deleteNeed.shtml`, params).then(res => res.data)
    }

    /**
     * 获取上一次预定人信息
     * @return {Promise}
     */
    GetLastNeedPersonInfo(params) {
        return request.get(`/api/getLastNeedPersonInfo.shtml`, params).then(res => res.data)
    }


    /**
     * 重新预定
     * @return {Promise}
     */
    NeedBuyAgain(params) {
        return request.get(`/api/needBuyAgain.shtml`, params).then(res => res.data)
    }
}
/**
 * 实例化对象
 */
let reservationController = new ReservationController();
/**
 * 暴露对象，无需每次都加函数名
 */
module.exports = {
    controller: reservationController,
}