// node test/test_engine [engine] [link]
// node test/test_engine vnexpress https://vnexpress.net/thoi-su/30-nam-tran-giu-them-luc-dia-cua-linh-nha-gian-dk1-3983248.html
// node test/test_engine vnexpress http://vnexpress.net/rss/the-thao.rss

process.env.PORT = 1234;

const fs = require('fs');
const path = require('path');

const myArgs = process.argv.slice(2);

const engineName = myArgs[0].toLowerCase();
const link = myArgs[1];

const enginePath = `../engines/${engineName}.js`;

if (!fs.existsSync(path.join(__dirname, enginePath))) return console.log('Engine not exists');

let engine = require(enginePath);

engine.getContent({
	link
}, (err, result) => {
	console.log('err=', err);
	console.log('result=', result);
})

// engine.getNewsFromRss(link, (err, result) => {
// 	console.log('err=', err);
// 	console.log('result=', result);
// })
