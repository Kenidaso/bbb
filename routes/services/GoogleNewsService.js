const _ = require('lodash');
const moment = require('moment');

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

		if (NODE_ENV === 'production' && result) {
			console.log('get from cache key=', key);
			return callback(null, result);
		}

		engine.search(keyword, (err, news) => {
			if (err) return callback(err, news);

			let results = [];
			_.forEach(news, (item) => {
				let { articles, srcImg } = item;
				articles = articles.map((article) => {
					if (!article.srcImg && srcImg) {
						article.srcImg = utils.scaleImageGg(srcImg);
					}
					return article
				})

				results = [...results, ...articles];
			})

			// results = _.sortBy(results, [function (o) { return moment(o.publishDate).toDate().getTime(); }]);
			results = _.orderBy(results, [function (o) { return moment(o.publishDate).toDate().getTime(); }], ['desc']);

			if (!err && results) RedisService.set(key, results, TTL);
			return callback(err, results);
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

const searchFromGgSearch = (keyword, options={}, callback) => {
	options = options || {};

	let encode = encodeURIComponent(keyword);
	let key = `getGoogleNews:ggsearch:${encode}:${JSON.stringify(options)}`;

	RedisService.get(key, (err, result) => {
		result = utils.safeParse(result);

		if (NODE_ENV === 'production' && result) {
		// if (result) {
			console.log('get from cache key=', key);
			return callback(null, result);
		}

		engine.getFeedFromGgSearch(keyword, options, (err, news) => {
			if (err) return callback(err, news);

			let results = news.articles;

			let minDate = options.minDate;
			let maxDate = options.maxDate;

			if (minDate || maxDate) {
				minDate = minDate ? moment(minDate, 'YYYYMMDD') : moment().add(-1, 'Y');
				minDate = moment(minDate).startOf('day');

				maxDate = maxDate ? moment(maxDate, 'YYYYMMDD') : moment().add(1, 'Y');
				maxDate = moment(maxDate).endOf('day');

				results = results.filter((r) => {
					let publishDate = moment(r.publishDate);
					return publishDate.isAfter(minDate) && publishDate.isBefore(maxDate);
				})
			}

			results = results.map((article) => {
				let { title, link, image, paperImg, paperName, publishDate, originLink } = article;
				let obj = {
					title,
					linkArticle: link,
					srcImg: utils.scaleImageGg(image, 2),
					paper: paperName,
					publishDate,
					originLink
				}

				return obj
			})

			if (!err && results) RedisService.set(key, results, TTL);
			return callback(err, results);
		});
	});
}

module.exports = {
	search,
	getEntriesFromRss,
	searchFromGgSearch
}