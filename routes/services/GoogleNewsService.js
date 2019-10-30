const NODE_ENV = process.env.NODE_ENV || 'development';

const engine = require('../../engines/googleNews');

const RedisService = require('./RedisService');

const utils = require('../../helpers/utils');

let TTL = 60 * 15; // time to live key redis: 900 second = 15 minute
if (NODE_ENV === 'development') TTL = 60 * 60;

const search = (keyword, callback) => {
	let encode = encodeURIComponent(keyword);
	let key = `getGoogleNews:html:${encode}`;

	RedisService.get(key, (err, result) => {
		result = utils.safeParse(result);

		if (result) {
			console.log('get from cache key=', key);
			return callback(null, result);
		}

		engine.search(keyword, (err, news) => {
			if (!err && news) RedisService.set(key, news, TTL);
			return callback(err, news);
		});
	});
}

const getEntriesFromRss = (keyword, callback) => {
	let encode = encodeURIComponent(keyword);
	let key = `getGoogleNews:RSS:${encode}`;

	RedisService.get(key, (err, result) => {
		result = utils.safeParse(result);

		if (result) {
			console.log('get from cache key=', key);
			return callback(null, result);
		}

		// RedisService.set(key, fakeData, TTL);
		// return callback(null, fakeData);

		let options = {};

		engine.getEntriesFromRss(keyword, options, (err, news) => {
			if (!err && news) RedisService.set(key, news, TTL);
			return callback(err, news);
		});
	});
}

module.exports = {
	search,
	getEntriesFromRss,
}