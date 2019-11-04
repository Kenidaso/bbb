// NODE_ENV=production node workers/fix_originLink_article

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

const Article = keystone.list('Article');

const engine = require('../engines/googleNews');

const noop = () => {};

const LIMIT_ARTICLE = 100;

process.on('uncaughtException', function (error) {
  console.log(`====> uncaughtException=`, error);
});

const getAllArticleError = (callback) => {
	Article.model.find({
		link: /news\.google/
	}, (err, articles) => {
		return callback(err, articles);
	});
}

const fixArticles = (articles, callback) => {
	async.eachLimit(articles, LIMIT_ARTICLE, (article, cbEach) => {
		engine.getLinkRedirect(article.link, (err, originLink) => {
			if (err || !originLink) return cbEach();

			article.link = originLink;
			updateOrRemove(article, cbEach);
		});
	}, callback);
}

const updateOrRemove = (article, callback) => {
	Article.model.findOne({
		link: article.link
	}, (err, result) => {
		if (err) {
			console.log(`updateOrRemove err= ${err}`);
			return callback()
		}

		if (result) {
			console.log(`---> remove ${article._id}`);
			return Article.model.remove({
				_id: article._id
			}, callback)
		}

		console.log(`---> update ${article._id}`);
		article.save(callback);
	})
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		getAllArticleError,
		fixArticles,
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