const keystone = require('keystone');
const async = require('async');

const FeedModel = keystone.list('Feed').model;
const CategoryModel = keystone.list('Category').model;

const RedisService = require('../services/RedisService');

const utils = require('../../helpers/utils');

const TTL = 60 * 15; // time to live key redis: 900 second = 15 minute

Feed = {};
module.exports = Feed;

Feed.getFeeds = (params, callback) => {
	let { category, page } = params;
	let limit = 18;

	let key = `getFeeds:${category}:${page}`;

	RedisService.get(key, (err, result) => {
		result = utils.safeParse(result);

		if (result) {
			console.log('get from cache key=', key);
			return callback(null, result);
		}

		async.waterfall([
			// find category
			(next) => {
				CategoryModel.findOne({
					title: category
				}, (err, doc) => {
					if (err) return next('EFINDCATEGORY', err);

					if (!doc) return next('ECATEGORYNOTFOUND');

					return next(null, doc);
				});
			},
			(category, next) => {
				FeedModel
					.find({
						category: category._id,
					})
					.select('-_id slug title link publishDate description heroImage images videos contentOrder')
					.setOptions({
						createdAt: -1
					})
					.limit(limit)
					.skip(page * limit)
					.exec(next)
			}
		], (err, feeds) => {
			if (!err && feeds) RedisService.set(key, feeds, TTL);

			return callback(err, feeds);
		});
	});
}