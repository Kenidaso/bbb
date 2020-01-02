const base = require('../engines/base');

const link = 'https://vhnt.vietbao.com/a230/hoa-si-khang-nguyen'

base.fetch(link, (err, result) => {
	console.log('err=', err);
	console.log('result=', result);
})