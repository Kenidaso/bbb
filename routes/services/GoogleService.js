const NODE_ENV = process.env.NODE_ENV || 'development';

const async = require('async');
const _ = require('lodash');

const engine = require('../../engines/google');
const trends = require('../../engines/googleTrends');
const sports = require('../../engines/googleSport');

const RedisService = require('./RedisService');

const utils = require('../../helpers/utils');

const TTL_STANDING = 60 * 60 * 2; // 2 hours
const TTL_STAT = 60 * 60 * 2; // 2 hours
const TTL_NEWS = 60 * 60 * 1; // 2 hours
const TTL_PLAYER = 60 * 60 * 24 * 7; // 1 week
const TTL_MATCH = 60 * 60 * 24 * 1; // 1 day

const mapSlugLeague = {
	'premier-league': 'PREMIER_LEAGUE',
	'championship-one': 'PREMIER_LEAGUE',
	'la-liga': 'PREMIER_LEAGUE',
	'la-liga-2': 'PREMIER_LEAGUE',
	'serie-a': 'SERIE_A',
	'serie-b': 'SERIE_A',
	'bundesliga': 'BUNDESLIGA',
	'bundesliga-2': 'BUNDESLIGA',
	'ligue-1': 'BUNDESLIGA',
	'ligue-2':'BUNDESLIGA',
}

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
	options.type = mapSlugLeague[options.slug] || 'PREMIER_LEAGUE';

	let key = `ggsport:standingOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		sports.standingOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') console.log('result=', result);

			RedisService.set(key, result, TTL_STANDING);

			return callback(null, result);
		});
	})
}

const statOfLeague = (options, callback) => {
	options.type = mapSlugLeague[options.slug] || 'PREMIER_LEAGUE';

	let key = `ggsport:statOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		sports.statOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') console.log('result=', result);

			RedisService.set(key, result, TTL_STAT);

			return callback(null, result);
		});
	})
}

const newsOfLeague = (options, callback) => {
	options.type = mapSlugLeague[options.slug] || 'PREMIER_LEAGUE';

	let key = `ggsport:newsOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		sports.newsOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') console.log('result=', result);

			RedisService.set(key, result, TTL_NEWS);

			return callback(null, result);
		});
	})
}

const playerOfLeague = (options, callback) => {
	options.type = mapSlugLeague[options.slug] || 'PREMIER_LEAGUE';

	let key = `ggsport:playerOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		sports.playerOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') console.log('result=', result);

			RedisService.set(key, result, TTL_PLAYER);

			return callback(null, result);
		});
	})
}

const matchOfLeague = (options, callback) => {
	options.type = mapSlugLeague[options.slug] || 'PREMIER_LEAGUE';

	let key = `ggsport:matchOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, value);
		}

		sports.matchOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') console.log('result=', result);

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