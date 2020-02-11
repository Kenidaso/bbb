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

let ROUND = 0;

let STORE_LINK_UPSERT = {}

const getAllRss = (callback) => {
	roundGetRss++;
	if (RSSes && roundGetRss % 50 != 0) return callback(null, RSSes);

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
		} else {
			engine = require(enginePath);
		}

		if (!engine.getNewsFromRss) {
			engine.getNewsFromRss = baseEngine.getNewsFromRss;
		}

		engine.getNewsFromRss(objRss.url, (err, newses = []) => {
			if (err) {
				// return cb(err);
				return cb();
			}

			if (NODE_ENV != 'production') newses = newses.slice(0, 2);

			async.eachLimit(newses, LIMIT_NEWS, (news, cbEach) => {
				news._objRss = objRss;
				if (news.link) news.link = news.link.trim();

				// console.log(`[ROUND ${ROUND}] news link= ${news.link}`);

				procOneNews(engine, news, cbEach);
			}, (err, result) => {
				return cb();
			})
		});
	}

	async.eachLimit(rsses, LIMIT_RSS, procOne, callback);
}

const procOneNews = (engine, objRss, callback) => {
	if (STORE_LINK_UPSERT[objRss.link]) {
		console.log(`[ROUND ${ROUND}] IGNORE ${objRss.link}`);
		return callback();
	}

	async.series({
		save_news: (next) => {
			let objNewFeed = {
				link: objRss.link,
				title: objRss.title,
				description: objRss.description,
				publishDate: objRss.pubDate || objRss.publishDate,
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

			if (objRss.articleLink) {
				objNewFeed['metadata.articleLink'] = objRss.articleLink;
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

			// console.log('--> update=', JSON.stringify(update));
			// return next(null, { find, update });

			console.log(`[ROUND ${ROUND}] news link= ${objRss.link}`);

			utils.reqUpsertFeed(find, update, next)
		}
	}, (err, result) => {
		// console.log('procOneNews err=', err);
		// console.log('procOneNews result=', JSON.stringify(result));

		if (!err) {
			console.log(`[ROUND ${ROUND}] STORE ${objRss.link}`);
			STORE_LINK_UPSERT[objRss.link] = true;
		}

		return callback(err, result);
	});
}

const runProcess = (callback) => {
	ROUND++;
	console.log(`process ROUND ${ROUND}...`);
	console.time(`process ROUND ${ROUND}`);

	async.waterfall([
		getAllRss,
		procEachRss,
	], (err, result) => {
		console.timeEnd(`process ROUND ${ROUND}`);
		console.log('run process done err=', err);
		console.log('run process done result=', JSON.stringify(result));

		if (ROUND % 200 === 0) {
			console.log('clear STORE_LINK_UPSERT');
			STORE_LINK_UPSERT = {}; // clear store
		}

		if (process.env.NODE_ENV != 'production') return process.exit(0);

		return setTimeout(runProcess, 30e3);

		// return callback && callback();
	});
}

runProcess();
