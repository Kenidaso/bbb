// NODE_ENV=production node workers/from_topic_gg_news_v2

require('dotenv').config();

const utils = require('../helpers/utils');

process.env.PORT = utils.randInt(3000, 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';

const keystone = require('keystone');
const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');

keystone.init({
	headless: true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16)
});

keystone.import('../models');

let redisService = require('../routes/services/RedisService');

const NewsTopic = keystone.list('NewsTopic');
const NewsStory = keystone.list('NewsStory');
const Article = keystone.list('Article');
const Feed = keystone.list('Feed');

const engine = require('../engines/googleNews');

const noop = () => {};

const LIMIT_ARTICLE = Number(process.env.LIMIT_ARTICLE) || 1;
const LIMIT_LINK_STORY = Number(process.env.LIMIT_LINK_STORY) || 1;
const LIMIT_TOPIC = Number(process.env.LIMIT_TOPIC) || 1;

process.on('uncaughtException', function (error) {
  console.log(`====> uncaughtException=`, error);
});

const pickNameStory = (obj) => {
	if (obj.name) return obj.name;
	if (obj.articles && obj.articles.length > 0 && obj.articles[0].title) return obj.articles[0].title;
	if (obj._topic) return obj._topic.name;
	return shortId.generate(8);
}

const getAllTopic = (callback) => {
	NewsTopic.model.find({ status: 1 }, '_id slug description link name category', (err, topics) => {
		return callback(err, topics);
	});
}

const save_1_article = (article, callback) => {
	if (!article.title) {
		console.log(`\nsave_1_article title not found`);
		return callback();
	}

	async.series({
		checkOriginLinkAgain: (next) => {
			if (article.originLink && !/news\.google\.com/.test(article.originLink)) {
				return next();
			}

			console.log(`\nsave_1_article originLink not found, ${JSON.stringify(article)}`);
			console.log('get link redicrec again ...');

			engine.getLinkRedirect(article.linkArticle, (err, originLink) => {
				if (err || !originLink) {
					article.originLink = article.linkArticle;
					return next();
				}

				article.originLink = originLink
				return next()
			});
		},

		update: (next) => {
			if (/news\.zing\.vn.*tin-tuc\.html$/.test(article.originLink)) {
				// ignore link tin tuc cua news.zing.vn
				return next();
			}

			let find = {
				link: article.originLink
			}

			let update = {
				title: article.title,
				sectionTitle: article.sectionTitle || '',
				publishDate: moment(article.publishDate).toDate(),
				link: article.originLink,
				description: article.description,
				category: article._topic.category,
				storyLink: article.linkStory,
				topic: [article._topic._id],
			}

			if (article.linkArticle) {
				update.metadata = Object.assign({}, update.metadata, { linkArticle: article.linkArticle });
			}
			if (article.linkArticle) {
				update.metadata = Object.assign({}, update.metadata, { linkStory: article.linkStory });
			}
			// if (article.image) update.heroImage = { src: article.image }
			if (article._topic) update.topic = [ article._topic._id ];

			console.log(`\nsave_1_article update= ${JSON.stringify(update)}`);

		  utils.upsertSafe(Feed, find, update, (err, result) => {
				if (err) console.log(`save_1_article err= ${err}`);
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

	console.log(`\nsave_1_story update= ${JSON.stringify(update)}`);

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

	console.log('begin get link topic:', topic.link);

	engine.getFeedAndStoryFromTopic(topic.link, (err, results) => {
		if (err) {
			console.log('proc_1_topic err=', err);
			return callback(err);
		}

		console.log(`\n------------------\nproc_1_topic getFeedAndStoryFromTopic ${topic.link} :: results.length= ${results.length} \n------------------\n`);

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

		console.log('allArticle length=', allArticle.length);
		console.log('allLinkStory length=', allLinkStory.length);

		// console.log('allArticle=', JSON.stringify(allArticle));
		// console.log('\nallLinkStory=', JSON.stringify(allLinkStory));

		if (NODE_ENV !== 'production') allLinkStory = _.slice(allLinkStory, 0, 1);

		async.parallel({
			proc_all_article: (next) => {
				async.eachLimit(allArticle, LIMIT_ARTICLE, save_1_article, next);
			},

			proc_all_story_link: (next) => {
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

const removeOldFeed = (callback) => {
	let cutoff = moment().add(-30, 'd').toDate();
	console.log('begin remove old feed cutoff=', cutoff);

	Feed.model.remove({
		publishDate: {
			$lt: cutoff
		}
	}, (err, result) => {
		console.log('remove old err=', err);
		console.log('remove old result=', JSON.stringify(result));
		return callback(null);
	});
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

	async.parallel({
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
	keystone.closeDatabaseConnection((err, result) => {
		console.log('stop worker done');
		return process.exit(0);
		// return setTimeout(startWorker, 3e3);
	});
}

startWorker();