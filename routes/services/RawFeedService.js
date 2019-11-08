const NODE_ENV = process.env.NODE_ENV || 'development';

const request = require('request');
const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const minify = require('html-minifier').minify;

const debug = require('debug')('RawFeedService');

const utils = require('../../helpers/utils');

RawFeed = {};
module.exports = RawFeed;

RawFeed.getHtmlContent = (link, callback) => {
	request({
		url: link,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback(err);

		const $ = cheerio.load(body);

    // let content = $('article.content_detail');
    let content = $('#left > main > div > section > article');

    // remove class and inline style
    $('*', content).each(function () {
			$(this).removeAttr('class');
			$(this).removeAttr('style');
			$(this).removeAttr('href');
			$(this).removeAttr('onlick');
		});

    let contentStr = $(content).html();

    // content = entities.decode(content);
    contentStr = minify(contentStr, {
      // removeAttributeQuotes: true,
      removeComments: true,
      decodeEntities: true
    });

    contentStr = contentStr.replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\s\s/g, ' ');

    console.log(contentStr);

		return callback(null, contentStr);
	});
}