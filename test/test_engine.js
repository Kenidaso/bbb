// node test_engine [engine] [link]
// node test_engine vnexpress https://vnexpress.net/thoi-su/30-nam-tran-giu-them-luc-dia-cua-linh-nha-gian-dk1-3983248.html

process.env.PORT = 1234;

const fs = require('fs');

const myArgs = process.argv.slice(2);

const engineName = myArgs[0].toLowerCase();
const link = myArgs[1];

const engineAddress = `../engines/${engineName}.js`;

if (!fs.existsSync(engineAddress)) return console.log('Engine not exists');

let engine = require(engineAddress);

engine.getContent(link, (err, result) => {
	console.log('err=', err);
	console.log('result=', result);
})
