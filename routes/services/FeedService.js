const keystone = require('keystone');
const async = require('async');
const _ = require('lodash');

const NODE_ENV = process.env.NODE_ENV || 'development';

const FeedModel = keystone.list('Feed').model;
const CategoryModel = keystone.list('Category').model;

const RedisService = require('./RedisService');
const RawFeedService = require('./RawFeedService');

const debug = require('debug')('FeedService');

const utils = require('../../helpers/utils');

let TTL = 60 * 2; // time to live key redis: 900 second = 15 minute
if (NODE_ENV === 'development') TTL = 60 * 60;

let TTL_LINK_FEED = 60 * 60 * 24 * 3; // 3 day

const noop = () => {}

Feed = {};
module.exports = Feed;

Feed.getFeeds = (params, callback) => {
	let { category, page, limit } = params;

	let key = `getFeeds:${category}:${page}:${limit}`;

	debug('getFeeds key= %s', key);

	RedisService.get(key, (err, result) => {
		result = utils.safeParse(result);

		if (result && NODE_ENV === 'production') {
			debug('get from cache key=', key);
			return callback(null, result);
		}

		async.waterfall([
			// find category
			(next) => {
				CategoryModel.findOne({
					// title: category
					$or: [
						{ title: category },
						{ slug: category },
					]
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
					.select('-_id slug title link publishDate description heroImage rawHtml category topic host')
					.populate('category', '-_id slug title display')
					.populate('topic', '-_id name description')
					.populate('host', '-_id name website')
					.sort({
						publishDate: -1,
						// updatedAt: -1,
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

Feed.getContent = (slugFeed, opts, callback) => {
	opts = opts || {};

	// get link feed from slug-feed
	let keyLinkFeed = `linkFeed:${slugFeed}`;
	RedisService.get(keyLinkFeed, (err, link) => {
		if (!err && link) {
			debug('get link feed from cache key= %s', keyLinkFeed);
			return RawFeedService.getHtmlContent(link, opts, callback);
		}

		FeedModel.findOne({
			slug: slugFeed
		}, 'link rawHtml contentOrder heroImage slug', (errFind, feed) => {
			if (errFind) return callback('EFINDFEED', errFind);
			if (!feed) return callback('EFEEDNOTFOUND');

			RedisService.set(keyLinkFeed, feed.link, TTL_LINK_FEED);

			// if (feed.rawHtml && feed.rawHtml.length > 0) return callback(null, feed.rawHtml);

			return RawFeedService.getHtmlContent(feed.link, opts, callback);
		})
	});
}

Feed.getCategories = (callback) => {
	CategoryModel.find({}, '-_id slug display title', (err, categories) => {
		if (err) return callback(err);
		let result = _.keyBy(categories, 'slug');
		return callback(null, result);
	})
}

Feed.upsertFeed = (find, update, callback) => {
	FeedModel.findOne(find, (err, result) => {
		if (err) {
			debug('upsertSafe err=', err);
			return callback(err);
		}

		if (result) {
			update['$inc'] = update['$inc'] || {};
			update['$inc']['__v'] = 1;

			let opts = {
				new: true
			}

			return FeedModel.findOneAndUpdate({
				_id: result._id
			}, update, opts, callback);
		}

		let _update = update['$set'];
		if (update['$addToSet']) {
			let set = update['$addToSet'];
			/*
			"category": {
			    "$each": [
			        "5db1e80887a90f0caed1c699"
			    ]
			}
			*/
			for (let field in set) {
				if (typeof set[field] === 'object') {
					if (set[field]['$each']) _update[field] = set[field]['$each'];
				} else {
					_update[field] = set[field];
				}
			}
		}

		let newObj = new FeedModel(_update);

		return newObj.save((err) => {
			if (err) return callback(err);
			return callback(err, newObj);
		});
	});
}

Feed.incView = (slug, callback) => {
	callback();

	FeedModel.findOne({ slug }, (err, result) => {
		if (err) {
			debug('inc view search err=', err);
			return noop();
		}

		if (!result) return noop();
		result.incView(noop);
	});
}
