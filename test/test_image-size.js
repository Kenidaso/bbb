const request = require('request');
const sizeOf = require('image-size');
const fs = require('fs');

request({
	// url: 'http://hanoimoi.com.vn/Uploads/trieuhoa/2018/4/24/a.jpg',
	url: 'https://scontent.fsgn2-4.fna.fbcdn.net/v/t1.15752-9/p1080x2048/86490882_219187029249135_4850209093090017280_n.jpg?_nc_cat=109&_nc_ohc=CinSIZrpJjsAX_kBa8b&_nc_ht=scontent.fsgn2-4.fna&_nc_tp=6&oh=e4b4272555bb17b9a74c1b7d845587a1&oe=5EC0DCE1',
	method: 'GET',
	encoding: null,
}, (err, response, body) => {
	console.log('get image done, err=', err);

	console.log('image=', body);
	fs.writeFileSync('image.jpg', body);

	console.log(sizeOf(body));
})