const fetchRss = require('../engines/fetchRss');

let linkRss = 'https://vnexpress.net/rss/tin-moi-nhat.rss';
// linkRss = 'https://baodautu.vn/trang-chu.rss';

fetchRss({
	link: linkRss
}, (err, result) => {
	console.log('err=', err);
	console.log('result=', JSON.stringify(result));
});
