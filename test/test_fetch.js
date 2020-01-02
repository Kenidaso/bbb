const base = require('../engines/base');

const link = 'https://vietbao.com/a301661/gia-dinh-cuu-bo-truong-nguyen-bac-son-nop-3-trieu-mk-de-chuoc-toi-truoc-ngay-tuyen-an'

base.fetch(link, (err, result) => {
	console.log('err=', err);
	console.log('result=', result);
})