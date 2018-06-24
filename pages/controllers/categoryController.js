const request = require('../../utils/kzj.request.js');

class CategoryController {
    /**
     * 获取分类数据
     * @return {Promise}
     */
    getcategory(params) {
        return request.get(`/api/getCategoryList.shtml`, params).then(res => res.data)
    }

}
/**
 * 实例化对象
 */
let categoryController = new CategoryController();
/**
 * 暴露对象，无需每次都加函数名
 */
module.exports = {
    controller: categoryController,
}