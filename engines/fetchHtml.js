const cheerio = require('cheerio');
const rp = require('request-promise');

const fetch = (opts = {}) => {
	return new Promise((resolve, reject) => {
		if (!opts.link) return reject('EMISSINGLINK');
		var options = {
			uri: opts.link,
			gzip: true,
			transform: function (body) {
				return cheerio.load(body);
			},
		};
		rp(options)
			.then(function ($) {
				return resolve($);
			})
			.catch(function (err) {
				console.log('TCL: fetch -> err', err);
				return reject(err);
			});
	});
};

module.exports = fetch;
