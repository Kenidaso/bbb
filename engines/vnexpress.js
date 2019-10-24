const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

const utils = require('../helpers/utils');

const _parseContent = ($) => {
	let pubishDate = $('.container .time').text();
	let title = $('.container .title_news_detail').text();
	title = utils.normalizeText(title);
	title = title.replace(/\n/g, '');

	let description = $('.container .sidebar_1 .description').text();
	let content = $('article.content_detail p.Normal').text();
	content = utils.normalizeText(content);

	let heroImage = null;
	let images = [];

	let imgs = $('article.content_detail img');
	_.forEach(imgs, (img) => {
		let src = utils.normalizeText($(img).attr('src'));
		let description = utils.normalizeText($(img).attr('alt'));

		images.push({
			src,
			description,
		});
	})

	let videos = [];

	let result = {
		pubishDate,
		title,
		description,
		content,
		images,
		heroImage,
		videos,
	}

	return result;
}

const getContent = (link, callback) => {
	request({
		url: link,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback('EGETLINK', err);
		if (!body) return callback('EBODYNULL');

		const $ = cheerio.load(body);
		const content = _parseContent($);

		return callback(null, content);
	});
}

module.exports = {
	getContent
}