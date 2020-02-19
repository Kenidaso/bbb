const RedisSMQ = require("rsmq");
const requireDir = require('require-dir');

const Statics = requireDir('../../statics');

const configQueue = Statics.queue;
const workerConfig = configQueue.task_worker;

console.log('QueueService workerConfig=', JSON.stringify(workerConfig));

const utils = require('../../helpers/utils');

const redisService = require('./RedisService');
let client = redisService.getClient();

// redis://user:9nSpQH7B3aRjcTClWjOJqVOINX0AoDRH@157.230.253.180:6379

const REDIS_URI = process.env.REDIS_URI;

let split = REDIS_URI.replace('redis://', '').split('@');

let [user, password] = split[0].split(':');
let [host, port] = split[1].split(':');

const rsmq = new RedisSMQ({
	// client,
	host,
	port,
	password,
	ns: workerConfig.ns
});

rsmq.listQueues( (err, queues) => {
	if (err) {
		console.error('listQueues err=', err)
		return;
	}

	if (queues.includes(workerConfig.name)) {
		console.log(`queue ${workerConfig.name} exists`);
		return;
	}

	rsmq.createQueue({
		qname: workerConfig.name
	}, (err, resp) => {
		if (err) {
			console.error('createQueue err=', err)
			return;
		}

		if (resp === 1) {
			console.log(`queue ${workerConfig.name} created!`);
		}
	});
});

let queueService = {};

queueService.push = (data, callback) => {
	rsmq.sendMessage({
		qname: workerConfig.name,
		message: JSON.stringify(data)
	}, (err, resp) => {
		if (err) {
			return callback(err);
		}

		console.log("Message sent. ID:", resp);

		let result = {
			idMessage: resp,
			data
		}

		if (data.key) redisService.createTaskKey(data.key, data);

		return callback(null, data);
	});
}

queueService.receiveMessage = (callback) => {
	rsmq.receiveMessage({ qname: workerConfig.name }, callback);
}

queueService.deleteMessage = (id, callback) => {
	rsmq.deleteMessage({
		qname: workerConfig.name,
		id
	}, callback);
}

module.exports = queueService;