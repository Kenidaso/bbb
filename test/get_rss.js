const fetch = require('../engines/fetchRss');

fetch.fetch('https://vnexpress.net/rss/tin-moi-nhat.rss', (err, result) => {
	console.log('err=', err);
	console.log('result=', JSON.stringify(result));
});