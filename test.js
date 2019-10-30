// node test [task]
// node test ggnews
// node test ggnews_rss

process.env.PORT = 1234;

const fs = require('fs');

const myArgs = process.argv.slice(2);
const task = myArgs[0].toLowerCase();

let ggNewsService = require('./routes/services/GoogleNewsService')

let _done = (err, result) => {
	console.log('done err=', err);
	console.log('done result=', JSON.stringify(result));

	setTimeout(process.exit, 1000, 0);
}

let ggNews = (callback) => {
	ggNewsService.search('Heerenveen Văn Hậu', (err, result) => {
		// fs.writeFileSync('raw_google_news.html', result);
		return callback(err, result);
	});
}

let ggNews_RSS = (callback) => {
	ggNewsService.getEntriesFromRss('Heerenveen Văn Hậu', (err, result) => {
		// fs.writeFileSync('raw_google_news.html', result);
		return callback(err, result);
	});
}

console.clear();

console.log('begin ...');
switch (task) {
	case 'ggnews': return ggNews(_done);
	case 'ggnews_rss': return ggNews_RSS(_done);
	default:
		console.log('Task not exists');
		return _done();
}
