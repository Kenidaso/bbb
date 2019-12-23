const async = require('async');

let link = 'https://m.baomoi.com/thoi-su.epi';


async.timesLimit(5, 1, function (n, next) {
	let page = n + 1;
	let linkPage = link.replace('.epi', `/trang${page}.epi`);
  console.log('linkPage', linkPage);

  setTimeout(next, 1e3 * n, null, linkPage);
}, function(err, results) {
	console.log('done err=', err);
	console.log('done results=', JSON.stringify(results));
});