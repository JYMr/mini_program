const request = require('../../utils/kzj.request.js');

/**
 * 每一个页面对应一个contoller
 */
class SearchController{
    /**
     * 获取扫码放回
     * @return {Promise}
     */
    ScalCode(params){
        return request.get(`/api/searchBarcode.shtml`, params).then(res => res.data)
    }

    /**
     * 获取搜索列表
     * @return {Promise}
     */
    GetSearchKeyWord(params){
        return request.get(`/api/getHotSearchList.shtml`, params).then(res => res.data)
    }

    /**
     * 获取搜索商品列表
     * @return {Promise}
     */
    GetSearchList(params){
        return request.get(`/api/searchGoodsTitle.shtml`, params).then(res => res.data)
    }
    
    /**
     * 获取分类商品列表
     * @return {Promise}
     */
    GetCategoryList(params){
        return request.get(`/api/getGoodsListByCategoryId.shtml`, params).then(res => res.data)
    }
}
/**
 * 实例化对象
 */
let searchController=  new SearchController();
/**
 * 暴露对象，无需每次都加函数名
 */
module.exports = { 
    controller:searchController,
 }