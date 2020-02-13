const engine = require('../engines/msn');

let linkRss = 'https://rss.msn.com/vi-vn/entertainment';

engine.getNewsFromRss(linkRss, (err, result) => {
	console.log('err=', err);
	console.log('result=', JSON.stringify(result));
})