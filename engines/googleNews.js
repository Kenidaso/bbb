const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const parse = require('feed-reader').parse;

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const request = require('request').defaults({
	headers: {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36',
		'Upgrade-Insecure-Requests': 1,
		'Sec-Fetch-Mode': 'navigate',
		'Sec-Fetch-User': '?1'
	}
});

// https://news.google.com/search?q=vu%2039%20nguoi%20chet%20trong%20container&hl=vi&gl=VN&ceid=VN%3Avi
const BASE_URL = 'https://news.google.com/search';

// https://news.google.com/rss/search?pz=1&cf=all&q=liverpool%20vs%20tottenham&hl=vi&gl=VN&ceid=VN:vi

const getLinkRedirect = (articleLink, callback) => {
	request({
		url: articleLink,
		method: 'GET'
	}, (err, response, body) => {
		if (err || !body) return callback(null, null);

		try {
			let $ = cheerio.load(body);
			let redirectLink = $('c-wiz > div > div > c-wiz > div > a').text();
			return callback(null, redirectLink);
		} catch (ex) {
			console.log('getLinkRedirect ex=', ex.toString());
			return callback(null, null);
		}
	})
}

const _parse_gg_news = ($, isGetOriginLink = false, callback) => {
	const cards = $('main > c-wiz > div:nth-child(1) > div');

	let result = [];

	async.eachLimit(cards, 2, (card, cbCard) => {
		const articles = $('article', card);

		let objCard = {
			articles: []
		}

		async.eachLimit(articles, 2, (article, cbArticle) => {
			let title = $('h3', article).text().trim();
			let link = $('h3 a', article).attr('href');
			let description = $($('div span', article)[0]).text();

			if (!title || title.length == 0) {
				title = $('h4', article).text().trim();
				link = $('h4 a', article).attr('href');
			}

			link = 'https://news.google.com' + link.substr(1);

			let publishDate = $('time', article).attr('datetime');
			let paper = $('div > div > a', article).text();

			let objArticle = {
				title,
				description,
				publishDate,
				linkArticle: link,
				paper
			}

			if (!isGetOriginLink) {
				objCard.articles.push(objArticle);
				return cbArticle();
			}

			getLinkRedirect(link, (err, originLink) => {
				objArticle.originLink = originLink;
				objCard.articles.push(objArticle);
				return cbArticle()
			});
		}, (err) => {
			let srcImg = $($('img', card)[0]).attr('src');
			let linkOverView = $($('div > div > span > div > a', card)[0]).attr('href');
			if (linkOverView && linkOverView.length > 0) {
				linkOverView = 'https://news.google.com' + linkOverView.substr(1);
			}

			objCard.srcImg = srcImg;
			objCard.linkOverView = linkOverView;

			result.push(objCard);

			return cbCard();
		})
	}, (err) => {
		return callback(err, result);
	})
}

const search = (searchString, callback) => {
	// let query = encodeURIComponent(searchString);
	request({
		url: `${BASE_URL}`,
		method: 'GET',
		qs: {
			q: searchString,
			hl: 'vi',
			gl: 'VN',
			ceid: 'VN%3Avi'
		}
	}, (err, response, body) => {
		if (err) return callback(err);
		if (!body) return callback('ERESPONSENOBODY');

		const $ = cheerio.load(body);

		_parse_gg_news($, false, (err, content) => {
			return callback(err, content);
		});
	})
}

const defaultOpts = {
	hl: 'vi',
	language: 'vi',
	gl: 'VN',
	region: 'VN',
	ceid: 'VN:vi'
}

const getEntriesFromRss = (keyword, options = {}, callback) => {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}

	let { hl, gl, ceid, language, region } = options;
	hl = hl || language || defaultOpts.hl;
	gl = gl || region || defaultOpts.gl;
	ceid = ceid || `${gl}:${hl}`;

	keyword = encodeURIComponent(keyword);
	let urlRss = `https://news.google.com/rss/search?pz=1&cf=all&q=${keyword}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

	console.log('urlRss=', urlRss);

	parse(urlRss)
		.then((feed) => {
		  if (!feed || !feed.entries || feed.entries.length == 0) return callback(null, []);

		  let entries = feed.entries;
		  entries = entries.map((entry) => {
		  	let $ = cheerio.load(entry.content);
		  	entry.content = $(entry.content).text().trim();
		  	if (entry.contentSnippet) entry.contentSnippet = entities.decode(entry.contentSnippet);
		  	return entry;
		  })

		  return callback(null, entries);
		})
		.catch((err) => {
		  return callback(err);
		});
}

module.exports = {
	search,
	getLinkRedirect,
	getEntriesFromRss,
}