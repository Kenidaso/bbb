const NODE_ENV = process.env.NODE_ENV || 'development';

const async = require('async');
const _ = require('lodash');
const fs = require('fs');

const engine = require('../../engines/google');
const trends = require('../../engines/googleTrends');
const football = require('../../engines/googleFootball');

const RedisService = require('./RedisService');

const utils = require('../../helpers/utils');

const TTL_STANDING = 60 * 60 * 1; // 1 hour
const TTL_STAT = 60 * 60 * 1; // 1 hour
const TTL_NEWS = 60 * 60 * 1; // 1 hour
const TTL_PLAYER = 60 * 60 * 24 * 7; // 1 week
const TTL_MATCH = 60 * 60 * 1; // 1 hour
const TTL_LINEUPS = 60 * 60 * 1;
const TTL_TIMELINE = 60 * 60 * 1;
const TTL_STATSMATCH = 60 * 60 * 1;
const TTL_NEWSMATCH = 60 * 60 * 1;
const TTL_LAYOUTHEADERMATCH = 60 * 60 * 1;

const TTL_LONG = 60 * 60 * 24 * 14;

const parseCache = (data) => {
	if (!data) return null;

	let _tmp = utils.safeParse(data);

	return _tmp ? _tmp : data;
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
	let key = `ggsport:standingOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		football.standingOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (result && result.rawHtml && NODE_ENV !== 'production') {
				fs.writeFileSync('football_standing.html', result.rawHtml);
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
			return callback(null, utils.safeParse(value));
		}

		football.statOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (result && result.rawHtml && NODE_ENV !== 'production') {
				console.log(`result=`, result);
				fs.writeFileSync('football_stat.html', result.rawHtml);
			}

			if (result) {
				RedisService.set(key, result, TTL_STAT);
			}

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
			return callback(null, utils.safeParse(value));
		}

		football.newsOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (result && result.rawHtml && NODE_ENV !== 'production') {
				fs.writeFileSync('football_news.html', result.rawHtml);
			}

			if (result) {
				RedisService.set(key, result, TTL_NEWS);
			}

			return callback(null, result);
		});
	})
}

const playerOfLeague = (options, callback) => {
	let key = `ggsport:playerOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		football.playerOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (result && result.rawHtml && NODE_ENV !== 'production') {
				fs.writeFileSync('football_player.html', result.rawHtml);
			}

			if (result) {
				RedisService.set(key, result, TTL_PLAYER);
			}

			return callback(null, result);
		});
	})
}

const matchOfLeague = (options, callback) => {
	let key = `ggsport:matchOfLeague:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		football.matchOfLeague(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_match.html', result.rawHtml);
				console.log('data=', JSON.stringify(result.data));
			}

			RedisService.set(key, result, TTL_MATCH);

			return callback(null, result);
		});
	})
}

const statOfPlayer = (options, callback) => {
	let key = `ggsport:statOfPlayer:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		football.statOfPlayer(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_player_stat.html', result.rawHtmlStat);
				fs.writeFileSync('football_player_info.html', result.rawHtmlInfo);
				// console.log('rawHtmlStat=', result.rawHtmlStat);
			}

			RedisService.set(key, result, TTL_LONG);

			return callback(null, result);
		});
	})
}

const timelineOfMatch = (options, callback) => {
	let key = `ggsport:timelineOfMatch:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		football.timelineOfMatch(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_timeline_of_match.html', result.rawHtml);
				// console.log('rawHtmlStat=', result.rawHtmlStat);
			}

			RedisService.set(key, result, TTL_TIMELINE);

			return callback(null, result);
		});
	})
}

const lineupsOfMatch = (options, callback) => {
	let key = `ggsport:lineupsOfMatch:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		football.lineupsOfMatch(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_lineups_of_match.html', result.rawHtml);
				// console.log('rawHtmlStat=', result.rawHtmlStat);
			}

			RedisService.set(key, result, TTL_LINEUPS);

			return callback(null, result);
		});
	})
}

const statsOfMatch = (options, callback) => {
	let key = `ggsport:statsOfMatch:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, parseCache(value));
		}

		football.statsOfMatch(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_stats_of_match.html', result.rawHtml);
			}

			RedisService.set(key, result, TTL_STATSMATCH);

			return callback(null, result);
		});
	})
}

const newsOfMatch = (options, callback) => {
	let key = `ggsport:newsOfMatch:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, parseCache(value));
		}

		football.newsOfMatch(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_news_of_match.html', result.rawHtml);
			}

			RedisService.set(key, result, TTL_NEWSMATCH);

			return callback(null, result);
		});
	})
}

const layoutHeaderOfMatch = (options, callback) => {
	let key = `ggsport:layoutHeaderOfMatch:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, parseCache(value));
		}

		football.layoutHeaderOfMatch(options, (err, result) => {
			if (err) return callback(err);

			if (NODE_ENV !== 'production') {
				fs.writeFileSync('football_layoutheader_of_match.html', result.rawHtml);
			}

			RedisService.set(key, result, TTL_LAYOUTHEADERMATCH);

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
	matchOfLeague,
	statOfPlayer,
	timelineOfMatch,
	lineupsOfMatch,
	statsOfMatch,
	newsOfMatch,
	layoutHeaderOfMatch,
}