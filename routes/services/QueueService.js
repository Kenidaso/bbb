const RedisSMQ = require("rsmq");
const requireDir = require('require-dir');

const Statics = requireDir('../../statics');

const configQueue = Statics.queue;
const workerConfig = configQueue.task_worker;
const TASK = Statics.task;

console.log('QueueService workerConfig=', JSON.stringify(workerConfig));

const utils = require('../../helpers/utils');

const RedisService = require('./RedisService');
const TaskService = require('./TaskService');

let client = RedisService.getClient();

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

		if (data.key) RedisService.createTaskKey(data.key, data);

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

queueService.pushTask = (taskData, callback) => {
	let { name, params, options } = taskData;

	if (!name) return callback('EMISSTASKNAME');
	if (!params) return callback('EMISSTASKPARAMS');

	if (typeof params != 'object') return callback('EINVALIDTYPEOFPARAMS');
	if (Array.isArray(params)) return callback('EINVALIDTYPEOFPARAMS');
	if (Object.keys(params).length === 0) return callback('ENOFIELDINTASKPARAMS');

	if (params.key) return callback('EFIELDKEYINPARAMSNOTALLOWED');
	if (params.taskName) return callback('EFIELDTASKNAMEINPARAMSNOTALLOWED');
	if (params.options) return callback('EFIELDOPTIONSINPARAMSNOTALLOWED');

	name = name.toUpperCase().trim();
	options = options || {};

	if (!TASK[name]) return callback('ENOTCONFIGNAME');

	let taskName = TASK[name];
	let excecute = TaskService[taskName];

	if (!excecute) return callback('ENOTASKEXECUTE');

	let key = utils.buildTaskKey();

	let data = {
	  taskName,
	  options,
	  key,
	}

	data = Object.assign({}, data, params);

	queueService.push(data, callback);
}

module.exports = queueService;