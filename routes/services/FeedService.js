const keystone = require('keystone');
const async = require('async');

const NODE_ENV = process.env.NODE_ENV || 'development';

const FeedModel = keystone.list('Feed').model;
const CategoryModel = keystone.list('Category').model;

const RedisService = require('./RedisService');

const debug = require('debug')('FeedService');

const utils = require('../../helpers/utils');

let TTL = 60 * 15; // time to live key redis: 900 second = 15 minute
if (NODE_ENV === 'development') TTL = 60 * 60;

Feed = {};
module.exports = Feed;

Feed.getFeeds = (params, callback) => {
	let { category, page } = params;
	let limit = 18;

	let key = `getFeeds:${category}:${page}`;

	debug('key= %s', key);

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
					.sort({
						publishDate: -1,
						updatedAt: -1,
						createdAt: -1
					})
					.limit(limit)
					.skip((page - 1) * limit)
					.exec(next)
			}
		], (err, feeds) => {
			debug('getFeeds err= %s', err);
			if (!err && feeds) RedisService.set(key, feeds, TTL);

			return callback(err, feeds);
		});
	});
}