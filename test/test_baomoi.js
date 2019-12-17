
let engine = require('../engines/baomoi');
let categoryUrl = 'https://m.baomoi.com/the-thao.epi';

engine.getFeedFromCategoryUrl(categoryUrl, (err, feeds) => {
	// console.log('done err=', err);
	console.log(JSON.stringify(feeds));
})