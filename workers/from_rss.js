// NODE_ENV=production LIMIT_RSS=5 LIMIT_NEWS=5 node workers/from_rss

require('dotenv').config();

const utils = require('../helpers/utils');

process.env.PORT = utils.randInt(3000, 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';

const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const baseEngine = require('../engines/base');

const LIMIT_RSS = Number(process.env.LIMIT_RSS) || 1;
const LIMIT_NEWS = Number(process.env.LIMIT_NEWS) || 1;

let roundGetRss = 0;
let RSSes = null;

const program = require('commander');
program.version('1.0.0');

program
	.option('-h, --host [String]', `host want to get rss, ex: vnexpress.net`)

program.parse(process.argv);

const getAllRss = (callback) => {
	roundGetRss++;
	if (RSSes && roundGetRss % 10 != 0) return callback(null, RSSes);

	let query = {
		"q": {
			"status": 1
			// "status": 0
		},
		"f": {
			"slug": 1,
			"host": 1,
			"categories": 1,
			"url": 1,
			"title": 1
		},
		"p": {
      "path": "host",
      "fields": "slug name website engine"
    }
	}

	if (program.host) {
		// "q": { "name" : { $regex: "Ghost", $options: 'gi' } }
		query.q['url'] = {
			$regex: program.host,
			$options: 'gi'
		}
	}

	if (NODE_ENV != 'production') query.q.status = 0;

	utils.reqMongo('Rss', 'find', query, (err, result) => {
		if (err) return callback(err);
		RSSes = result;
		return callback(null, RSSes);
	})
}

const procEachRss = (rsses, callback) => {
	let procOne = (objRss, cb) => {
		console.log('procEachRss procOne objRss=', JSON.stringify(objRss));

		if (!objRss.host || !objRss.host.engine) return cb('ENOENGINEINSETTING', objRss);

		const engineName = objRss.host.engine;
		const enginePath = `../engines/${engineName}.js`;

		console.log('enginePath=', enginePath);
		let engine = null;

		if (!fs.existsSync(path.join(__dirname, enginePath))) {
			engine = baseEngine;
			// return cb('EENGINENOTEXISTS', objRss);
		} else {
			engine = require(enginePath);
		}

		if (!engine.getNewsFromRss) {
			engine.getNewsFromRss = baseEngine.getNewsFromRss;
			// return cb('EENGINEMODULENOTFOUND', objRss);
		}

		engine.getNewsFromRss(objRss.url, (err, newses = []) => {
			if (err) {
				// return cb(err);
				return cb();
			}

			if (NODE_ENV != 'production') newses = newses.slice(0, 2);

			async.eachLimit(newses, LIMIT_NEWS, (news, cbEach) => {
				news._objRss = objRss;

				console.log('news link=', news.link);

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
		save_news: (next) => {
			let objNewFeed = {
				link: objRss.link,
				title: objRss.title,
				description: objRss.description,
				publishDate: objRss.pubDate,
				host: objRss._objRss.host._id,
			}

			if (objRss.image) {
				if (typeof objRss.image == 'string') {
					objNewFeed['heroImage'] = {
						url: objRss.image,
						format: 'jpg',
						public_id: objRss.image.replace('.jpg', '')
					}
				}

				if (typeof objRss.image == 'object') {
					objNewFeed['heroImage'] = {
						url: objRss.image.url,
						width: objRss.image.width,
						height: objRss.image.height,
						format: 'jpg',
						public_id: objRss.image.url.replace('.jpg', '')
					}
				}
			}

			if (objRss.rawHtml) {
				objNewFeed['rawHtml'] = objRss.rawHtml.replace(/\r\n/g, '');
				objNewFeed['rawHtml'] = objRss.rawHtml.replace(/\r/g, '');
				objNewFeed['rawHtml'] = objRss.rawHtml.replace(/\n/g, '');
			}

			let find = {
				link: objNewFeed.link
			}

			let update = {
				$set: objNewFeed,
				$addToSet: {
					category: {
						$each: objRss._objRss.categories
					}
				}
			}

			// return next(null, { find, update });

			utils.reqUpsertFeed(find, update, callback)
		}
	}, (err, result) => {
		console.log('procOneNews err=', err);
		console.log('procOneNews result=', JSON.stringify(result));

		return callback(err, result);
	});
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		getAllRss,
		procEachRss,
	], (err, result) => {
		console.log('run process done err=', err);
		console.log('run process done result=', JSON.stringify(result));

		if (process.env.NODE_ENV != 'production') return process.exit(0);

		return setTimeout(runProcess, 30e3);

		// return callback && callback();
	});
}

runProcess();
