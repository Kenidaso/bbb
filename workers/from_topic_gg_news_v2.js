// NODE_ENV=production node workers/from_topic_gg_news_v2
// NODE_ENV=production node workers/from_topic_gg_news_v2 -s ho-chi-minh

require('dotenv').config();

const utils = require('../helpers/utils');

process.env.PORT = utils.randInt(3000, 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'local';

const keystone = require('keystone');
const requireDir = require('require-dir');
const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const DecayMongo = require('cky-mongo-decay');

keystone.init({
	headless: true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16)
});

keystone.import('../models');

let redisService = require('../routes/services/RedisService');
let RawFeedService = require('../routes/services/RawFeedService');

const NewsTopic = keystone.list('NewsTopic');
const NewsStory = keystone.list('NewsStory');
const Article = keystone.list('Article');
const Feed = keystone.list('Feed');

const engine = require('../engines/googleNews');

const Statics = requireDir('../statics');

const decayMongo = new DecayMongo({
	fnDecay: (obj) => {
		return moment(obj.publishDate).utcOffset(420).format('YYYYMM');
	},

	schema: require('../schemas/FeedSchema'),
	modelName: 'Feed',
	limitDecay: 10,
	stopDecayWhenError: false,

	piecesOfDecay: {
		'201901': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201901?ssl=true&authSource=admin',
		'201902': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201902?ssl=true&authSource=admin',
		'201903': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201903?ssl=true&authSource=admin',
		'201904': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201904?ssl=true&authSource=admin',
		'201905': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201905?ssl=true&authSource=admin',
		'201906': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201906?ssl=true&authSource=admin',
		'201907': 'mongodb://u03tbcz3m0lixhxufgp2:0DfdHu9nvj6EQbNrXjsX@bpbbnmdkbfh4jac-mongodb.services.clever-cloud.com:27017/bpbbnmdkbfh4jac',
		'201908': 'mongodb://ugpuny720zuiehj4bh3i:tGkqJXRndBlLLWvDFWTJ@b5ews7eoyuic9x5-mongodb.services.clever-cloud.com:27017/b5ews7eoyuic9x5',
		'201909': 'mongodb://uaq5ryxwxoaarzrf45sa:PnKs2RfQs0wpZvAuGGwo@bhx6aaykn40e6ac-mongodb.services.clever-cloud.com:27017/bhx6aaykn40e6ac',
		'201910': 'mongodb://umt3aqgjlfkrwjxqkp1z:33RrY4RuHYY7AJ8K9kyX@bm6eejqcbacvjfv-mongodb.services.clever-cloud.com:27017/bm6eejqcbacvjfv',
		'201911': 'mongodb://uwgtfa3n2inucui3u5cq:Eb29Kj49pdwmEy9QrhVM@bmfjjhav1hbruyp-mongodb.services.clever-cloud.com:27017/bmfjjhav1hbruyp',
		'201912': 'mongodb://ugrbizkityk1t32neglg:L7ikCYcz9bV6wvsWSzAe@b3haqbviztkcjnm-mongodb.services.clever-cloud.com:27017/b3haqbviztkcjnm',

		'202001': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201901?ssl=true&authSource=admin',
		'202002': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201902?ssl=true&authSource=admin',
		'202003': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201903?ssl=true&authSource=admin',
		'202004': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201904?ssl=true&authSource=admin',
		'202005': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201905?ssl=true&authSource=admin',
		'202006': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201906?ssl=true&authSource=admin',
		'202007': 'mongodb://u03tbcz3m0lixhxufgp2:0DfdHu9nvj6EQbNrXjsX@bpbbnmdkbfh4jac-mongodb.services.clever-cloud.com:27017/bpbbnmdkbfh4jac',
		'202008': 'mongodb://ugpuny720zuiehj4bh3i:tGkqJXRndBlLLWvDFWTJ@b5ews7eoyuic9x5-mongodb.services.clever-cloud.com:27017/b5ews7eoyuic9x5',
		'202009': 'mongodb://uaq5ryxwxoaarzrf45sa:PnKs2RfQs0wpZvAuGGwo@bhx6aaykn40e6ac-mongodb.services.clever-cloud.com:27017/bhx6aaykn40e6ac',
		'202010': 'mongodb://umt3aqgjlfkrwjxqkp1z:33RrY4RuHYY7AJ8K9kyX@bm6eejqcbacvjfv-mongodb.services.clever-cloud.com:27017/bm6eejqcbacvjfv',
		'202011': 'mongodb://uwgtfa3n2inucui3u5cq:Eb29Kj49pdwmEy9QrhVM@bmfjjhav1hbruyp-mongodb.services.clever-cloud.com:27017/bmfjjhav1hbruyp',
		'202012': 'mongodb://ugrbizkityk1t32neglg:L7ikCYcz9bV6wvsWSzAe@b3haqbviztkcjnm-mongodb.services.clever-cloud.com:27017/b3haqbviztkcjnm',
	}
});

const noop = () => {};

const LIMIT_ARTICLE = Number(process.env.LIMIT_ARTICLE) || 1;
const LIMIT_LINK_STORY = Number(process.env.LIMIT_LINK_STORY) || 1;
const LIMIT_TOPIC = Number(process.env.LIMIT_TOPIC) || 1;
const MONTH_CUTOFF = Number(process.env.MONTH_CUTOFF) || 12;

const TTL_ARTICLELINK = 60 * 60 * 24 * 7; // 7 days
const TTL_LINK_SAVED = 60 * 60 * 24 * 7; // 7 days

let START = moment();

const program = require('commander');
program.version('1.0.0');

program
	.option('-s, --slug [String]', `slug of category's BaoMoi, seperate by comma. ex: thoi-su,the-thao,abc-xyz`)

program.parse(process.argv);

process.on('uncaughtException', (error) => {
  console.log(`====> uncaughtException=`, error);
});

const pickNameStory = (obj) => {
	if (obj.name) return obj.name;
	if (obj.articles && obj.articles.length > 0 && obj.articles[0].title) return obj.articles[0].title;
	if (obj._topic) return obj._topic.name;
	return shortId.generate(8);
}

const getAllTopic = (callback) => {
	let query = {
		status: 1
		// status: 0
	}

	if (program.slug) {
		let slugs = program.slug.split(',');

		if (slugs.length == 1) {
			query['slug'] = slugs[0];
		} else {
			query['slug'] = {
				$in: slugs
			}
		}
	}

	if (NODE_ENV !== 'production') {
		query.status = 0;
	}

	// console.log('query=', query);

	NewsTopic.model.find(query, '_id slug description link name category', (err, topics) => {
		return callback(err, topics);
	});
}

const save_1_article = (article, callback) => {
	if (!article.title) return callback();

	if (!article.linkArticle && !article.originLink) return callback();

	if (Statics && Statics.ingoreHost && Statics.ingoreHost.length > 0) {
		let isIgnore = new RegExp(Statics.ingoreHost.join('|')).test(article.originLink);

		if (isIgnore) {
			console.log('---> IGNORE link:', article.originLink);
			return callback();
		}
	}

	console.log('-> save article=', JSON.stringify(article));

	async.series({
		checkOriginLinkAgain: (next) => {
			if (article.originLink && !/news\.google\.com/.test(article.originLink)) {
				return next();
			}

			engine.getLinkRedirect(article.linkArticle, (err, originLink) => {
				if (err || !originLink) return next();
				article.originLink = originLink
				return next()
			});
		},

		update: (next) => {
			if (/news\.zing\.vn.*tin-tuc\.html$/.test(article.originLink)) {
				// ignore link tin tuc cua news.zing.vn
				return next();
			}

			if (!article.originLink || article.originLink == 'undefined') return next();

			let find = {
				link: article.originLink
			}

			let update = {
				$set: {
					title: article.title,
					sectionTitle: article.sectionTitle || '',
					publishDate: moment(article.publishDate).toDate(),
					link: article.originLink,
					description: article.description,
					storyLink: article.linkStory,
					// category: article._topic.category,
					// topic: [article._topic._id],
				},

				$addToSet: {
					// topic: {
					// 	$each: [ article._topic._id ]
					// },
					category: {
						$each: article._topic.category
					},
				}
			}

			if (!update.category || update.category.length == 0) {
				console.log('WARNING Category is null, article-', JSON.stringify(article));
			}

			if (article.linkArticle) {
				// update.metadata = Object.assign({}, update.metadata, { linkArticle: article.linkArticle });
				update['$set']['metadata.linkArticle'] =  article.linkArticle;
			}
			if (article.linkStory) {
				// update.metadata = Object.assign({}, update.metadata, { linkStory: article.linkStory });
				update['$set']['metadata.linkStory'] =  article.linkStory;
			}

			if (article._topic) {
				update['$addToSet']['topic'] = {
					$each: [ article._topic._id ]
				}
			}

			let keyLinkSaved = `ggn:saved:${article.originLink}`;

		  utils.upsertSafe_v2(Feed, find, update, (err, result) => {
				if (err) {
					console.log(`save_1_article err= ${err}`);
					return next(null, result);
				}

				console.log(`save_1_article done link= ${update.link}`);

				let objDecay = {
					slug: result.slug,
					link: result.link,
					title: result.title,
					publishDate: result.publishDate,
					createdAt: result.createdAt,
					updatedAt: result.updatedAt,
				};

				if (result.heroImage) objDecay.heroImage = result.heroImage;
				if (result.description) objDecay.description = result.description;
				if (result.rawHtml) objDecay.rawHtml = result.rawHtml;
				if (result.topic) objDecay.topic = result.topic;
				if (result.category) objDecay.category = result.category;

				decayMongo.decay({ link: 1 }, objDecay, (err, resultDecay) => {
					console.log('resultDecay err=', err, JSON.stringify(resultDecay));
				});

				/*if (!result.heroImage
					|| !result.description
					|| !result.rawHtml
				) {
					return RawFeedService.getHtmlContent(result.link, {
						ignoreCache: true
					}, (errRaw, resultRaw) => {
						if (!errRaw) console.log('getHtmlContent done link=', result.link);

						return next(null, result);
					});
				}*/

				return next(null, result);
			})
		}
	}, callback);
}

const save_1_story = (story, callback) => {
	let update = {
		name: story.name,
		heroImage: {
			src: story.image
		},
		link: story.linkStory,
		topic: story._topic._id,
	}

  utils.upsertSafe(NewsStory, {
		link: story.image
	}, update, (err, result) => {
		if (err) console.log(`save_1_story err= ${err}`);
		return callback(null, result);
	})
}

const proc_1_link_story = (objStory, callback) => {
	console.log('start getFeedFromStory linkStory=', objStory.linkStory);

	let isGetOriginLink = NODE_ENV != 'production' ? false : true;
	isGetOriginLink = false;

	engine.getFeedFromStory(objStory.linkStory, (err, result) => {
		if (err) {
			console.log(`proc_1_link_story getFeedFromStory err= ${err}`);
			return callback(null);
		}

		let sections = result.sections;

		let articles = [];

		_.forEach(sections, (section) => {
			let sectionTitle = section.title;

			section.articles = _.map(section.articles, (a) => {
				a.sectionTitle = sectionTitle;
				a.storyLink = objStory.linkStory;
				// a.story = storySaved._id;
				a._topic = objStory._topic;
				a.linkArticle = a.link;

				return a;
			})

			articles = [...articles, ...section.articles];
		})

		console.log('articles length=', articles.length);
		// console.log('articles=', JSON.stringify(articles));

		async.eachLimit(articles, LIMIT_ARTICLE, save_1_article, callback);
	}, isGetOriginLink);
}

const proc_1_topic = (topic, callback) => {
	let isGetOriginLink = NODE_ENV != 'production' ? false : true;
	isGetOriginLink = false;

	console.log('begin get link topic:', topic.link);

	engine.getFeedAndStoryFromTopic(topic.link, (err, results) => {
		if (err) {
			console.log('proc_1_topic err=', err);
			return callback(err);
		}

		if (NODE_ENV !== 'production') {
			results = _.slice(results, 0, 1);

			results = results.map((r) => {
				if (r.articles && r.articles.length > 0) r.articles = _.slice(r.articles, 0, 1);;
				return r;
			});
		}

		let allArticle = _.reduce(results, (res, item) => {
			res = [...res, ...item.articles];
			return res;
		}, []);

		allArticle = _.map(allArticle, (a) => {
			return {_topic: topic, ...a};
		})

		let allLinkStory = _.map(_.filter(results, 'linkStory'), (l) => {
			return {
				_topic: topic,
				name: pickNameStory(l),
				image: l.srcImg,
				linkStory: l.linkStory
			};
		})

		if (NODE_ENV !== 'production') allLinkStory = _.slice(allLinkStory, 0, 1);

		// console.log('allArticle=', JSON.stringify(allArticle));

		async.parallel({
			proc_all_article: (next) => {
				async.eachLimit(allArticle, LIMIT_ARTICLE, save_1_article, next);
			},

			proc_all_story_link: (next) => {
				// console.log('allLinkStory=', JSON.stringify(allLinkStory));

				async.eachLimit(allLinkStory, LIMIT_LINK_STORY, proc_1_link_story, next);
			}
		}, callback);
	}, isGetOriginLink);
}

const procTopics = (topics, callback) => {
	if (NODE_ENV !== 'production') {
		topics = [ topics[0] ];
	}

	async.eachLimit(topics, LIMIT_TOPIC, proc_1_topic, callback);
}

const letsDecay = (listDecay, callback) => {
	async.waterfall([
		// (next) => {
		// 	decayMongo.init(next);
		// },
		(next) => {
			decayMongo.decay({ link: 1 }, listDecay, next);
		},
		// (resultDecay, next) => {
		// 	decayMongo.close(next);
		// }
	], (err, result) => {
		return callback();
	});
}

const removeOldFeed = (callback) => {
	let cutoff = moment().add(-MONTH_CUTOFF, 'M').toDate();
	console.log('begin remove old feed cutoff=', cutoff);

	async.waterfall([
		(next) => {
			Feed.model.find({
				publishDate: {
					$lt: cutoff
				}
			}, '-_id', (err, result) => {
				console.log('old feed err=', err);
				console.log('old feed result length=', result.length);

				return next(err, result);
			});
		},
		(listDecay, next) => {
			if (!listDecay || listDecay.length == 0) return next(null);

			letsDecay(listDecay, next);
		},
		(next) => {
			Feed.model.remove({
				publishDate: {
					$lt: cutoff
				}
			}, (err, result) => {
				console.log('remove old err=', err);
				console.log('remove old result=', JSON.stringify(result));
				return next(null);
			});
		}
	], callback);
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		removeOldFeed,
		getAllTopic,
		procTopics,
	], (err, result) => {
		console.log('run process done err=', err);
		console.log('run process done result=', JSON.stringify(result));

		return callback && callback();
	});
}

const startWorker = () => {
	NODE_ENV != 'production' && console.clear();

	console.log('start worker ... NODE_ENV=', NODE_ENV);
	console.time('run-worker');

	async.parallel({
		init_decay: (next) => {
			decayMongo.init(next);
		},
		start_keystone: (next) => {
			keystone.start(next)
		},
		init_redis: redisService.init
	}, (err, result) => {
		if (err) {
			console.log('start keystone fail, err=', err);
			return;
		}

		console.log('start done ...');
		runProcess(stopWorker);
	})
}

const stopWorker = () => {
	async.parallel({
		close_redis: (next) => {
			redisService.close(next);
		},

		close_mongo: (next) => {
			keystone.closeDatabaseConnection((err, result) => {
				keystone.httpServer.close();
				setTimeout(next, 500);
			});
		},

		close_decay: (next) => {
			setTimeout(decayMongo.close, 1e3, next);
			// decayMongo.close(next);
		}
	}, (err, result) => {
		console.log('stop worker done');
		console.timeEnd('run-worker');

		if (NODE_ENV != 'production') return process.exit(0);

		if (moment().diff(START, 'm') >= 30) {
			return process.exit(0);
		}

		setTimeout(startWorker, 3e3);
	});
}

// run
startWorker();
