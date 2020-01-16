const NODE_ENV = process.env.NODE_ENV || 'development';

const async = require('async');
const _ = require('lodash');
const fs = require('fs');

const engine = require('../../engines/google');
const trends = require('../../engines/googleTrends');
const football = require('../../engines/googleFootball');

const RedisService = require('./RedisService');

const utils = require('../../helpers/utils');

const TTL_STANDING = 60 * 60 * 2; // 2 hours
const TTL_STAT = 60 * 60 * 2; // 2 hours
const TTL_NEWS = 60 * 60 * 1; // 2 hours
const TTL_PLAYER = 60 * 60 * 24 * 7; // 1 week
const TTL_MATCH = 60 * 60 * 24 * 1; // 1 day

const autocomplete = (keyword, callback) => {
	engine.autocomplete(keyword, (err, result) => {
		if (err) return callback(err);

		if (!result[0]) return callback();

		let data = result[0];
		let list = data.map((d) => {
			let title = d[0].replace(/\<b\>/g, '').replace(/\<\/b\>/g, '');
			return { title };
		});

		return callback(null, list);
	});
}

const autocompleteMerge = (keyword, callback) => {
	async.parallel({
		ggsearch: (next) => {
			engine.autocomplete(keyword, (err, result) => {
				if (err) return next(null, []);

				if (!result[0]) return next(null, []);

				let data = result[0];
				let list = data.map((d) => {
					let title = d[0].replace(/\<b\>/g, '').replace(/\<\/b\>/g, '');
					return { title };
				});

				return next(null, list);
			});
		},

		ggtrends: (next) => {
			trends.autocomplete({ keyword }, (err, result) => {
				if (err) return next(null, []);

				if (result.default && result.default.topics) return next(null, result.default.topics);

				return next(err, result);
			})
		}
	}, (err, result) => {
		let final = [ ...result.ggsearch, ...result.ggtrends ];
		final = _.uniqBy(final, 'title');

		return callback(null, final);
	})
}

const standingOfLeague = (options, callback) => {
	let key = `ggsport:standingOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		football.standingOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_standing.html', result);
			}

			RedisService.set(key, result, TTL_STANDING);

			return callback(null, result);
		});
	})
}

const statOfLeague = (options, callback) => {
	let key = `ggsport:statOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		football.statOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_stat.html', result);
			}

			RedisService.set(key, result, TTL_STAT);

			return callback(null, result);
		});
	})
}

const newsOfLeague = (options, callback) => {
	// return callback('ENOTIMPLEMENTYET');

	let key = `ggsport:newsOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		football.newsOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_news.html', result);
			}

			RedisService.set(key, result, TTL_NEWS);

			return callback(null, result);
		});
	})
}

const playerOfLeague = (options, callback) => {
	let key = `ggsport:playerOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		football.playerOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_player.html', result);
			}

			RedisService.set(key, result, TTL_PLAYER);

			return callback(null, result);
		});
	})
}

const matchOfLeague = (options, callback) => {
	let key = `ggsport:matchOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		football.matchOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_match.html', result);
			}

			RedisService.set(key, result, TTL_MATCH);

			return callback(null, result);
		});
	})
}

module.exports = {
	autocomplete,
	autocompleteMerge,
	standingOfLeague,
	statOfLeague,
	newsOfLeague,
	playerOfLeague,
	matchOfLeague
}