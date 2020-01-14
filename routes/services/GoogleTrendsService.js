const NODE_ENV = process.env.NODE_ENV || 'development';

const _ = require('lodash');

const engine = require('../../engines/googleTrends');

const RedisService = require('./RedisService');

const utils = require('../../helpers/utils');

let TTL = 60 * 60 * 24 * 7; // time to live key redis: 1 week

const cleanResultTopCharts = (topCharts) => {
	if (topCharts && topCharts.hasOwnProperty('interactive')) delete topCharts.interactive;
	if (topCharts && topCharts.hasOwnProperty('type')) delete topCharts.type;
	if (topCharts && topCharts.hasOwnProperty('title')) delete topCharts.title;
	if (topCharts && topCharts.hasOwnProperty('template')) delete topCharts.template;
	if (topCharts && topCharts.hasOwnProperty('embedTemplate')) delete topCharts.embedTemplate;
	if (topCharts && topCharts.hasOwnProperty('version')) delete topCharts.version;
	if (topCharts && topCharts.hasOwnProperty('isLong')) delete topCharts.isLong;
	if (topCharts && topCharts.hasOwnProperty('isCurated')) delete topCharts.isCurated;

	return topCharts;
}

const yearInSearch = (options = {}, callback) => {
	let key = `ggtrends:yearinsearch:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (/*NODE_ENV === 'production' && */!err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		engine.topcharts(options, (err, result) => {
			if (err) return callback(err);

			cleanResultTopCharts(result);

			if (result && result.topCharts) {
				result.topCharts = result.topCharts.map((chart) => {
					if (chart.listItems) {
						chart.listItems = chart.listItems.map((item) => {
							return item.title;
						})
					}

					cleanResultTopCharts(chart);

					return chart;
				})
			}

			let { topCharts } = result;

			if (topCharts) RedisService.set(key, topCharts, TTL);

			return callback(err, topCharts);
		})
	})
}

const autocomplete = (options = {}, callback) => {
	engine.autocomplete(options, (err, result) => {
		if (err) return callback(err);

		if (result.default && result.default.topics) return callback(err, result.default.topics);

		return callback(err, result);
	})
}

const dailytrends = (options = {}, callback) => {
	let key = `ggtrends:dailytrends:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		engine.dailytrends(options, (err, result) => {
			if (err) return callback(err);

			if (result && result.default && result.default.trendingSearchesDays) {
				let data = result.default.trendingSearchesDays;

				data = data.map((d) => {
					d.trendingSearches = d.trendingSearches.map((t) => {
						if (t.title.exploreLink) delete t.title.exploreLink;
						if (t.shareUrl) delete t.shareUrl;

						t.relatedQueries = t.relatedQueries.map((r) => {
							if (r.exploreLink) delete r.exploreLink;

							return r;
						})

						return t;
					});

					return d;
				});

				RedisService.set(key, data, 60 * 60 * 2);

				return callback(null, data);
			}

			return callback(err, result);
		})
	});
}

const realtimetrends = (options = {}, callback) => {
	let key = `ggtrends:realtimetrends:${JSON.stringify(options)}`;

	RedisService.get(key, (err, value) => {
		if (NODE_ENV === 'production' && !err && value) {
			console.log('get from cache key=', key);
			return callback(null, utils.safeParse(value));
		}

		engine.realtimetrends(options, (err, result) => {
			if (err) return callback(err);

			return callback(err, result);
		})
	});
}

module.exports = {
	yearInSearch,
	autocomplete,
	dailytrends,
	realtimetrends
}