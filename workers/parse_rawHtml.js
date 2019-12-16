require('dotenv').config();

const utils = require('../helpers/utils');

process.env.PORT = utils.randInt(3000, 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'local';

const keystone = require('keystone');
const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');

const program = require('commander');
program.version('1.0.0');

program
	.option('-s, --slug [String]', `slug of category, seperate by comma. ex: thoi-su,the-thao,abc-xyz`)

program.parse(process.argv);

keystone.init({
	headless: true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16)
});

keystone.import('../models');

let redisService = require('../routes/services/RedisService');
let RawFeedService = require('../routes/services/RawFeedService');

const Feed = keystone.list('Feed');
const Host = keystone.list('Host');
const Category = keystone.list('Category');

const noop = () => {};
const LIMIT_FEED_IN_CATEGORY = Number(process.env.LIMIT_FEED_IN_CATEGORY) || 50;

let regexHost = null;
let listCategory = null;
let START = moment();

process.on('uncaughtException', (error) => {
  console.log(`====> uncaughtException=`, error);
  setTimeout(process.exit, 1e3, 0);
});

const buildRegexHost = (callback) => {
	if (regexHost) return callback();

	Host.model.find({}, (err, hosts) => {
		if (err) return callback('EGETHOSTS', err);

		let domains = [];
		hosts.forEach((h) => {
			let domain = utils.getMainDomain(h.website);
			domains.push(domain);
		})

		regexHost = new RegExp(domains.join('|'));

		return callback();
	})
}

const getCategories = (callback) => {
	if (listCategory) return callback();

	let find = {};

	if (program.slug) {
		find['slug'] = {
			$in: program.slug.split(',')
		}
	}

	console.log('find category=', JSON.stringify(find));

	Category.model.find(find, '_id slug', (err, categories) => {
		if (err) return callback('EGETCATEGORIES', err);

		listCategory = categories;

		return callback();
	});
}

const procOneFeed = (feed, callback) => {
	console.log('procOneFeed: ', feed.slug);
	RawFeedService.getHtmlContent(feed.link, {
		ignoreSaveCache: true
	}, () => {
		return callback();
	});
}

const procOneCategory = (category, callback) => {
	console.log('procOneCategory: ', category.slug);

	Feed.model
		.find({
			category: category._id,
			// link: new RegExp(regexHost),
			publishDate: {
				$gte: moment().add(-1, 'M').toDate()
			},
			rawHtml: {
				$exists: false
			}
		})
		.select('-_id slug title link publishDate description heroImage rawHtml category linkBaoMoi')
		.populate('category', '-_id slug title display')
		.sort({
			publishDate: -1,
			updatedAt: -1,
			createdAt: -1
		})
		.limit(LIMIT_FEED_IN_CATEGORY)
		.exec((err, feeds) => {
			if (err) return callback();

			_.remove(feeds, function (f) {
			  return f.rawHtml;
			});

			async.eachLimit(feeds, 1, procOneFeed, callback);
		})
}

const processAllCategories = (callback) => {
	async.eachLimit(listCategory, 1, procOneCategory, callback);
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		buildRegexHost,
		getCategories,
		processAllCategories
	], (err, result) => {
		console.log('run process done err=', err);
		console.log('run process done result=', JSON.stringify(result));

		return callback && callback();
		// return setTimeout(runProcess, 5e3);
	});
}

const startWorker = () => {
	NODE_ENV != 'production' && console.clear();

	console.log('start worker ... NODE_ENV=', NODE_ENV);
	console.time('run-worker');

	async.parallel({
		start_keystone: (next) => {
			keystone.start(next)
		}
	}, (err, result) => {
		if (err) {
			console.log('start keystone fail, err=', err);
			return;
		}

		console.log('start done ...');
		runProcess(stopWorker);
		// runProcess(runProcess);
	})
}

const stopWorker = () => {
	async.parallel({
		close_mongo: (next) => {
			keystone.closeDatabaseConnection((err, result) => {
				console.log('close db done');
				keystone.httpServer.close();
				setTimeout(next, 500);
			});
		}
	}, (err, result) => {
		console.log('stop worker done');
		console.timeEnd('run-worker');

		if (NODE_ENV !== 'production') return process.exit(0);

		if (moment().diff(START, 'm') >= 30) {
			return process.exit(0);
		}

		setTimeout(startWorker, 3e3);
	});
}

// run
startWorker();

// cheat
setTimeout(process.exit, 1e3 * 60 * 30, 0);