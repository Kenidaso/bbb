require('dotenv').config();

const utils = require('../helpers/utils');

process.env.PORT = utils.randInt(3000, 4000);

const keystone = require('keystone');
const shortId = require('short-id-gen');
const async = require('async');

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
		.populate('category', '-_id slug title')
		.populate('host', '-_id name website engine')
		.exec((err, rsses) => {
		  if (err) return callback('EFINDRSS', err);

		  return callback(null, rsses);
		});
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		getAllRss,
	], (err, result) => {
		console.log('run process done err=', err);
		console.log('run process done err=', result);

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