const NODE_ENV = process.env.NODE_ENV || 'development';

const keystone = require('keystone');
const request = require('request');
const url = require('url');
const querystring = require('querystring');
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

let _getFromDb = (link, callback) => {
	Feed.model.findOne({
		link
	}, (err, doc) => {
		return callback(err, doc);
	});
}

RawFeed.getHtmlContent = (link, options = {}, callback) => {
	let host = utils.getMainDomain(link);

	if (!host) {
		console.log('can not get main domain from link:', link);
		return callback('ELINKINVALID', 1005);
	}

	let { ignoreCache, flow, ignoreSaveCache } = options;

	debug('--> host= %o', host);

	let keyContent = `rawHtml:${link}`;
	let keyBaoMoi = `linkBaoMoi:${link}`;
	let keyHost = `host:${host}`;

	let rawHtml = null;
	let heroImage = null;
	let description = null;
	let articleParse = null;
	let linkBaoMoi = null;
	let finalFeed = null;

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

		// get linkBaoMoi from cache
		(next) => {
			RedisService.get(keyBaoMoi, (err, value) => {
				if (!err && value) {
					debug('get linkBaoMoi from cache key= %s', keyBaoMoi);

					linkBaoMoi = value;
				}

				return next(null);
			})
		},

		// get rawHtml from database
		(next) => {
			// if (NODE_ENV !== 'production') return next();

			// if (ignoreCache) {
			// 	debug('ignoreCache -> skip get rawHtml from database ...');
			// 	return next();
			// }

			Feed.model.findOne({
				link
			}, (err, doc) => {
				if (err) return next();

				if (doc && doc.linkBaoMoi && doc.linkBaoMoi.length > 0) {
					RedisService.set(keyBaoMoi, doc.linkBaoMoi);
					linkBaoMoi = doc.linkBaoMoi;
				}

				if (NODE_ENV !== 'production') return next();

				if (ignoreCache) {
					debug('ignoreCache -> skip get rawHtml from database ...');
					return next();
				}

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

			if (linkBaoMoi) keyHost = `host:baomoi.com`;

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

			let regexHost = new RegExp(host);

			if (linkBaoMoi) regexHost = /baomoi\.com/;

			Host.model.findOne({
				website: regexHost
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

			if (link.indexOf('youtube.com') > -1) {
				let parseUrl = url.parse(link);
				let parseQs = querystring.parse(parseUrl.query);

				if (!parseQs.v) return next();

				let linkEmbed = `https://www.youtube.com/embed/${parseQs.v}`
			  let iframe = `<iframe src="${linkEmbed}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

			  debug('youtube.com -> return iframe: %s', iframe);

			  rawHtml = iframe;
			  return next(null);
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

					// debug('web clipper done, article= %o', article);

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

			let urlFeed = link;
			if (linkBaoMoi) urlFeed = linkBaoMoi;

			baseEngine.getRawContent(urlFeed, hostInfo, engine, (err, result) => {
				if (err) {
					// console.log('err=', err);
					// console.log('result=', result);
					return next(err, result);
				}
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
							}, (err, newFeed) => {
								if (err) debug('update feed err= %s', JSON.stringify(err));
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

						if (NODE_ENV !== 'production') debug('[getHtmlContent] update= %o', update);

						Feed.model.findOneAndUpdate({
							_id: feed._id
						}, {
							$set: update
						}, {
							new: true
						}, (err, newFeed) => {
							if (err) {
								debug('update feed err= %s', JSON.stringify(err));
							} else {
								let keyContentFeed = `rawHtml:${feed.link}`;
								console.log('trigger delete key redis:', keyContentFeed);
								RedisService.del(keyContentFeed);

								finalFeed = newFeed;
							}

							return cb();
						})
					}
				}, () => {
					if (!ignoreSaveCache) {
						debug('save cache key= %s', keyContent);
						RedisService.set(keyContent, rawHtml, TTL_RAW_HTML);
					}

					return next();
				});
			});
		}
	], (err, result) => {
		if (err) {
			switch (err) {
				case 'GET_FROM_CACHE':
				case 'GET_FROM_DB':
					return _getFromDb(link, (err, feed) => {
						if (feed) {
							let { description, heroImage, title, publishDate, slug, link, topic, category } = feed;
							let _res = Object.assign({}, { rawHtml }, { description, heroImage, title, publishDate, slug, link, topic, category });
							return callback(null, _res);
						}

						return callback(null, { rawHtml });
					})

				default:
					return callback(err, result);
			}
		}

		let _res = {
			rawHtml
		}

		if (finalFeed) {
			let { description, heroImage, title, publishDate, slug, link, topic, category } = finalFeed;
			_res = Object.assign({}, _res, { description, heroImage, title, publishDate, slug, link, topic, category });
		}

		return callback(null, _res);
	});
}
