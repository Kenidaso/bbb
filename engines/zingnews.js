const NAME = 'zingnews';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');

const URL_HOMEPAGE = 'https://news.zing.vn';

const utils = require('../helpers/utils');

const request = require('request').defaults({
	headers: {
		authority: 'news.zing.vn',
		'cache-control': 'max-age=0',
		'upgrade-insecure-requests': 1,
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
		'sec-fetch-user': '?1',
		'sec-fetch-site': 'same-origin',
		'sec-fetch-mode': 'navigate',
		'accept-encoding': 'gzip, deflate, br',
		'accept-language': 'en-US,en;q=0.9',
	}
})

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

engine.fetch = (link, callback) => {
  request({
    url: link,
    method: 'GET',
    gzip: true
  }, (err, response, body) => {
    return callback(err, body);
  })
}

engine.homepage = (callback) => {
	engine.fetch(URL_HOMEPAGE, (err, html) => {
		let feeds = [];

		// fs.writeFileSync('zingnews_homepage.html', html);

		let $ = cheerio.load(html);
		let articles = $('article');
		_.forEach(articles, (article) => {
			let link = $('a', article).attr('href');
			link = URL_HOMEPAGE + link;

			let srcImg = $('img', article).attr('data-src');
			let title = $('.article-title a', article).text();
			title = utils.normalizeText(title);

			let description = $('.article-summary', article).text();
			let category = $('.category', article).text();
			let date = $('.date', article).text();
			let time = $('.time', article).text();

			let publishDate = moment(`${date} ${time}`, 'DD/MM/YYYY HH:mm').format();

			let likeCount = $('.like-count', article).text();
			likeCount = Number(likeCount) || 0;

			let dislikeCount = $('.dislike-count', article).text();
			dislikeCount = Number(dislikeCount) || 0;

			let ratingCount = $('.rating-count', article).text();
			ratingCount = Number(ratingCount) || 0;

			let viralCount = $('.viral-count', article).text();
			viralCount = Number(viralCount) || 0;

			let commentCount = $('.comment-count', article).text();
			commentCount = Number(commentCount) || 0;

			let objFeed = {
				link,
				title,
				// description,
				// publishDate,
				metadata: {
					category,
					likeCount,
					dislikeCount,
					ratingCount,
					viralCount,
					commentCount
				}
			}

			if (srcImg && utils.validURL(srcImg)) {
				objFeed.heroImage = {
					url: srcImg
				}
			}

			if (description) objFeed.description = description;
			if (publishDate) objFeed.publishDate = publishDate;

			feeds.push(objFeed);
		})

		return callback(err, feeds);
	})
}

engine.hotnews = (callback) => {
	engine.homepage((err, news) => {
	  // news = news.slice(0, 30);
	  return callback(null, news);
	});
}

engine.cleanSpecial = ($, content) => {
	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
	}

	// clear trash
	$('.the-article-category').remove();
	$('.the-article-tags').remove();
	$('#divComment').remove();
	$('.sidebar').remove();
	$('section.recommendation').remove();
}
