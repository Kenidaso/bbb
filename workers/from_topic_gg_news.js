// NODE_ENV=production node workers/from_topic_gg_news

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

const NewsTopic = keystone.list('NewsTopic');
const NewsStory = keystone.list('NewsStory');
const Article = keystone.list('Article');

const engine = require('../engines/googleNews');

const noop = () => {};

process.on('uncaughtException', function (error) {
  console.log(`====> uncaughtException=`, error);
});

const checkQueue = () => {
	if (!queueTopic.running() && !queueStory.running() && !queueArticle.running()) {
		return stopWorker();
	}
}

const _procArticleAndStoryLinkFromTopic = (topic, results, callback) => {
	async.parallel({
		procStoryLink: (next) => {
			async.eachLimit(results, 1, (card, cbEach) => {
				if (!card || !card.linkStory) return cbEach(null);


			}, next);
		},

		proceArticle: (next) => {
			async.eachLimit(results, 1, () => {

			}, next);
		}
	}, callback);
}

const pickNameStory = (obj) => {
	if (obj.name) return obj.name;
	if (obj.articles && obj.articles.length > 0 && obj.articles[0].title) return obj.articles[0].title;
	if (obj._topic) return obj._topic.name;
	return shortId.generate(8);
}

// queue process link topic
var queueTopic = async.queue((topic, callback) => {
  console.log('process topic=', JSON.stringify(topic));

  let isGetOriginLink = false;

  engine.getFeedAndStoryFromTopic(topic.link, (err, results) => {
  	if (err) {
  		console.log('queueTopic err=', err);
  		return callback(err);
  	}

  	if (NODE_ENV !== 'production') {
  		results = _.slice(results, 0, 1);

  		results = results.map((r) => {
  			if (r.articles && r.articles.length > 0) r.articles = _.slice(r.articles, 0, 1);;
  			return r;
  		});
  	}

  	_.forEach(results, (result) => {
  		if (result.linkStory) {
  			queueStory.push({
  				...result,
  				_topic: topic
  			}, noop)
  		}

  		_.forEach(result.articles, (article) => {
  			queueArticle.push({
  				...article,
  				linkStory: result.linkStory,
  				_topic: topic
  			}, noop)
  		})
  	})

  	return callback(null);
  }, isGetOriginLink);
}, 1);

queueTopic.drain = function () {
	console.log('---> queueTopic drain ...');
}

// queue process link story
const queueStory = async.queue((story, callback) => {
	console.log('process story=', JSON.stringify(story));

	async.series({
		upsert_story: (next) => {
			// TODO: find by short key
			utils.upsertSafe(NewsStory, {
				link: story.linkStory
			}, {
				name: pickNameStory(story),
				link: story.linkStory,
				description: story.description || '',
				topic: story._topic._id,
				heroImage: {
					src: story.srcImg
				}
			}, (err, result) => {
				if (err) {
					console.log('upsertSafe err=', err);
				}

				return next();
			})
		},
		get_articles: (next) => {
			let isGetOriginLink = false;

			engine.getFeedFromStory(story.linkStory, (err, result) => {
				if (err) return next();

				_.forEach(result.sections, (section) => {
					let sectionTitle = section.title;

					_.forEach(section.articles, (article) => {
						queueArticle.push({
							...article,
							sectionTitle,
							linkStory: story.linkStory,
							_topic: story._topic
						}, noop)
					});
				});
			}, isGetOriginLink);
		},
	}, callback);
}, 1);

queueStory.drain = function () {
	console.log('---> queueStory drain ...');
	checkQueue();
};

// queue process Article
const queueArticle = async.queue((article, callback) => {
  console.log('process article=', JSON.stringify(article));

  if (!article.originLink) return callback();

  let update = {
		title: article.title,
		sectionTitle: article.sectionTitle || '',
		publishDate: moment(article.publishDate).toDate(),
		link: article.originLink,
		description: article.description,
		category: article._topic.category,

		// story,

		storyLink: article.linkStory,

		paperName: article.paper,
		paperImg: article.paperImg || '',
	}

	if (article.linkArticle) update.metadata = { linkArticle: article.linkArticle };
	if (article.image) {
		article.heroImage = {
			src: article.image
		}
	}

  utils.upsertSafe(Article, {
		link: article.originLink
	}, update, (err, result) => {
		if (err) return callback();

		return callback()
	})
}, 1);

queueArticle.drain = function () {
	console.log('---> queueArticle drain ...');
	checkQueue();
};

const getAllTopic = (callback) => {
	NewsTopic.model.find({ status: 1 }, '_id slug description link name category', (err, topics) => {
		return callback(err, topics);
	});
}

const procTopics = (topics, callback) => {
	if (NODE_ENV !== 'production') {
		topics = [ topics[0] ];
	}

	queueTopic.push(topics, callback);

	// return callback();

	// async.each(topics, (topic, cbEach) => {
	// 	queueTopic.push(topic, cbEach);
	// }, callback);
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
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

	console.log('start worker ...');

	keystone.start( x => {
		console.log('start done ...');

		runProcess();
		// runProcess(stopWorker);
	});
}

const stopWorker = () => {
	keystone.closeDatabaseConnection((err, result) => {
		console.log('stop worker done');
		return process.exit(0);
		// return startWorker();
	});
}

startWorker();

const watchDog = setInterval(() => {
	console.log('watch dog ...')
	checkQueue();
}, 1e3 * 60 * 20);
