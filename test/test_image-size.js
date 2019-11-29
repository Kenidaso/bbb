const request = require('request');
const sizeOf = require('image-size');

request({
	url: 'https://photo-3-baomoi.zadn.vn/w300_r1x2m/2019_11_06_65_32843228/5ffbe73e7d7e9420cd6f.jpg',
	method: 'GET',
	encoding: null,
}, (err, response, body) => {
	console.log('get image done, err=', err);

	console.log('image=', body);

	console.log(sizeOf(body));
})