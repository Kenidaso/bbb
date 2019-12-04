const NODE_ENV = process.env.NODE_ENV || 'development';
const request = require('request');
const sizeOf = require('image-size');
const url = require('url');

module.exports = {
	errorObj: (errorCode, codeDebug = 'EUNKNOWN', data = {}, message = '', statusCode = 400) => {
		return { errorCode, message, data, statusCode, codeDebug };
	},

	safeParse: (input) => {
		try {
			if (typeof input === 'object') return input;
			return JSON.parse(input);
		} catch (err) {
			return null;
		}
	},

	normalizeText: (text = '') => {
		let result = text.replace(/\s\s/g, ' ').trim();
		return result;
	},

	randInt: (min, max) => {
		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	upsertSafe: (List, find, update, callback) => {
		console.log(`[upsertSafe] find= ${JSON.stringify(find)}`);
		console.log(`[upsertSafe] update= ${JSON.stringify(update)}`);

		List.model.findOne(find, (err, result) => {
			if (err) {
				console.log('upsertSafe err=', err);
				return callback(err);
			}

			if (result) {
				if (update.metadata) {
					result.metadata = result.metadata || {};
					result.metadata = Object.assign({}, result.metadata, update.metadata);
					delete update.metadata;
				}

				result = Object.assign(result, update);

				return result.save((err) => {
					if (err) return callback(err);
					return callback(err, result);
				});
			}

			let newObj = new List.model(update);

			// console.log('upsertSafe newObj=', newObj);

			return newObj.save((err) => {
				if (err) return callback(err);
				return callback(err, newObj);
			});
		});
	},

	to: (promise) => {
		return promise
			.then(data => {
				return [null, data];
			})
			.catch(err => [err]);
	},

	sendMessage: (message) => {
		if (NODE_ENV !== 'production') {
			return;
		}

		let bot_token = '926051369:AAEWO57QlmvfHpySz07DSXPMSlf7kQiD4M4';
		let website = 'https://api.telegram.org/bot' + bot_token;
		let data = {
			chat_id: '-373758728',
			parse_mode: 'markdown',
			text: `WORKER:BAOMOI - ENV: *${NODE_ENV}* - ${message}`,
		};
		let link = website + '/sendmessage';
		request({
			uri: link,
			method: 'POST',
			form: data,
		},
			function (error, response, body) {
				if (error) {
					// console.log((error.message));
				} else {
					// console.log(response);
				}
			}
		);
	},

	getSizeImage: (urlImage, callback) => {
		request({
			url: urlImage,
			method: 'GET',
			encoding: null,
		}, (err, response, body) => {
			if (err) return callback(err);
			if (!body) return callback(null, null);

			return callback(null, sizeOf(body));
		})
	},

	tldsInVn: [ // top level domain
		'org.vn',
		'net.vn',
		'biz.vn',
		'edu.vn',
		'gov.vn',
		'int.vn',
		'ac.vn',
		'pro.vn',
		'info.vn',
		'health.vn',
		'name.vn',
		'com.vn',
		'com',
		'vn',
		'org'
	],

	getMainDomain: (link) => {
		const parse = url.parse(link);
		let { host } = parse;

		if (!host) return null;

		// find tlds
		let tld = null;
		for (let i in module.exports.tldsInVn) {
			let t = module.exports.tldsInVn[i];

			if (host.endsWith(`.${t}`)) {
				tld = t;
				host = host.replace(`.${t}`, '');
				break;
			}
		}

		let split = host.split('.');
		host = split[split.length - 1];

		if (tld) host += `.${tld}`;

		return host;
	}
};
