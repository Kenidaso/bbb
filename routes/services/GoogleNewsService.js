const engine = require('../../engines/googleNews');
// const GoogleNewsRss = require('google-news-rss');

// const googleNews = new GoogleNewsRss();

// const search = (keyword, callback) => {
// 	googleNews
// 	   .search(keyword)
// 	   .then(resp => callback(null, resp))
// 	   .catch(err => callback(err));
// }

const search = (keyword, callback) => {
	engine.search(keyword, callback);
}

const getEntriesFromRss = (keyword, options, callback) => {
	engine.getEntriesFromRss(keyword, options, callback);
}

module.exports = {
	search,
	getEntriesFromRss,
}