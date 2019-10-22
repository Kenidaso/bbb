const redis = require('redis');

const REDIS_URI = process.env.REDIS_URI;

let _client = null;

module.exports = {
	init: () => {
		_client = redis.createClient(REDIS_URI);

		_client.on("error", (err) => {
		    console.log("Redis Error: " + err);
		});

		_client.on("ready", () => {
		    console.log("Redis ready!");
		});
	},

	getClient: () => {
		return _client;
	},

	get: (key, callback) => {
		_client.get(key, callback);
	},

	del: (key, callback) => {
		_client.del(key, callback);
	},

	set: (key, value, ttl, callback) => {
		_client.set(key, value, callback);
		if (ttl) _client.expire(key, ttl);
	}
}
