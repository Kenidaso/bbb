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

const TASK = Statics.task;

const debug = require('debug');
let log = debug('TASK_WORKER');
let fatal = debug('FATAL');

let logE = log.extend('error');
let logQ = log.extend('queue');
let logQE = logQ.extend('error');
let logAutoPushTask = log.extend('AutoPushTask');

const redisService = require('../routes/services/RedisService');
redisService.init();

const queueService = require('../routes/services/QueueService');
const searchService = require('../routes/services/SearchService');
const taskService = require('../routes/services/TaskService');

// let client = redisService.getClient();

const WORKER_NAME = workerConfig.name;
const MAX_DRAIN = process.env.MAX_DRAIN || 3;
let COUNT_DRAIN = 0;
const WORKER_TTL = Number(process.env.WORKER_TTL) || 45; // 45 min: Worker time to life in minite
const QUEUE_CAPACITY = Number(process.env.QUEUE_CAPACITY) || 3

const START_AT = moment();

const noop = () => {};

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
		(next) => {
			let timeout = utils.randInt(2, 7);
			setTimeout(next, timeout * 1e3, null);
		}
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
			/*switch (task.taskName) {
				case TASK.SEARCH:
					searchService.mixSearch(task.keyword, task.options, (err, result) => {
						if (err) return next(err);
						return next(null, { result, err: null });
					})
					break;
				default:
					return next('ENOSUPPORTTASK', task);
			}*/

			let execute = taskService[task.taskName];

			if (!execute) return next('ENOSUPPORTTASK', task);

			execute(task, (err, result) => {
				if (err) return next(err);
				return next(null, { result, err: null });
			})
		},
		(taskResult, next) => {
			redisService.successTaskKey(key, { data: taskResult.result }, () => {
				redisService.getTaskKey(key, (err, value) => {
					log('success value= %o', value);

					return next(null);
				});
			});
		},
	], (err, result) => {
		if (err) {
			redisService.failTaskKey(key, { error: err }, noop);
		}

		return callback();
	});
}

let jmQueue = async.queue( (message, cbQueue) => {
	logQ('message= %o', message);

	// _fakeProcessMessage(message, (err, result) => {
	_processMessage(message, (err, result) => {
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
}, QUEUE_CAPACITY);

jmQueue.error = (err, task) => {
  logQE('task experienced an error: %o', err);
  logQE('task= %o', task);
}

jmQueue.drain = function () {
	logQ('jmQueue drain: all items have been processed');
	let diff = moment().diff(START_AT, 'm');

	if (jmQueue.idle() && diff >= WORKER_TTL) {
		_shutdown();
	}
}

jmQueue.saturated = () => {
	logQ('jmQueue saturated ...');
	STOP_RECEIVE_MESSAGE = true;
	CALL_MAIN = false;
}

jmQueue.unsaturated = () => {
	logQ('jmQueue unsaturated ...');
	STOP_RECEIVE_MESSAGE = false;
	if (CALL_MAIN) main();
}

// jmQueue.empty = () => {
// 	logQ('jmQueue empty ...');
// }

let _shutdown = () => {
	log('shutdown ...');
	setTimeout(process.exit, 100, 0);
}

let concurrency = jmQueue.concurrency;
let STOP_RECEIVE_MESSAGE = false;
let CALL_MAIN = false;

let checkRunning = () => {
	if (CALL_MAIN && jmQueue.running() < concurrency) {
		CALL_MAIN = false;
		main();
	} else {
		CALL_MAIN = true;
	}
}

let main = () => {
	let diff = moment().diff(START_AT, 'm');

	if (diff >= WORKER_TTL) {
		log('diff= %s, wait to shutdown ...', diff);

		CALL_MAIN = false;
		if (jmQueue.running() === 0) {
			return _shutdown();
		}

		return;
	}

	if (jmQueue.running() >= concurrency) {
		log("Running(%s) is max Concurrency(%s), wait at least 1 worker free ...", jmQueue.running(), concurrency);

		CALL_MAIN = true;
		return;
	}

	queueService.receiveMessage((err, message) => {
		if (err) {
			logE('receiveMessage err= %s', err);
			CALL_MAIN = false;
			return setTimeout(main, 1000);
		}

		if (!message || !message.id) {
			log("No messages ...");
			CALL_MAIN = false;
			return setTimeout(main, 1000);
			// return;
		}

		log("Message received: %s", message.id);

		jmQueue.push(message, (errQ, result) => {
			if (errQ) {
				logE(`process message= %s errQ= %s`, JSON.stringify(message.message), errQ);
			}

			log('jmQueue.running= %s', jmQueue.running());
			checkRunning();
			return;
		});

		checkRunning();
		// if (jmQueue.running() < concurrency) {
		// 	CALL_MAIN = false;
		// 	main();
		// } else {
		// 	CALL_MAIN = true;
		// }
	})
}

setTimeout(main, 3e3);

// auto push task
let AUTO_PUSH_TASKS = [
	{
		name: TASK.HOTNEWS,
		interval: 1e3 * 60 * 5
		// interval: 1e3 * 10
	}
]

setTimeout(() => {
	logAutoPushTask('begin auto push task ...');

	async.each(AUTO_PUSH_TASKS, (t, cb) => {
		queueService.pushTask(t, (err, result) => {
			logAutoPushTask(`task name: ${t.name} done, err= ${err}`);
			logAutoPushTask(`task name: ${t.name} done, result= ${JSON.stringify(result)}`);
			return cb();
		})

		// auto push
		setInterval(() => {
			queueService.pushTask(t, (err, result) => {
				logAutoPushTask(`task name: ${t.name} done, err= ${err}`);
				logAutoPushTask(`task name: ${t.name} done, result= ${JSON.stringify(result)}`);
			})
		}, t.interval);
	}, noop)
}, 5e3)

// auto restart
setTimeout(() => {
	console.log('Auto stop ...');
	process.exit(0);
}, (WORKER_TTL + 3) * 1000 * 60);

