const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const fs = require('fs');
const path = require('path');

const fetchHtml = require('./fetchHtml');
const Utils = require('../helpers/utils');
const base = require('./base');
const clipper = require('./webClipper');

const mainContentSelector = ".article";
const removeSelectors = [
	'.article__meta a:nth-child(3)',
  ".source",
  "#follow-pub",
  ".sourceLink",
  "[id*=\"Ads\"]",
  ".article__tag",
  ".bm-source",
  "[class*=\"ads\"]",
  '.article__action',
  '[class*="social"]',
]
const HOST_NAME = 'baomoi';
const customClass = [];
const optSanitizeHtml = {};


const _parseContent = ($, objHtml) => {
	let description = $('.article .article__sapo').text();

	let children = $('.article .article__body').contents();

	let contentOrder = children.map(function () {

		if (this.attribs && this.attribs.class === 'body-text') {
			return {
				type: 'text',
				text: $(this).text().trim(),
			};
		}

		if (this.attribs && this.attribs.class === 'body-image') {
			let img = $('img', this);
			let em = $('em', this.next);
			return {
				type: 'image',
				src: $(img).attr('src'),
				description: $(em).text(),
			};
		}
		if (this.attribs && this.attribs.class === 'body-video') {
			let video = $('video', this);
			return {
				type: 'video',
				src: $(video).find('source').attr('data-src') ? $(video).find('source').attr('data-src') : '',
			};
		}
	}).get();

	let images = contentOrder.filter(content => {
		if (content.type === 'image') {
			let copyContent = Object.assign({}, content);
			delete copyContent.type;
			return copyContent;
		}
	});

	let videos = contentOrder.filter(content => {
		if (content.type === 'video') {
			let copyContentVideo = Object.assign({}, content);
			delete copyContentVideo.type;
			return copyContentVideo;
		}
	});

	let rawHtml = '';
	if (objHtml && objHtml.host && objHtml.host.metadata && objHtml.host.metadata.mainArticle) {
		rawHtml = $(objHtml.host.metadata.mainArticle).html();
	}

	let result = {
		description,
		contentOrder,
		images,
		videos,
		rawHtml,
	};

	return result;
};

const getContent = (objHtml = {}) => {
	return new Promise(async (resolve, reject) => {
		if (!objHtml || !objHtml.linkBaoMoi) {
			return reject('EHTMLNOLINK');
		};
		let [err, $] = await Utils.to(fetchHtml({ link: objHtml.linkBaoMoi }));

		if (err) return reject(err);

		const content = _parseContent($, objHtml);

		objHtml._content = content;

		return resolve(objHtml);
	});
};

const validateFeeds = (feeds) => {
	if (!feeds) return false;

	if (feeds && feeds.length === 0) {
		return false;
	}

	return true;
};

const getLinkReal = (linkRealRedirect) => {
	return new Promise(async (resolve, reject) => {
		try {
			let [err, $] = await Utils.to(fetchHtml({ link: linkRealRedirect }));
			if (err) {
				return reject(err);
			}
			const regex = /.*?window\.location\.replace\("(http.*?)"\).*/g;
			const linkReal = $('script')[2].children[0].data.replace(/\s/g, '').replace(regex, `$1`);
			return resolve(linkReal);
		} catch (error) {
			console.log('TCL: getLinkReal -> error', error);
			return reject(error);
		}
	});
};

const getNewsFromHtml = (htmlUrl, mainSelector) => {
	console.log('TCL: getNewsFromHtml -> htmlUrl', htmlUrl);
	return new Promise(async (resolve, reject) => {
		console.log('fetching html ...');
		const feeds = [];
		let [err, $] = await Utils.to(fetchHtml({ link: htmlUrl }));
		if (err) {
			return reject(err);
		}
		const data = $(mainSelector).find('.story');
		data.each(function (i, item) {
			if (!item.attribs.class.includes('is-pr')) {
				const objFeed = {};
				const selector = $(this).find('.story__link');
				objFeed.linkBaoMoi = 'https://baomoi.com' + selector.attr('href');
				objFeed.linkReal = objFeed.linkBaoMoi.replace('/c/', '/r/');
				objFeed.title = selector.find('.story__heading').text();
				objFeed.source = selector.find('.story__meta').find('span').text();
				objFeed.publishTime = selector.find('.story__meta').find('time').attr('datetime');
				objFeed.imgSource = selector.find('.story__thumb').find('img').attr('data-src');
				objFeed.description = selector.find('.story__summary').text().replace(/(\r\n|\n|\r)/gm, '').trim();
				feeds.push(objFeed);
			}
		});
		const isValid = validateFeeds(feeds);
		if (!isValid) return reject('ENOITEMINHTML');
		for (const item of feeds) {
			let [err, result] = await Utils.to(getLinkReal(item.linkReal));
			if (err) {
				item.linkReal = '';
			}
			item.linkReal = result;
		}
		return resolve(feeds);
	});
};

const cleanSpecial = ($, content) => {
	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${HOST_NAME}.html`), $(content).html());
	}

	// clear trash
	for (let i in removeSelectors) {
		let selector = removeSelectors[i];
		$(selector).remove();
	}

	// remove class and inline style
	$('*', content).each(function () {
	  $(this).removeAttr('class');
	  $(this).removeAttr('style');
	  $(this).removeAttr('href');
	  $(this).removeAttr('onclick');
	  $(this).remove('script');
	  $(this).remove('noscript');
	});
}

const _parseFeed = ($) => {
	let stories = $('.story');
	let result = [];

	_.forEach(stories, (story) => {
		let linkBaoMoi = $('.story__link', story).attr('href');
		linkBaoMoi = 'https://m.baomoi.com' + linkBaoMoi;

		let title = $('.story__heading', story).text();
		let srcHeroImage = $('img', story).attr('data-src');
		let publishDate = $('time', story).attr('datetime');
		let description = $('.story__summary', story).text();
		description = Utils.normalizeText(description);

		result.push({
			linkBaoMoi,
			title,
			heroImage: {
				url: srcHeroImage
			},
			publishDate,
			description
		});
	})

	return result;
	// https://m.baomoi.com/so-tien-thuong-ky-luc-tuyen-nu-viet-nam-duoc-nhan-sau-khi-gianh-hcv-sea-games-30/r/33341815.epi
	// text.match(/window\.location\.replace\(\"http.*\"\)/)
}

const getOriginLink = (html) => {
	let $ = cheerio.load(html);
	return $('.original__link').attr('href');
}

const parseRawHtml = (html, link) => {
	let $ = cheerio.load(html);
	let content = $(mainContentSelector);

  cleanSpecial($, content);

  let contentStr = $(content).html();

  contentStr = clipper.removeAttributes(contentStr);
  contentStr = clipper.removeSocialElements(contentStr);
  contentStr = clipper.removeNavigationalElements(contentStr, link);
  contentStr = clipper.removeEmptyElements(contentStr);
  contentStr = clipper.removeNewline(contentStr);
  contentStr = clipper.sanitizeHtml(contentStr, optSanitizeHtml || {});

  contentStr = clipper.getBody(contentStr);
  contentStr = clipper.minifyHtml(contentStr);
  contentStr = clipper.decodeEntities(contentStr);

  let classStr = [];
  classStr.push(`host-${HOST_NAME}`);
  classStr = [...classStr, ...customClass];

  contentStr = clipper.wrapWithSpecialClasses(contentStr, classStr);

  let result = {
    rawHtml: contentStr,
  }

  return result;
}

const getFeedFromCategoryUrl = (categoryUrl, callback) => {
	base.fetch(categoryUrl, (err, html) => {
		if (err) return callback(err);

		let $ = cheerio.load(html);
		let feeds = _parseFeed($);

		/*
		{
		  "linkBaoMoi": "https://m.baomoi.com/fox-sports-noi-gi-truoc-luot-binh-chon-khung-cho-sieu-pham-cau-vong-trong-tuyet-cua-quang-hai/c/33344199.epi",
		  "title": "Fox Sports nói gì trước lượt bình chọn khủng cho siêu phẩm 'Cầu vồng trong tuyết' của Quang Hải?",
		  "heroImage": {
		    "url": "https://photo-1-baomoi.zadn.vn/w500_r1x2m/2019_12_17_541_33344199/527d9d856ac5839bdad4.jpg"
		  },
		  "publishDate": "2019-12-17T14:41:00.000+07:00",
		  "description": "Tờ Fox Sports, báo Châu Á nổi tiếng về thể thao bất ngờ trước lượt bình chọn như vũ bão của người hâm mộ Việt..."
		},
		*/
		async.mapLimit(feeds, 5, (feed, cbMap) => {
			base.fetch(feed.linkBaoMoi, (err, body) => {
				if (err) return cbMap(null, feed);

				let parseResult = parseRawHtml(body, feed.linkBaoMoi);

				feed.link = getOriginLink(body);
				feed.rawHtml = parseResult.rawHtml;

				return cbMap(null, feed);
			});
		}, (err, result) => {
			return callback(null, result);
		})
	})
}

module.exports = {
	getNewsFromHtml,
	getContent,
	getFeedFromCategoryUrl,
	cleanSpecial,
};
