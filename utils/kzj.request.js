//const BASE_URL = "http://192.168.40.93:8080";
// const BASE_URL = "http://1x7448h712.iok.la";
const BASE_URL = "https://mini.kzj365.com.cn";

class Request {
    /**
     * Request请求方法
     * @param  {String} url    链接
     * @param  {Objece} params 参数
     * @param  {Boolean} isToken  是否携带token
     * @return {Promise}       包含抓取任务的Promise
     */
    getApi(url, params, isToken) {

        if(isToken === undefined) isToken = true;

        let token = wx.getStorageSync('token') || '';

        const promise = new Promise((resolve, reject) => {

            //判断是否需要置入token
            if(isToken) params = Object.assign({}, { 'token': token }, params)

            wx.request({
                url: `${BASE_URL}${url}`,
                method: 'POST',
                data: params, //置入token
                header: { 'Content-Type': 'application/x-www-form-urlencoded' },
                success: res=>{
                    if(res.statusCode == 200){
                        resolve(res);
                    }else{
                        wx.showToast({
                            title: '[' + res.statusCode + '] 服务器出错,请重试',
                            icon: 'none'
                        });
                    }
                },
                fail: err => {
                    wx.showToast({
                        title: '网络错误',
                        icon: 'none'
                    });
                    reject();
                }
            });
        });

        if (token == '' && isToken) {
           return new Promise((resolve, reject) => {
                wx.showToast({
                    title: '状态失效，请关闭小程序后，重新打开',
                    icon: 'none'
                });
            });
        } else {
            return promise;
        }
    }

}

let request = new Request();

module.exports = {
    get: request.getApi
}