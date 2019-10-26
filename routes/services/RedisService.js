const redis = require('redis');

const REDIS_URI = process.env.REDIS_URI;

let _client = null;

const NODE_ENV = process.env.NODE_ENV || 'development';

// key format: <env>:<key>
const prefix = `${NODE_ENV}:`;

const noop = () => {};

module.exports = {
	init: () => {
		_client = redis.createClient(REDIS_URI);

		_client.on("error", (err) => {
		    console.error("Redis Error: " + err);
		});

		_client.on("ready", () => {
		    console.log("Redis ready!");
		});
	},

	getClient: () => {
		return _client;
	},

	get: (key, callback) => {
		_client.get(`${prefix}:${key}`, callback);
	},

	del: (key, callback) => {
		_client.del(`${prefix}:${key}`, callback);
	},

	delPattern: (pattern, callback) => {
		// _client.del(`${prefix}:${key}`, callback);
	},

	set: (key, value, ttl = 0, callback = noop) => {
		try {
			if (typeof value == 'object') value = JSON.stringify(value);
		} catch {

		}

		_client.set(`${prefix}:${key}`, value, callback);
		if (ttl && Number(ttl) > 0) _client.expire(`${prefix}:${key}`, ttl);
	}
}
