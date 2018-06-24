const request = require('../../utils/kzj.request.js');

class ActivityController {
    /**
     * 获取活动数据
     * @return {Promise}
     */
    getAddressData(params) {
        return request.get(`/api/getActivityByActId.shtml`, params).then(res => res.data)
    }

}
/**
 * 实例化对象
 */
let activityController = new ActivityController();
/**
 * 暴露对象，无需每次都加函数名
 */
module.exports = {
    controller: activityController,
}