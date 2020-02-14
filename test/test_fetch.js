const base = require('../engines/base');
const nld = require('../engines/nguoilaodong');

let link = 'https://amp.rfi.fr/vi/ch/u00e2u-/u00e1/20191223-h/u1ea1n-ch/u00f3t-/u0111/u1ec3-b/u1eafc-tri/u1ec1u-ti/u00ean-h/u1ed3i-h/u01b0/u01a1ng-to/u00e0n-b/u1ed9-ng/u01b0/u1eddi-lao-/u0111/u1ed9ng'

// link = 'http://www.rfi.fr/vi/ch%C3%A2u-%C3%A1/20191223-h%E1%BA%A1n-ch%C3%B3t-%C4%91%E1%BB%83-b%E1%BA%AFc-tri%E1%BB%81u-ti%C3%AAn-h%E1%BB%93i-h%C6%B0%C6%A1ng-to%C3%A0n-b%E1%BB%99-ng%C6%B0%E1%BB%9Di-lao-%C4%91%E1%BB%99ng';
link = 'https://www.nhandan.com.vn/phapluat/thoi-su/item/43129602-dong-pham-cua-le-quoc-tuan-ra-dau-thu.html';
link = 'https://nld.com.vn/news-20200208065855586.htm';

// base.fetch(link, (err, result) => {
// 	console.log('link=', link);
// 	console.log('err=', err);
// 	console.log('result=', result);
// })

nld.fetch(link, (err, result) => {
	console.log('link=', link);
	console.log('err=', err);
	console.log('result=', result);
})