// NODE_ENV=production LIMIT_RSS=5 LIMIT_NEWS=5 node workers/from_rss

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

const LIMIT_RSS = Number(process.env.LIMIT_RSS) || 1;
const LIMIT_NEWS = Number(process.env.LIMIT_NEWS) || 1;

keystone.init({
	headless: true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16)
});

keystone.import('../models');

const getAllRss = (callback) => {
	const RssModel = keystone.list('Rss').model;

	const fields = '-_id slug category host url title';

	RssModel
		.find()
		.select(fields)
		.populate('category', '_id slug title')
		.populate('host', '_id name website engine metadata')
		.exec((err, rsses) => {
		  if (err) return callback('EFINDRSS', err);

		  if (NODE_ENV != 'production') rsses = rsses.slice(0, 1);

		  return callback(null, rsses);
		});
}

const procEachRss = (rsses, callback) => {
	let procOne = (objRss, cb) => {
		console.log('procEachRss procOne objRss=', JSON.stringify(objRss));

		if (!objRss.host || !objRss.host.engine) return cb('ENOENGINEINSETTING', objRss);

		const engineName = objRss.host.engine;
		const enginePath = `../engines/${engineName}.js`;

		console.log('enginePath=', enginePath);

		if (!fs.existsSync(path.join(__dirname, enginePath))) return cb('EENGINENOTEXISTS', objRss);

		let engine = require(enginePath);

		if (!engine.getNewsFromRss) return cb('EENGINEMODULENOTFOUND', objRss);

		engine.getNewsFromRss(objRss.url, (err, newses = []) => {
			if (err) return cb(err);

			if (NODE_ENV != 'production') newses = newses.slice(0, 2);

			async.eachLimit(newses, LIMIT_NEWS, (news, cbEach) => {
				news._objRss = objRss;

				console.log('news=', JSON.stringify(news));

				procOneNews(engine, news, cbEach);
			}, (err, result) => {
				return cb();
			})
		});
	}

	async.eachLimit(rsses, LIMIT_RSS, procOne, callback);
}

const procOneNews = (engine, objRss, callback) => {
	async.series({
		// get content from link rss
		get_content_news: (next) => {
			console.log('----> objRss=', JSON.stringify(objRss));
			engine.getContent(objRss, (err, result) => {
				return next(null);
			});
		},

		save_news: (next) => {
			const FeedModel = keystone.list('Feed').model;

			FeedModel.findOne({
				link: objRss.link
			}, (err, feed) => {
				if (err) return next(err);

				if (feed) {
					console.log('feed exists');
					return next();
				}

				let objNewFeed = {
					link: objRss.link,
					title: objRss.title,
					publishDate: moment(objRss.pubDate).toDate(),
					description: objRss.description,
					contentOrder: objRss._content.contentOrder,
					images: objRss._content.images,
					heroImage: objRss._content.heroImage,
					videos: objRss._content.videos,

					host: objRss._objRss.host._id,
					category: objRss._objRss.category._id,
				}

				console.log('objNewFeed=', JSON.stringify(objNewFeed));

				let newFeed = new FeedModel(objNewFeed);

				newFeed.save(next);
			});
		}
	}, (err, result) => {
		console.log('procOneNews err=', err);
		console.log('procOneNews result=', result);

		return callback(err, result);
	});
}

const getContent = (engine, link, callback) => {
	engine.getContent(link, callback);
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		getAllRss,
		procEachRss,
	], (err, result) => {
		console.log('run process done err=', err);
		console.log('run process done result=', JSON.stringify(result));

		return callback && callback();
	});
}

const startWorker = () => {
	keystone.start( x => {
		console.log('start done ...');

		runProcess(stopWorker);
	});
}

const stopWorker = () => {
	keystone.closeDatabaseConnection((err, result) => {
		console.log('stop worker done');
		return process.exit(0);
	});
}

startWorker();