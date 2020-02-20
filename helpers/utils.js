const NODE_ENV = process.env.NODE_ENV || 'development';
const request = require('request');
const sizeOf = require('image-size');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { ImgPublic } = require('cky-image-public');
const shortID = require('short-id-gen');
const unidecode = require('unidecode');

const imgPub = new ImgPublic({
	imgur: true
});

const noop = () => {}

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

				// for (let k in update) {
				// 	let items = update[k];
				// 	console.log('k=', k, 'items=', items);

				// 	if (Array.isArray(items)) {
				// 		result[k] = result[k] || [];

				// 		for (let i in items) {
				// 			if (result[k].indexOf(items[i].toString()) < 0) {
				// 				console.log('k=', k, 'items[i]=', items[i].toString());
				// 				result[k] = result[k].concat(items[i].toString());
				// 			}
				// 		}

				// 		delete update[k];
				// 	}
				// }

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

	upsertSafe_v2: (List, find, update, callback) => {
		console.log(`[upsertSafe_v2] update= ${JSON.stringify(update)}`);
		const Model = List.model;

		if (!update || !update['$set']) return callback('EINVALIDUPDATE');

		Model.findOne(find, (err, result) => {
			if (err) {
				console.log('upsertSafe_v2 err=', err);
				return callback(err);
			}

			if (result) {
				update['$inc'] = update['$inc'] || {};
				update['$inc']['__v'] = 1;

				let opts = {
					new: true
				}

				return Model.findOneAndUpdate({
					_id: result._id
				}, update, opts, callback);
			}

			let _update = update['$set'];
			if (update['$addToSet']) {
				let set = update['$addToSet'];
				/*
				"category": {
				    "$each": [
				        "5db1e80887a90f0caed1c699"
				    ]
				}
				*/
				for (let field in set) {
					if (typeof set[field] === 'object') {
						if (set[field]['$each']) _update[field] = set[field]['$each'];
					} else {
						_update[field] = set[field];
					}
				}
			}

			let newObj = new Model(_update);

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
			'hanoimoi.com.vn',
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
	},

	scaleImageGg: (srcImg, ratio = 1) => {
		if (!srcImg) return srcImg;

		let heightStr = srcImg.match(/h\d{2,4}/);
		heightStr = heightStr && heightStr[0] ? heightStr[0] : null;

		let widthStr = srcImg.match(/w\d{2,4}/);
		widthStr = widthStr && widthStr[0] ? widthStr[0] : null;

		if (!heightStr || !widthStr) return srcImg;

		let height = Number(heightStr.replace('h', ''));
		let width = Number(widthStr.replace('w', ''));

		if (!height || !width) return srcImg;

		height *= ratio;
		width *= ratio;

		srcImg = srcImg.replace(`${heightStr}`, `h${height}`);
		srcImg = srcImg.replace(`${widthStr}`, `w${width}`);

		return srcImg;
	},

	buildTaskKey: (taskName='', id) => {
		id = id || shortID.generate(16);
		let _key = `${taskName && taskName.length > 0 ? taskName.toUpperCase() + '_' : ''}${id}`;
		return _key;
	},

	sendMessageTelegram: (message, callback = noop) => {
		request({
			url: `${process.env.API_URL}/tele/send-to-group`,
			method: 'POST',
			json: true,
			body: {
				message
			}
		}, (err, response, body) => {
			return callback && callback(err);
		})
	},

	restartDyno: (app, dyno, callback = noop) => {
		request({
			url: `${process.env.API_URL}/heroku/restart`,
			method: 'POST',
			json: true,
			body: {
				app,
				dyno
			}
		}, (err, response, body) => {
			return callback && callback(err);
		})
	},

	normalizeSearch: (search = '') => {
		if (!search) return search;

		search = search.toLowerCase().trim();
		search = unidecode(search);

		return search;
	}
};
