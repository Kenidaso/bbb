let utils = require('../helpers/utils');

let link = 'https://www.blog.abc.24h.com.vn/tin-tuc-trong-ngay/se-cuong-che-neu-gia-dinh-ca-si-my-linh-khong-tu-xu-ly-phan-xay-trai-phep-c46a1105513.html';

link = 'https://m.enternews.vn/vingroup-xin-uu-dai-thue-phi-cho-linh-vuc-san-xuat-o-to-dien-163844.html/ufffd';

let host = utils.getMainDomain(link);

console.log("-->", host);