const fetchHtml = require('./fetchHtml');
const Utils = require('../helpers/utils');

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

module.exports = {
	getNewsFromHtml,
	getContent,
};
