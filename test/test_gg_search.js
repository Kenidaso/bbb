const fs = require('fs');
const ggn = require('../engines/googleNews');
const querystring = require('querystring');
const url = require('url');

ggn.getFeedFromGgSearch('corona', {
	getFeedFromStory: true,
	isGetOriginLink: true,
	maxPage: 1,
}, (err, result) => {
	console.log('done err=', err);
	console.log('done result=', JSON.stringify(result));

	// fs.writeFileSync('../data_sample/ggn_getFeedFromGgSearch.html', result);
})

// let articleLink = 'https://news.google.com/articles/CBMiNWh0dHBzOi8vdnRjLnZuL2JpdGNvaW4tZGFvLWNoaWV1LWJ1dC1waGEtZDUxMjc2Mi5odG1s0gE5aHR0cHM6Ly9hbXAudnRjLnZuL2JpdGNvaW4tZGFvLWNoaWV1LWJ1dC1waGEtZDUxMjc2Mi5odG1s?hl=vi&gl=VN&ceid=VN%3Avi';

// let decode = ggn.decodeLinkGgn(articleLink);

// console.log('decode=', JSON.stringify(decode));


// let link = 'https://www.google.com/search?q=dota2+patch+7.23&lr=lang_vi&biw=1800&bih=888&tbs=lr:lang_1vi&tbm=nws&ei=85TfXcuZNs7r-QaHrJToCA&start=10&sa=N&ved=0ahUKEwiL39m0zYzmAhXOdd4KHQcWBY0Q8NMDCFY';

// let urlParse = url.parse(link);

// let qs = querystring.parse(urlParse.query);

// console.log('qs=', JSON.stringify(qs));