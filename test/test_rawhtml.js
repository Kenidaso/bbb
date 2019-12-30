
const baseEngine = require('../engines/base');

let link = 'https://vietbao.vn/amp/An-ninh-Phap-luat/Tinh-tiet-bat-ngo-vu-em-ho-dau-doc-chi-bang-6-coc-tra-sua-vi-thuong-tham-anh-re-Vi-loi-de-nghi-cua-anh-re-nen-quyet-tam-ha-doc-chi/2147881118/218/';

baseEngine.userArticleParse(link, (err, article) => {
	// console.log('article=', JSON.stringify(article));
	console.log('article=', article);
});