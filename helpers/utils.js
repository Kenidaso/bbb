const NODE_ENV = process.env.NODE_ENV || 'development';
const request = require('request');
const sizeOf = require('image-size');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { ImgPublic } = require('cky-image-public');

const imgPub = new ImgPublic({
	imgur: true
});

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
		result = result.replace(/\n/g, ' ');

		while (result.indexOf('  ') > -1) {
			result = result.replace(/\s\s/g, ' ');
		}

		result = result.replace(/\n/g, ' ');
		return result;
	},

	randInt: (min, max) => {
		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	upsertSafe: (List, find, update, callback) => {
		console.log(`[upsertSafe] update= ${JSON.stringify(update)}`);

		List.model.findOne(find, (err, result) => {
			if (err) {
				console.log('upsertSafe err=', err);
				return callback(err);
			}

			if (result) {
				// return callback(err, result);

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

	isNeedUpload: (urlImage) => {
		let listHost = [
			'galaxypub.vn',
			'congan.com.vn',
			'danviet.vn',
			'tapchitaichinh.vn',
			'vnmedia.vn',
			'antt.vn',
			'kinhtedothi.vn',
			'alobacsi.com',
			'antv.gov.vn',
			'netnews.vn',
			// 'vietnamfinance.vn'
		]

		for (let i in listHost) {
			if (urlImage.indexOf(listHost[i]) > -1) {
				return true;
			}
		}

		return false;
	},

	upload: (urlImage, dataImg, callback) => {
		let pathTmp = path.join(__dirname, '..', 'tmp.jpg');

		// save image
		fs.writeFileSync(pathTmp, dataImg);

		return imgPub.upload({
			filePath: pathTmp
		}, (err, result) => {
			console.log('upload result=', JSON.stringify(result));

			try { fs.unlinkSync(pathTmp); } catch {}

			if (!err && result && result.imgur && result.imgur.image_url) {
				return callback(null, result.imgur.image_url);
			}

			return callback(null, null);
		});
	},

	getSizeImage: (urlImage, callback) => {
		request({
			url: urlImage,
			method: 'GET',
			encoding: null,
			gzip: true
		}, (err, response, body) => {
			if (err) return callback(err);
			if (!body) return callback(null, null);

			let imgSize = null;
			try {
				imgSize = sizeOf(body);
			} catch (ex) {
				console.log('Image size error=', ex);
				console.log('urlImage=', urlImage);

				return callback(null, imgSize);
			}

			if (module.exports.isNeedUpload(urlImage)) {
				return module.exports.upload(urlImage, body, (err, newUrl) => {
					imgSize = imgSize = {};
					imgSize.newUrlImage = newUrl;

					return callback(null, imgSize);
				})
			}

			return callback(null, imgSize);
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
		'org',
		'net',
		'int',
		'edu',
		'gov',
		'mil',
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
	},

	reqMongo: (collection, action, query, callback) => {
		let reqUrl = `${process.env.API_URL}/acrud/${collection}/${action}`;

		request({
			url: reqUrl,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': process.env.ACRUD_APIKEY
			},
			json: true,
			body: query
		}, (err, response, body) => {
			if (err) return callback(err);

			let _body = module.exports.safeParse(body);
			if (!_body) return callback('EBODYPARSE', body);
			if (_body.err) return callback(_body);
			if (!_body.result) return callback('ENORESULT', _body);

			return callback(null, _body.result);
		})
	},

	reqUpsertFeed: (find, update, callback) => {
		if (!find || Object.keys(find).length === 0) return callback('EINVALIDFIND');
		if (!update || Object.keys(find).length === 0) return callback('EINVALIDUPDATE');

		if (!update['$set']) return callback('EUPDATESETNOTFOUND');

		let upsertUrl = `${process.env.API_URL}/feed/upsert`;

		request({
			url: upsertUrl,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// 'Authorization': process.env.ACRUD_APIKEY
			},
			json: true,
			body: {
				find,
				update
			}
		}, (err, response, body) => {
			if (err) return callback(err);

			return callback(null, module.exports.safeParse(body));
		})
	},

	clone: (obj) => {
		if (typeof obj != 'object') return null;
		return JSON.parse(JSON.stringify(obj));
	}
};
