// NODE_ENV=production LIMIT_PAGE=2 LIMIT_NEWS=2 node workers/from_html

require('dotenv').config();

const Utils = require('../helpers/utils');

process.env.PORT = Utils.randInt(3000, 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';

const keystone = require('keystone');
const shortId = require('short-id-gen');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const LIMIT_PAGE = Number(process.env.LIMIT_PAGE) || 1;
let LIMIT_NEWS = Number(process.env.LIMIT_NEWS) || 1;

keystone.init({
	'headless': true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16),
});

keystone.import('../models');

const getAllHtml = () => {
	return new Promise((resolve, reject) => {
		const HtmlModel = keystone.list('Html').model;

		const fields = '-_id slug category host url title';

		HtmlModel
			.find()
			.select(fields)
			.populate('category', '_id slug title')
			.populate('host', '_id name website engine metadata')
			.exec((err, htmls) => {
				if (err) {
					return reject(err);
				};

				if (NODE_ENV !== 'production') htmls = htmls.slice(0, 1);

				return resolve(htmls);
			});
	});
};

const procOneNews = (engine, objectHtml) => {
	return new Promise(async (resolve, reject) => {
		// get content from link rss
		let [err, objHtml] = await Utils.to(engine.getContent(objectHtml));
		console.log('TCL: procOneNews -> err', err);

		if (err) {
			return reject(err);
		}
		console.log('----> objHtml=', JSON.stringify(objHtml));

		// if (!objHtml._content) return next('ENOCONTENT');

		const FeedModel = keystone.list('Feed').model;

		console.log('TCL: procOneNews -> objHtml.linkBaoMoi', objHtml.linkBaoMoi);

		FeedModel.findOne({
			linkBaoMoi: objHtml.linkBaoMoi,
		}, (err, feed) => {
			if (err) return reject(err);

			if (feed) {
				console.log('feed exists');
				return reject('EFEEDEXISTS');
			}

			let objNewFeed = {
				link: objHtml.linkReal,
				linkBaoMoi: objHtml.linkBaoMoi,
				title: objHtml.title,
				publishDate: moment(objHtml.publishTime).toDate(),
				description: objHtml.description,
				heroImage: {
					src: objHtml.imgSource,
					description: '',
				},
				contentOrder: objHtml._content.contentOrder,
				images: objHtml._content.images,
				videos: objHtml._content.videos,
				host: objHtml._objHtml.host._id,
				category: objHtml._objHtml.category._id,
			};
			console.log('objNewFeed=', JSON.stringify(objNewFeed));
			let newFeed = new FeedModel(objNewFeed);

			newFeed.save();
			return resolve(true);
		});
	});
};

const procEachHtml = (htmls) => {
	return new Promise(async (resolve, reject) => {
		let getEngine = (objHtml, cb) => {
			console.log('procEachRss procOne objHtml=', JSON.stringify(objHtml));

			if (!objHtml.host || !objHtml.host.engine) return cb('ENOENGINEINSETTING', objHtml);

			const engineName = objHtml.host.engine.toLowerCase();
			const enginePath = `../engines/${engineName}.js`;

			console.log('enginePath=', enginePath);

			if (!fs.existsSync(path.join(__dirname, enginePath))) return cb('EENGINENOTEXISTS', objHtml);

			let engine = require(enginePath);

			if (!engine.getNewsFromHtml) return cb('EENGINEMODULENOTFOUND', objHtml);

			return cb(null, engine);
		};
		let procOnePageHtml = (objHtml) => {
			return new Promise((resolve, reject) => {
				getEngine(objHtml, async (err, result) => {
					if (err) {
						return reject(err);
					}
					let engine = result;
					let [error, feeds] = await Utils.to(engine.getNewsFromHtml(objHtml.url, objHtml.host.metadata.mainSelector));
					if (error) {
						return reject(error);
					}
					if (NODE_ENV !== 'production') feeds = feeds.slice(0, 2);
					if (LIMIT_NEWS > feeds.length) {
						LIMIT_NEWS = feeds.length;
					}
					console.log('TCL: procOnePageHtml -> LIMIT_NEWS', LIMIT_NEWS);
					for (let i = 0; i < LIMIT_NEWS; i++) {
						if (!feeds[i]) {
							return reject('ENEWSUNDEFINED');
						}
						const news = feeds[i];
						news._objHtml = objHtml;
						console.log('news=', JSON.stringify(news));
						let [err] = await Utils.to(procOneNews(engine, news));
						if (err) {
							return reject(error);
						}
					}
					return resolve(true);
				});
			});
		};
		for (let i = 0; i < htmls.length; i++) {
			const objHtml = htmls[i];
			const url = objHtml.url.substring(0, objHtml.url.length - 4) + `/trang`;
			for (let j = 1; j <= LIMIT_PAGE; j++) {
				objHtml.url = `${url}${j}.epi`;
				let [err] = await Utils.to(procOnePageHtml(objHtml));
				if (err) {
					return reject(err);
				}
			}
		}

		console.log('done process...');
		return resolve(true);
	});
};

const runProcess = () => {
	console.log('process ...');
	return new Promise(async (resolve, reject) => {
		let [err, htmls] = await Utils.to(getAllHtml());
		if (err) {
			console.log('run process done err=', err);
		}
		let [error, result] = await Utils.to(procEachHtml(htmls));
		if (error) {
			console.log('run process done error=', error);
		}
		console.log('run process done result=', JSON.stringify(result));
	});
};

const startWorker = () => {
	keystone.start(async x => {
		console.log('start done ...');

		await runProcess(stopWorker);
	});
};

const stopWorker = () => {
	keystone.closeDatabaseConnection((err, result) => {
		console.log('stop worker done');
		// return process.exit(0);
		return startWorker();
	});
};

startWorker();
