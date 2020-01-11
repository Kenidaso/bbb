const NODE_ENV = process.env.NODE_ENV || 'development';

const async = require('async');
const _ = require('lodash');

const engine = require('../../engines/google');
const trends = require('../../engines/googleTrends');

const utils = require('../../helpers/utils');

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

module.exports = {
	autocomplete,
	autocompleteMerge
}