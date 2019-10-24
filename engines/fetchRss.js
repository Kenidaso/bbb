const parseXml = require('xml2js').parseString;
const moment = require('moment');

const request = require('request').defaults({
	headers: {
		// authority: 'vnexpress.net',
		'cache-control': 'max-age=0',
		'upgrade-insecure-requests': 1,
		dnt: 1,
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36',
		'sec-fetch-mode': 'navigate',
		'sec-fetch-user': '?1',
		accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
		'sec-fetch-site': 'cross-site',
		'accept-language': 'en-US,en;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,la;q=0.5',
	}
});

const MODIFIED_SINCE_FORMAT = 'ddd, DD MMM YYYY HH:mm:ss'

const noop = () => {}

const fetch = (opts = {}, callback = noop) => {
	if (!opts.link) return callback('EMISSINGLINK');

	request({
		url: opts.link,
		method: opts.method || 'GET',
		headers: Object.assign({}, {
			'if-modified-since': `${moment().utcOffset(0).format(MODIFIED_SINCE_FORMAT)} GMT`
		}, opts.headers || {})
	}, (err, response, body) => {
		if (err) return callback(err);
		if (!body) return callback(null, null);

		parseXml(body, (errParse, result) => {
			return callback(errParse, result);
		});
	});
}

module.exports = fetch