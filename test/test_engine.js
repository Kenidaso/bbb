// node test/test_engine [engine] [link]
// node test/test_engine vnexpress https://vnexpress.net/giao-duc/nha-van-hoa-sinh-vien-hinh-luc-giac-hon-400-ty-dong-4001695.html
// node test/test_engine vnexpress http://vnexpress.net/rss/the-thao.rss
// node test/test_engine baomoi https://m.baomoi.com/quan-vot.epi
// node test/test_engine baomoi https://baomoi.com/thu-tuong-nguyen-xuan-phuc-cong-bo-chu-de-cua-nam-asean-2020/c/32827237.epi

process.env.PORT = 1234;

const fs = require('fs');
const path = require('path');

const myArgs = process.argv.slice(2);

const engineName = myArgs[0].toLowerCase();
const link = myArgs[1];

const enginePath = `../engines/${engineName}.js`;

if (!fs.existsSync(path.join(__dirname, enginePath))) {
	console.log('Engine not exists');
};

let engine = require(enginePath);

// engine.getContent({
// 	link
// }, (err, result) => {
// 	console.log('err=', err);
// 	console.log('result=', JSON.stringify(result));
// })

// engine.getNewsFromRss(link, (err, result) => {
// 	console.log('err=', err);
// 	console.log('result=', result);
// })

// const mainSelector = `.timeline.loadmore`;

// engine.getNewsFromHtml(link, mainSelector)
// 	.then(result => console.log('result', result))
// 	.catch(err => console.log('err', err));

engine.getContent({ link })
	.then(result => console.log('result=', JSON.stringify(result)))
	.catch(err => console.log('err=', err));
