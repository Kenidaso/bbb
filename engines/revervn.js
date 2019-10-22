// crawl https://rever.vn

const request = require('request').defaults({
	headers: {
		'User-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
	}
});

const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');

let _parseList = ($) => {
	let result = [];
	let listView = $('.result-body .listView');

	_.forEach(listView, (view) => {
		let coverImgSrc = $('img', view).attr('src');
		let infoContainer = $('.info-container h3 a', view);

		let title = $(infoContainer).text().trim();
		let urlDetail = $(infoContainer).attr('href');
		urlDetail = 'https://rever.vn' + urlDetail;

		if (!title || title.length == 0) return;

		let obj = {
			coverImgSrc,
			title,
			urlDetail,
		}

		result.push(obj);
	});

	return result;
}

let _nomalText = (text) => {
	if (!text) return text;

	try {
		return text.trim().replace(/\n|\t/g, ' ');
	} catch (ex) {
		return '';
	}
}

let _parseDetail = ($) => {
	let detail = {};

	let imgs = $('.flex-viewport ul.slideimg li img');

	let imgSrcs = _.reduce(imgs, (res, img) => {
		let src = $(img).attr('src');
		res.push(src);
		return res;
	}, []);

	let address_text = _nomalText($('.address').text());
	let address = _nomalText(address_text.split(',')[0]);
	let ward = _nomalText(address_text.split(',')[1]);
	let district = _nomalText(address_text.split(',')[2]);

	let detailRoom = $('.detailroom li');

	// let bedroom = _nomalText($(detailRoom[0]).text());
	// let bathroom = _nomalText($(detailRoom[1]).text());
	// let direction = _nomalText($(detailRoom[2]).text());
	// let area = _nomalText($(detailRoom[3]).text());
	// area = area.replace('m²', '').trim();

	// let price = _nomalText($(detailRoom[4]).text());
	// price = price.replace('$', '').trim();

	let bedroom = null;
	let bathroom = null;
	let area = null;
	let price = null;
	let direction = null;

	_.forEach(detailRoom, (li) => {
		let title = $(li).attr('title').trim();
		let text = $(li).text().trim();
		text = _nomalText(text);

		if (title.toLowerCase() == 'phòng ngủ') {
			if (!Number.isNaN(Number(text))) bedroom = Number(text);
		}

		if (title.toLowerCase() == 'phòng tắm') {
			if (!Number.isNaN(Number(text))) bathroom = Number(text);
		}

		if (title.toLowerCase() == 'diện tích') {
			area = text.replace('m²', '').trim();
			area = _nomalText(area);
			if (!Number.isNaN(Number(area))) area = Number(area);
		}

		if (title.toLowerCase() == 'giá') {
			price = text.replace('$', '').trim();
			price = _nomalText(price);
			if (!Number.isNaN(Number(price))) price = Number(price);
		}

		if (title.toLowerCase() == 'hướng nhà') {
			direction = _nomalText(text);
		}
	});

	let overview = _nomalText($('.summary').text());

	let basicInfors = $('#sticky > section > div.left-content > div:nth-child(5) > ul li');
	let basicInformation = _.reduce(basicInfors, (res, m) => {
		let left = $('.left', m).text();
		let right = $('.right', m).text();

		res.push([left, right]);
		return res;
	}, []);

	let detailsFurniture = $('#details-furniture li');
	let furnitures = _.reduce(detailsFurniture, (res, f) => {
		let left = $('.left', f).text();
		res.push(left);
		return res;
	}, []);

	let detailsAmenities = $('#details-amenities li');
	let amenities = _.reduce(detailsAmenities, (res, a) => {
		let left = $('.left', a).text();
		res.push(left);
		return res;
	}, []);

	let listAdvantage = $('.list-advantage');
	let advantages = _.reduce(listAdvantage, (res, advantage) => {
		let left = _nomalText($('.advantage-name', advantage).text());
		let right = $('.advandate-content', advantage).text();

		if (left.toLowerCase() == 'tag') {
			right = right.replace(/\n\n/g, '');
			right = right.split('\n');
		} else {
			right = _nomalText(right);
		}

		res.push([left, right]);
		return res;
	}, []);

	let urlGoogleMap = $('.img-map').attr('style');
	// background-image: url(https://maps.googleapis.com/maps/api/staticmap?center=10.801678670347226,106.6891916202378&zoom=15&size=1140x640&maptype=roadmap&markers=color:red%7C10.801678670347226,106.6891916202378&key=AIzaSyB_J7TCgptlDrvjaFaHrayYb1C2F8ZaeBg)
	urlGoogleMap = urlGoogleMap.replace('background-image: url(', '').replace(')', '');

	detail = {
		imgSrcs,
		address: {
			fullAddress: address_text,
			address,
			ward,
			district,
		},

		detailRoom: {
			bedroom,
			bathroom,
			direction,
			area,
			price
		},

		overview,
		basicInformation,
		furnitures,
		amenities,
		advantages,
		urlGoogleMap,
	}

	return detail;
}

let rever = {};
module.exports = rever;

rever.getList_DatNen = (url_get, callback) => {
	request({
		url: url_get,
		method: 'GET',
		headers: {
			authority: 'rever.vn',
			'upgrade-insecure-requests': 1,
			'sec-fetch-mode': 'navigate',
			'sec-fetch-user': '?1',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
			'sec-fetch-site': 'none',
			'accept-language': 'en-US,en;q=0.9'
		}
	}, (err, response, body) => {
		if (err) return callback(err);
		if (!body) return callback('ENOBODY');

		let $ = cheerio.load(body);

		let result = _parseList($);
		let finalResult = [];

		async.eachLimit(result, 1, (res, cbEach) => {
			console.log(`get detail url= ${res.urlDetail} ...`);
			rever.getDetail(res.urlDetail, (err, detail) => {
				res.detail = detail;
				finalResult.push(res);

				return cbEach(null);
			});
		}, (err) => {
			return callback(err, finalResult);
		});
	});
}

rever.getDetail = (urlDetail, callback) => {
	request({
		url: urlDetail,
		method: 'GET',
		headers: {
			authority: 'rever.vn',
			'cache-control': 'max-age=0',
			'upgrade-insecure-requests': 1,
			'sec-fetch-mode': 'navigate',
			'sec-fetch-user': '?1',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
			'sec-fetch-site': 'none',
			referer: 'https://rever.vn/s/ho-chi-minh/mua/dat-nen',
			'accept-language': 'en-US,en;q=0.9'
		}
	}, (err, response, body) => {
		if (err) return callback(err);
		if (!body) return callback('ENOBODY');

		let $ = cheerio.load(body);

		let detail = _parseDetail($);

		return callback(null, detail);
	});
}

rever.getPropertiesViaApi = (params = {}, callback) => {
	let page = 1;
	let results = [];
	let _finalResult = [];

	let callApi = (page, cb) => {
		console.log(`get page ${page} ...`);

		let opts = {
			url: `https://rever.vn/s-ajax/${params.districtStr}/mua`,
			method: 'POST',
			headers: {
				'sec-fetch-mode': 'cors',
				origin: 'https://rever.vn',
				'accept-language': 'en-US,en;q=0.9',
				'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
				'content-type': 'application/json;charset=UTF-8',
				accept: 'application/json, text/plain, */*',
				referer: 'https://rever.vn/s/Quan-2/mua/can-ho',
				authority: 'rever.vn',
				'sec-fetch-site': 'same-origin'
			},
			json: true,
			body: {"boundaries":[]},
			qs: {
				page,
				size: 20,
				sorts: '4,6,7',
				precision: 6,
				property_type: 'a',
				loadAjax: 'false',
				type: 'property',

				bounds: params.bounds
			}
		};

		let _getDetail = (datas, cbDetail) => {
			let _total = datas.length;
			let _count = 0;

			async.eachLimit(datas, 10, (data, cbEach) => {
				_count++;
				console.log(`[${_count}/${_total}] get detail page:`, data.url, '...');

				rever.getDetail(data.url, (err, detail) => {
					if (detail) data._detail_page = detail;
					_finalResult.push(data);
					return cbEach(null);
				});
			}, (err) => {
				return cbDetail(null, _finalResult);
			});
		}

		let done = () => {
			return _getDetail(results, callback);
		};

		request(opts, (err, response, body) => {
			if (err) return callback(err);

			let data = body.data;
			if (!data) {
				return done();
				// return callback(null, results);
			}

			let properties = data.properties;
			if (!properties) {
				return done();
				// return callback(null, results);
			}

			data = properties.data;
			if (!data | data.length == 0) {
				return done();
				// return callback(null, results);
			}

			data = data.map((d) => {
				d.url = 'https://rever.vn' + d.url;
				return d;
			});

			results = [...results, ...data];
			page++;

			return callApi(page);
		});
	}

	callApi(page);
}
