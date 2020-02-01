const base = require('../engines/base');
const fetchRss = require('../engines/fetchRss');

let linkRss = 'https://vnexpress.net/rss/tin-moi-nhat.rss';
// linkRss = 'https://baodautu.vn/trang-chu.rss';
linkRss = 'https://vietnamnet.vn/rss/giai-tri.rss';
linkRss = 'https://tuoitre.vn/rss/tin-moi-nhat.rss';
linkRss = 'http://cafef.vn/tai-chinh-quoc-te.rss';
linkRss = 'https://vietstock.vn/144/chung-khoan.rss';
linkRss = 'https://thanhnien.vn/rss/doi-song/quyen-duoc-biet.rss';

// fetchRss({
// 	link: linkRss
// }, (err, result) => {
// 	console.log('err=', err);
// 	console.log('result=', JSON.stringify(result));
// });

base.getNewsFromRss(linkRss, (err, result) => {
	console.log('err=', err);
	console.log('result=', JSON.stringify(result));
})