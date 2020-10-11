const Bull = require('bull');
const _ = require('lodash');
const Redis = require('ioredis');

const { REDIS_URI } = process.env;

const client = new Redis(REDIS_URI);
const subscriber = new Redis(REDIS_URI);

const connectionOpts = {
  createClient: function (type) {
    switch (type) {
      case 'client':
        return client;
      case 'subscriber':
        return subscriber;
      default:
        return new Redis(REDIS_URI);
    }
  }
}

module.exports = function (nameQueue) {
	const bull = new Bull(nameQueue, connectionOpts);

	let jobProcName = _.snakeCase(nameQueue);

	require(`../jobs/bull/${jobProcName}`)(bull);

	return bull;
}

/*module.exports = function (nameQueue, redisClient) {
	// let client = redisClient;
	// let subscriber = redisClient;

	const connectionOpts = {
		createClient: function (type) {
			switch (type) {
				case 'client':
					return client;
				case 'subscriber':
					return subscriber;
				default:
					return redisClient
			}

			return redisClient;
		}
	};

	const bull = new Bull(nameQueue, connectionOpts);

	let jobProcName = _.snackCase(nameQueue);

	console.log(`--> jobProcName= ${jobProcName}`);

	require(`../jobs/bull/${jobProcName}`)(bull);

	return bull;
}*/