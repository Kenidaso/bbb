require('dotenv').config();

const utils = require('../helpers/utils');


const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'local';

const keystone = require('keystone');
const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');

process.on('uncaughtException', (error) => {
  console.log(`====> uncaughtException=`, error);
});

keystone.import('../models');

let startWorker = () => {
	console.log('start ...');

	process.env.PORT = utils.randInt(3000, 4000);
	console.log('PORT=', process.env.PORT);

	keystone.init({
		headless: true,
		'user model': 'KsUser',
		'auto update': false,
		'port': process.env.PORT,
		'cookie secret': shortId.generate(16)
	});

	keystone.start((err) => {
		console.log('keystone start done');

		setTimeout(stopWorker, 10e3);
	})
}

let stopWorker = () => {
	console.log('stop ...');

	keystone.closeDatabaseConnection((err, result) => {
		console.log('stop worker done');

		keystone.httpServer.close();

		setTimeout(() => {
			startWorker();
		}, 3e3);
	});
}

startWorker();