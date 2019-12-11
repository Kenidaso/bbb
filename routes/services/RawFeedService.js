const NODE_ENV = process.env.NODE_ENV || 'development';

const keystone = require('keystone');
const request = require('request');
const url = require('url');
const async = require('async');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const baseEngine = require('../../engines/base');

const RedisService = require('./RedisService');

const Host = keystone.list('Host');
const Feed = keystone.list('Feed');

const debug = require('debug')('RawFeedService');

const utils = require('../../helpers/utils');

const TTL_RAW_HTML = 60 * 60 * 24 * 7; // cache 1 week

const noop = () => {};

RawFeed = {};
module.exports = RawFeed;

RawFeed.getHtmlContent = (link, options = {}, callback) => {
	let host = utils.getMainDomain(link);

	if (!host) return callback('ELINKINVALID', 1005);

	let { ignoreCache, flow, ignoreSaveCache } = options;

	debug('--> host= %o', host);

	let keyContent = `rawHtml:${link}`;
	let keyHost = `host:${host}`;

	let rawHtml = null;
	let heroImage = null;
	let description = null;
	let articleParse = null;

	async.waterfall([
		// get rawHtml from cache
		(next) => {
			if (NODE_ENV !== 'production') return next();

			if (ignoreCache) {
				debug('ignoreCache -> skip get rawHtml from cache ...');
				return next();
			}

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

			if (ignoreCache) {
				debug('ignoreCache -> skip get rawHtml from database ...');
				return next();
			}

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

			if (ignoreCache) {
				debug('ignoreCache -> skip get hostInfo from cache ...');
				return next(null, null);
			}

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
			'slug name engine website metadata customClass mainContentSelector removeSelectors fallbackMainContent',
			(err, result) => {
				if (err) return next('EFINDHOST', err);
				if (!result) {
					debug('WARNING host %s not found', host);

					return next(null, null);
					// return next('EHOSTNOTFOUND');
				}

				RedisService.set(keyHost, result);

				return next(null, result);
			})
		},

		// parse
		(hostInfo, next) => {
			let engine = null;

			if (flow === 'GRAB_ARTICLE') {
				return baseEngine.grabArticle(link, hostInfo, engine, (err, article) => {
					if (err) return next(err, article);
					if (!article) return next('EARTICLENOTFOUND');

					articleParse = article;
					rawHtml = article.content;

					if (article.image) heroImage = article.image;
					if (article.description || article.excerpt) description = article.description || article.excerpt;

					return next(null);
				});
			}

			if (!hostInfo) { // no host config, use flow auto
				debug('--> use web clipper ...');

				return baseEngine.userArticleParse(link, (err, article) => {
					if (err) return next(err, article);
					if (!article) return next('EARTICLENOTFOUND');

					articleParse = article;
					rawHtml = article.content;

					if (article.image || article.heroImage) heroImage = article.image || article.heroImage;
					if (article.description || article.excerpt) description = article.description || article.excerpt;

					return next(null);
				});
			}

			if (hostInfo) {
				let engineName = hostInfo.engine;
				let enginePath = `../../engines/${engineName}.js`;
				let engineFullPath = path.join(__dirname, enginePath);

				if (!fs.existsSync(engineFullPath)) {
					debug('WARNING: no engine implement for host: %s', host);
					// return next('EENGINENOTEXISTS');
				} else {
					debug('engineName= %s', engineName);
					debug('enginePath= %s', enginePath);
					engine = require(enginePath);
				}
			}

			baseEngine.getRawContent(link, hostInfo, engine, (err, result) => {
				if (err) return next('EGETRAWCONTENT', err);
				if (!result) return next('EGETRAWCONTENT_NORESULT');

				rawHtml = result.rawHtml;
				heroImage = result.heroImage;

				if (result.description) description = result.description;

				return next(null);
			});
		},

		// save
		(next) => {
			if (!rawHtml) return next();

			if (!ignoreSaveCache) {
				debug('save cache key= %s', keyContent);
				RedisService.set(keyContent, rawHtml, TTL_RAW_HTML);
			}

			Feed.model.findOne({
				link
			}, (err, feed) => {
				if (err || !feed) {
					debug('find feed err= %s', err);
					return next();
				}

				async.parallel({
					update_heroImage: (cb) => {
						if (!heroImage) return cb();

						let urlImage = heroImage;
						let public_id = heroImage;
						let width = -1;
						let height = -1;
						let format = 'jpg';

						utils.getSizeImage(urlImage, (errSize, sizeOf) => {
							debug(`get size image url= ${urlImage}: ${JSON.stringify(sizeOf)}`);

							if (sizeOf) {
								width = sizeOf.width || -1;
								height = sizeOf.height || -1;
								format = sizeOf.type || 'jpg';
								public_id = public_id.replace(`.${format}`, '');
							}

							if (sizeOf && sizeOf.newUrlImage) {
								urlImage = sizeOf.newUrlImage;
								public_id = urlImage.replace(`.${format}`, '');
							}

							let updateHeroImage = {
								url: urlImage,
								width: width,
								height: height,
								format,
								public_id
							}

							debug(`update hero image: ${JSON.stringify(updateHeroImage)}`);

							Feed.model.findOneAndUpdate({
								_id: feed._id
							}, {
								$set: {
									heroImage: updateHeroImage
								}
							}, {
								new: true
							}, () => {
								return cb();
							})
						})
					},

					update_rawHtml: (cb) => {
						let update = {
							rawHtml: rawHtml
						}

						if (!feed.description && description) {
							update.description = description;
						}

						Feed.updateItem(feed, update, {
							new: true
						}, (err, newFeed) => {
							if (err) debug('update feed err= %s', JSON.stringify(err));
							if (newFeed) {
								debug('update rawHtml newFeed done');
							}

							return cb();
						})
					}
				}, next);
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
