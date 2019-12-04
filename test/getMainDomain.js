let utils = require('../helpers/utils');

let link = 'https://www.blog.abc.24h.com.vn/tin-tuc-trong-ngay/se-cuong-che-neu-gia-dinh-ca-si-my-linh-khong-tu-xu-ly-phan-xay-trai-phep-c46a1105513.html';

let host = utils.getMainDomain(link);

console.log("-->", host);