// const RedisSMQ = require("rsmq");
const fs = require('fs');
const path = require('path');

const async = require('async');
const moment = require('moment');
const requireDir = require('require-dir');

if (fs.existsSync('./.env')) {
	console.log('--> load .env ...');
	require('dotenv').config({
		path: path.join(__dirname, '../.env')
	});
}

const Statics = requireDir('../statics');

const configQueue = Statics.queue;
const workerConfig = configQueue.task_worker;

console.log('worker workerConfig=', JSON.stringify(workerConfig));

const utils = require('../helpers/utils');

const debug = require('debug');
let log = debug('TASK_WORKER');
let fatal = debug('FATAL');

let logE = log.extend('error');
let logQ = log.extend('queue');
let logQE = logQ.extend('error');

// const pupCtrl = require('../controllers/pup');

// const TASK_MAP = pupCtrl.TASK_MAP;

const redisService = require('../routes/services/RedisService');
const queueService = require('../routes/services/QueueService');
// const pupService = require('../services/PupService');

redisService.init();

let client = redisService.getClient();

const WORKER_NAME = workerConfig.name;
const MAX_DRAIN = process.env.MAX_DRAIN || 3;
let COUNT_DRAIN = 0;
const WORKER_TTL = process.env.WORKER_TTL ? Number(process.env.WORKER_TTL) : 30; // 30 min: Worker time to life in minite
const START_AT = moment();

// const rsmq = new RedisSMQ({
// 	client,
// 	ns: workerConfig.ns
// });

let _fakeProcessMessage = (message, callback) => {
	let task = utils.safeParse(message.message);

	logQ('task= %o', task);

	if (!task) return callback('EPARSEMESSAGE', message);
	if (!task.key) return callback(null);

	let key = task.key;

	async.waterfall([
		(next) => {
			// change status process
			redisService.processTaskKey(key, {}, () => {
				redisService.getTaskKey(key, (err, value) => {
					log('process value= %o', value);

					return next(null);
				});
			});
		},
		(next) => {
			redisService.successTaskKey(key, {
				name: 'Chickyky',
				data: 'hihihihi'
			}, () => {
				redisService.getTaskKey(key, (err, value) => {
					log('sucess value= %o', value);

					return next(null);
				});
			});
		},
	], callback);
}

let _processMessage = (message, callback) => {
	let task = utils.safeParse(message.message);

	logQ('task= %o', task);

	if (!task) return callback('EPARSEMESSAGE', message);
	if (!task.key) return callback('ETASKNOKEY', message);

	let key = task.key;

	async.waterfall([
		(next) => {
			// change status process
			redisService.processTaskKey(key, {}, () => {
				redisService.getTaskKey(key, (err, value) => {
					log('process value= %o', value);

					return next(null);
				});
			});
		},
		// processing ...
		(next) => {
			switch (task.taskName) {
				case TASK_MAP.getCookies:
					return pupService.getCookies(task, next);
				case TASK_MAP.loginCgv:
					return pupService.loginCgv(task, next);
				case TASK_MAP.savePlanSeatCgv:
					return pupService.saveHtmlPlanSeat_cgv(task, next);
				default:
					return next('ENOSUPPORTTASK', task);
			}
		},
		(taskResult, next) => {
			redisService.successTaskKey(key, { data: taskResult.result, error: taskResult.err }, () => {
				redisService.getTaskKey(key, (err, value) => {
					log('success value= %o', value);

					return next(null);
				});
			});
		},
	], callback);
}

let jmQueue = async.queue( (message, cbQueue) => {
	logQ('message= %o', message);

	_fakeProcessMessage(message, (err, result) => {
		if (err) {
			logQE('process message err= %o', err);
			return cbQueue(err);
		}

		queueService.deleteMessage(message.id, (err, resp) => {
			if (err) {
				logQE('deleteMessage err= %o', err);

				return cbQueue('EDELETEMESSAGE', err);
			}

			if (resp === 1) {
				logQ("Message id=%s deleted.", message.id);
				return cbQueue(null, message);
			}

			logQ("Message %s not found.", message.id);
			return cbQueue('EMESSAGENOTFOUND', message);
		});
	})
}, process.env.QUEUE_CAPACITY || 1);

jmQueue.error((err, task) => {
  logQE('task experienced an error: %o', err);
  logQE('task= %o', task);
});

jmQueue.drain(() => {
	logQ('jmQueue drain: all items have been processed');
	let diff = moment().diff(START_AT, 'm');

	if (jmQueue.idle() && diff >= WORKER_TTL) {
		_shutdown();
	}
});

let _shutdown = () => {
	log('shutdown ...');
	setTimeout(process.exit, 100, 0);
}

let main = () => {
	let diff = moment().diff(START_AT, 'm');

	if (diff >= WORKER_TTL) {
		log('diff= %s, wait to shutdown ...', diff);
		return _shutdown();
	}

	queueService.receiveMessage((err, message) => {
		if (err) {
			logE('receiveMessage err= %s', err);
			return;
		}

		if (!message || !message.id) {
			log("No messages ...");
			return setTimeout(main, 1000);
		}

		log("Message received: %o", message);

		jmQueue.push(message, () => {
			return setTimeout(main, 1000);
		});
	})
}

main();