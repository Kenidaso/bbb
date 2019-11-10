const NODE_ENV = process.env.NODE_ENV || 'development';

const keystone = require('keystone');
const request = require('request');
const url = require('url');
const async = require('async');
const fs = require('fs');
const path = require('path');

const baseEngine = require('../../engines/base');

const RedisService = require('./RedisService');

const Host = keystone.list('Host');
const Feed = keystone.list('Feed');

const debug = require('debug')('RawFeedService');

const utils = require('../../helpers/utils');

const TTL_RAW_HTML = 60 * 60 * 24 * 7; // cache 1 week

const tldsInVn = [ // top level domain
	'org.vn',
	'net.vn',
	'biz.vn',
	'edu.vn',
	'gov.vn',
	'int.vn',
	'ac.vn',
	'pro.vn',
	'info.vn',
	'health.vn',
	'name.vn',
	'com.vn',
	'com',
	'vn'
]

RawFeed = {};
module.exports = RawFeed;

RawFeed.getHtmlContent = (link, callback) => {
	const feedUrl = url.parse(link);
	let { host } = feedUrl;

	if (!host) return callback('ELINKINVALID', 1005);

	// clear subdomain
	if (host.split('.').length > 2) {
		let split = host.split('.');
		split.shift();
		let _tmpHost = split.join('.');
		let findTld = tldsInVn.find((t) => {
			return t == _tmpHost;
		})

		if (!findTld) host = _tmpHost;
	}

	debug('--> host= %o', host);

	let keyContent = `rawHtml:${link}`;
	let keyHost = `host:${host}`;

	let rawHtml = null;

	async.waterfall([
		// get rawHtml from cache
		(next) => {
			if (NODE_ENV !== 'production') return next();

			RedisService.get(keyContent, (err, value) => {
				if (!err && value) {
					debug('get content from cache key= %s', keyContent);

					rawHtml = value;
					return next('GET_FROM_CACHE', value);
				}

				return next(null);
			})
		},

		// get rawHtml from database
		(next) => {
			if (NODE_ENV !== 'production') return next();

			Feed.model.findOne({
				link
			}, (err, doc) => {
				if (err) return next();

				if (doc && doc.rawHtml && doc.rawHtml.length > 0) {
					RedisService.set(keyContent, doc.rawHtml);

					rawHtml = doc.rawHtml;
					debug('get content from db key= %s', keyContent);
					return next('GET_FROM_DB', doc.rawHtml);
				}

				return next();
			});
		},

		// get hostInfo from cache
		(next) => {
			if (NODE_ENV !== 'production') return next(null, null);

			RedisService.get(keyHost, (err, hostInfo) => {
				if (err || !hostInfo) return next(null, null);

				hostInfo = utils.safeParse(hostInfo);

				if (!hostInfo) return next(null, null);

				debug('get host from cache key= %s', keyHost);
				return next(null, hostInfo);
			})
		},

		// get hostInfo from db
		(hostInfo, next) => {
			if (hostInfo) return next(null, hostInfo);

			Host.model.findOne({
				website: new RegExp(host)
			},
			'slug name engine website metadata',
			(err, result) => {
				if (err) return next('EFINDHOST', err);
				if (!result) return next('EHOSTNOTFOUND');

				RedisService.set(keyHost, result);

				return next(null, result);
			})
		},

		// parse
		(hostInfo, next) => {
			let engineName = hostInfo.engine;
			let enginePath = `../../engines/${engineName}.js`;
			let engineFullPath = path.join(__dirname, enginePath);

			let engine = null;
			if (!fs.existsSync(engineFullPath)) {
				debug('WARNING: no engine implement for host', host);
				// return next('EENGINENOTEXISTS');
			} else {
				engine = require(enginePath);
			}

			baseEngine.getRawContent(link, hostInfo, engine, (err, result) => {
				if (err) return next('EGETRAWCONTENT', err);

				rawHtml = result;
				return next(null);
			});
		},

		// save
		(next) => {
			if (!rawHtml) return next();

			debug('save cache key= %s', keyContent);
			RedisService.set(keyContent, rawHtml, TTL_RAW_HTML);

			Feed.model.findOne({
				link
			}, (err, feed) => {
				if (err || !feed) {
					debug('find feed err= %s', err);
					return next();
				}

				Feed.updateItem(feed, {
					rawHtml: rawHtml
				}, {
					new: true
				}, (err, newFeed) => {
					if (err) debug('update feed err= %s', err);
					if (newFeed) {
						debug('update rawHtml newFeed= %o', newFeed);
					}

					return next();
				})
			});
		}
	], (err, result) => {
		if (err) {
			switch (err) {
				case 'GET_FROM_CACHE':
				case 'GET_FROM_DB':
					return callback(null, rawHtml);
				default:
					return callback(err, result);
			}
		}

		return callback(null, rawHtml);
	});
}