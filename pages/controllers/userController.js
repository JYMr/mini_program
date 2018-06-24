const request = require('../../utils/kzj.request.js');
 
class UserController {
    /**
     * 获取订单数量
     * @return {Promise}
     */
    getUserData(params) {
        return request.get(`/api/getMyOrderCount.shtml`, params).then(res => res.data)
    }

}
/**
 * 实例化对象
 */
let userController = new UserController();
/**
 * 暴露对象，无需每次都加函数名
 */
module.exports = {
    controller: userController,
}