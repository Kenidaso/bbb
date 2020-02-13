const redis = require('redis');

const utils = require('../../helpers/utils');

const REDIS_URI = process.env.REDIS_URI;

let _client = null;

const NODE_ENV = process.env.NODE_ENV || 'development';

// key format: <env>:<key>
const prefix = `${NODE_ENV}`;

const noop = () => { };

let TASK_STATUS = {
	NEW: 'NEW',
	PENDDING: 'PENDDING',
	PROCESSING: 'PROCESSING',
	FAILED: 'FAILED',
	SUCCESS: 'SUCCESS'
}

let TASK_KEY_TTL = 1000 * 60 * 60 * 24 * 2; // TTL of key is 2 days

let _changeStatusKey = (key, result = {}, status, callback = noop) => {
	_client.get(key, (err, value) => {
		if (err) return callback(err);

		value = utils.safeParse(value);

		if (value) {
			let data = Object.assign({}, value, { status });
			data.result = result;

			_client.set(key, JSON.stringify(data));
			_client.expire(key, TASK_KEY_TTL);
		}

		return callback && callback(null, value);
	})
}

module.exports = {
	init: (callback = noop) => {
		let isCallback = false;
		_client = redis.createClient(REDIS_URI);

		_client.on("error", (err) => {
			console.error("Redis Error: " + err);
		});

		_client.on("ready", () => {
			console.log("Redis ready!");
			if (!isCallback) {
				isCallback = true;
				return callback && callback();
			}
		});
	},

	getClient: () => {
		return _client;
	},

	get: (key, callback) => {
		if (!_client) return callback('ENOCLIENT');

		_client.get(`${prefix}:${key}`, callback);
	},

	del: (key, callback = noop) => {
		if (!_client) return callback('ENOCLIENT');

		console.log(`redis del key ${prefix}:${key}`);
		_client.del(`${prefix}:${key}`, callback);
	},

	delPattern: (pattern, callback) => {
		// _client.del(`${prefix}:${key}`, callback);
	},

	set: (key, value, ttl = 0, callback = noop) => {
		if (!_client) return callback('ENOCLIENT');

		try {
			if (typeof value === 'object') value = JSON.stringify(value);
		} catch (err) {

		}

		_client.set(`${prefix}:${key}`, value, callback);
		if (ttl && Number(ttl) > 0) _client.expire(`${prefix}:${key}`, ttl);
	},

	close: (cb = noop) => {
		if (!_client) return cb();
		_client.quit();
		setTimeout(cb, 500);
	},

	TASK_STATUS: TASK_STATUS,

	/*
		{
			request: {
				taskName: 'xxx',
				...data request
			},
			result: {

			},
			status: 'NEW'
		}
	*/
	createTaskKey: (key, task = {}, callback = noop) => {
		let data = {
			request: task,
			result: null,
			status: TASK_STATUS.NEW
		}

		_client.set(key, JSON.stringify(data));
		_client.expire(key, TASK_KEY_TTL);

		return callback && callback(null);
	},

	processTaskKey: (key, result = {}, callback = noop) => {
		_changeStatusKey(key, result, TASK_STATUS.PROCESSING, callback);
	},

	successTaskKey: (key, result = {}, callback = noop) => {
		_changeStatusKey(key, result, TASK_STATUS.SUCCESS, callback);
	},

	failTaskKey: (key, result = {}, callback = noop) => {
		_changeStatusKey(key, result, TASK_STATUS.FAILED, callback);
	},

	getTaskKey: (key, callback) => {
		_client.get(key, (err, value) => {
			if (err) return callback(err);

			value = utils.safeParse(value);
			return callback(null, value);
		})
	}
}
