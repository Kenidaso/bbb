// https://m.baomoi.com/an-ninh-trat-tu/trang2.epi

// NODE_ENV=production node workers/from_topic_gg_news_v2

const path = require('path');

require('dotenv').config({
	path: path.join(__dirname, '../.env')
});

const utils = require('../helpers/utils');

process.env.PORT = utils.randInt(3000, 4000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'local';

const keystone = require('keystone');
const requireDir = require('require-dir');
const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');
const DecayMongo = require('cky-mongo-decay');

const program = require('commander');
program.version('1.0.0');

program
	.option('-s, --slug [String]', `slug of category's BaoMoi, seperate by comma. ex: thoi-su,the-thao,abc-xyz`)
	.option('-p, --page [Number]', `number of page crawl, max is 5`)

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

let engine = require('../engines/baomoi');

const Feed = keystone.list('Feed');
const Baomoi = keystone.list('Baomoi');

const Statics = requireDir('../statics');

const decayMongo = new DecayMongo({
	fnDecay: (obj) => {
		return moment(obj.publishDate).utcOffset(420).format('YYYYMM');
	},

	schema: require('../schemas/FeedSchema'),
	modelName: 'Feed',
	limitDecay: 10,
	stopDecayWhenError: false,

	piecesOfDecay: {
		'201901': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201901?ssl=true&authSource=admin',
		'201902': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201902?ssl=true&authSource=admin',
		'201903': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201903?ssl=true&authSource=admin',
		'201904': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201904?ssl=true&authSource=admin',
		'201905': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201905?ssl=true&authSource=admin',
		'201906': 'mongodb://admin:123456qwerty@news-201901-shard-00-00-mb6gu.mongodb.net:27017,news-201901-shard-00-01-mb6gu.mongodb.net:27017,news-201901-shard-00-02-mb6gu.mongodb.net:27017/news-201906?ssl=true&authSource=admin',
		'201907': 'mongodb://u03tbcz3m0lixhxufgp2:0DfdHu9nvj6EQbNrXjsX@bpbbnmdkbfh4jac-mongodb.services.clever-cloud.com:27017/bpbbnmdkbfh4jac',
		'201908': 'mongodb://ugpuny720zuiehj4bh3i:tGkqJXRndBlLLWvDFWTJ@b5ews7eoyuic9x5-mongodb.services.clever-cloud.com:27017/b5ews7eoyuic9x5',
		'201909': 'mongodb://uaq5ryxwxoaarzrf45sa:PnKs2RfQs0wpZvAuGGwo@bhx6aaykn40e6ac-mongodb.services.clever-cloud.com:27017/bhx6aaykn40e6ac',
		'201910': 'mongodb://umt3aqgjlfkrwjxqkp1z:33RrY4RuHYY7AJ8K9kyX@bm6eejqcbacvjfv-mongodb.services.clever-cloud.com:27017/bm6eejqcbacvjfv',
		'201911': 'mongodb://uwgtfa3n2inucui3u5cq:Eb29Kj49pdwmEy9QrhVM@bmfjjhav1hbruyp-mongodb.services.clever-cloud.com:27017/bmfjjhav1hbruyp',
		'201912': 'mongodb://ugrbizkityk1t32neglg:L7ikCYcz9bV6wvsWSzAe@b3haqbviztkcjnm-mongodb.services.clever-cloud.com:27017/b3haqbviztkcjnm',
	}
});

const noop = () => {};

let START = moment();
const MAX_PAGE = 5;

let listCategory = null;
let PAGE = Math.min(program.page || 1, MAX_PAGE);
PAGE = Math.max(PAGE, 0);

process.on('uncaughtException', (error) => {
  console.log(`====> uncaughtException=`, error);
});

const getBaomoiCategory = (callback) => {
	if (listCategory) return callback();

	let find = {};

	if (program.slug) {
		find['slug'] = {
			$in: program.slug.split(',')
		}
	}

	console.log('find category=', JSON.stringify(find));

	Baomoi.model.find(find, (err, categories) => {
		if (err) return callback('EGETCATEGORIES', err);

		listCategory = categories;

		return callback();
	});
}

const procOneCategory = (category, callback) => {

}

const processAllCategories = (callback) => {
	async.eachLimit(listCategory, 1, procOneCategory, callback);
}

const runProcess = (callback) => {
	console.log('process ...');

	async.waterfall([
		getBaomoiCategory,
		processAllCategories
	], (err, result) => {
		console.log('run process done err=', err);
		console.log('run process done result=', JSON.stringify(result));

		return callback && callback();
	});
}

const startWorker = () => {
	NODE_ENV != 'production' && console.clear();

	console.log('start worker ... NODE_ENV=', NODE_ENV);
	console.time('run-worker');

	async.parallel({
		init_decay: (next) => {
			decayMongo.init(next);
		},
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
	async.parallel({
		close_redis: (next) => {
			redisService.close(next);
		},

		close_mongo: (next) => {
			keystone.closeDatabaseConnection((err, result) => {
				keystone.httpServer.close();
				setTimeout(next, 500);
			});
		},

		close_decay: (next) => {
			setTimeout(decayMongo.close, 1e3, next);
			// decayMongo.close(next);
		}
	}, (err, result) => {
		console.log('stop worker done');
		console.timeEnd('run-worker');

		if(NODE_ENV != 'production') return process.exit(0);

		if (moment().diff(START, 'm') >= 30) {
			return process.exit(0);
		}

		setTimeout(startWorker, 3e3);
	});
}

// run
startWorker();
