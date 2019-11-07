const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const parse = require('feed-reader').parse;
const moment = require('moment');
const unidecode = require('unidecode');
const once = require('once')

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

const LIMIT = 2;

// https://news.google.com/search?q=vu%2039%20nguoi%20chet%20trong%20container&hl=vi&gl=VN&ceid=VN%3Avi
const BASE_URL = 'https://news.google.com/search';

const map_section_vi = {
	'bai viet hang dau': 'top coverage', // bài viết hàng đầu
	'tat ca bai viet': 'all coverage', // tất cả bài viết
	'tien trinh': 'timeline', // tiến trình
}

// https://news.google.com/rss/search?pz=1&cf=all&q=liverpool%20vs%20tottenham&hl=vi&gl=VN&ceid=VN:vi

let storeLinkRedirect = {};

const getLinkRedirect = (articleLink, callback) => {
	callback = once(callback);
	request({
		url: articleLink,
		method: 'GET'
	}, (err, response, body) => {
		if (err || !body) {
			return callback(null, null);
		}

		let $ = cheerio.load(body);
		let redirectLink = $('c-wiz > div > div > c-wiz > div > a').text();

		// console.log('---> getLinkRedirect ', articleLink, '-->', redirectLink);

		return callback(null, redirectLink);
	})
}

const _parse_gg_news = ($, isGetOriginLink = false, callback) => {
	const cards = $('main > c-wiz > div:nth-child(1) > div');

	let result = [];

	async.eachLimit(cards, LIMIT, (card, cbCard) => {
		const articles = $('article', card);

		let objCard = {
			articles: []
		}

		async.eachLimit(articles, LIMIT, (article, cbArticle) => {
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

const _parse_from_twitter = ($, section) => {
	let twitts = $('div:nth-child(2) > [data-n-ci-wu*=twitter]', section);
	let results = [];

	_.forEach(twitts, (twitt) => {
		let twittAccountImg = $('img', twitt).attr('src');
		let twittTag = $('div:nth-child(2) > div:nth-child(2) > div:nth-child(2)', twitt).text().trim();
		let twittAccountName = $('div:nth-child(2) > div:nth-child(2) > div:nth-child(1)', twitt).text().trim()
		twittAccountName = twittAccountName.replace('verified_user', '');
		let twittLink = $('a', twitt).attr('href');
		let twittContent = $('div:nth-child(3)', twitt).text().trim();
		let twittPublishDate = $('time').attr('datetime');
		twittPublishDate = moment(new Date(twittPublishDate)).format();

		let objTwitt = {
			twittAccountImg,
			twittTag,
			twittAccountName,
			twittLink,
			twittContent,
			twittPublishDate,
		}

		results.push(objTwitt);
	})

	return results;
}

const _parse_all_coverage = ($) => {
	let articles = $('c-wiz > div > div > c-wiz > div > div > div > main > c-wiz > div > div > main > div > article');
	let results = [];

	_.forEach(articles, (article) => {
		let articleTitle = $('h4 a', article).text().trim();
		let articleLink = $('h4 a', article).attr('href');
		articleLink = 'https://news.google.com' + articleLink.substr(1);

		let articleImg = $('figure img', article).attr('src');
		let articlePaperImg = $('div > img', article).attr('src');
		let articlePaperName = $('div > a', article).text().trim();
		let articlePublishDatetime = $('time', article).attr('datetime');

		let objArticle = {
			title: articleTitle,
			link: articleLink,
			image: articleImg,
			paperImg: articlePaperImg,
			paperName: articlePaperName,
			publishDate: articlePublishDatetime,
		}

		results.push(objArticle);
	})

	return results;
}

const _parse_frequently_asked_questions = ($, section) => {
	console.log('go _parse_frequently_asked_questions ...');

	let questions = $('div:nth-child(1) > div:nth-child(1)', section);

	console.log('questions length=', questions.length);

	let results = [];

	_.forEach(questions, (question) => {
		let questionTitle = $('h3', question).text().trim();
		let questionLink = $('div a', question).attr('href');
		let questionContent = $('div a', question).text().trim();

		let objQuestion = {
			questionTitle,
			questionLink,
			questionContent,
			answers: []
		}

		let answers = $('div > div > a > div:nth-child(2)', question);

		_.forEach(answers, (answer) => {
			let answerImg = $('img', answer).attr('src');
			let answerTitle = $($('div > div > div:nth-child(1)', answer)[0]).text().trim();
			let answerPaper = $($('div > div > div:nth-child(1)', answer)[1]).text().trim();
			let answerPublishDate = $('time', answer).attr('datetime');

			let objAnswer = {
				answerImg,
				answerTitle,
				answerPaper,
				answerPublishDate,
			}

			objQuestion.answers.push(objAnswer);
		})

		results.push(objQuestion);
	})

	return results;
}

const _parse_gg_news_story = ($, isGetOriginLink = false, callback) => {
	let titleStory = $('c-wiz > div > div > c-wiz > div > div > div > div > div > h2').text().trim();

	const objStory = {
		title: titleStory,
		sections: []
	}

	let sections = $('c-wiz > div > div > c-wiz > div > div > div > main > c-wiz > div > div > main > div > div');

	_.forEach(sections, (section) => {
		let sectionTitle = $('h2', section).text().trim();

		if (!sectionTitle || sectionTitle === '') return null;

		sectionTitle = sectionTitle.toLowerCase();
		sectionTitle = unidecode(sectionTitle);

		if (map_section_vi[sectionTitle]) {
			sectionTitle = map_section_vi[sectionTitle];
		}

		let objSection = {
			title: sectionTitle,
			articles: []
		};

		console.log('--> ', sectionTitle);

		let articles = $('article', section);

		if (process.env.NODE_ENV != 'production') articles = [ articles[0] ]

		_.forEach(articles, (article) => {
			let articleTitle = $('h4 a', article).text().trim();
			let articleLink = $('h4 a', article).attr('href');
			articleLink = 'https://news.google.com' + articleLink.substr(1);

			let articleImg = $('figure img', article).attr('src');
			let articlePaperImg = $('div > img', article).attr('src');
			let articlePaperName = $('div > a', article).text().trim();
			let articlePublishDatetime = $('time', article).attr('datetime');

			let objArticle = {
				title: articleTitle,
				linkArticle: articleLink,
				image: articleImg,
				paperImg: articlePaperImg,
				paperName: articlePaperName,
				publishDate: articlePublishDatetime,
			}

			if (sectionTitle.toLowerCase() === 'videos') {
				objArticle.channel = articlePaperName;
			}

			objSection.articles.push(objArticle);
		})

		if (sectionTitle.toLowerCase() === 'from twitter') {
			let twitts = _parse_from_twitter($, section);
			objSection.twitts = twitts;
		}

		if (sectionTitle.toLowerCase() === 'all coverage') {
			articles = _parse_all_coverage($);
			objSection.articles = articles;
		}

		if (sectionTitle.toLowerCase() === 'frequently asked questions') {
			articles = _parse_frequently_asked_questions($, section);
			objSection.articles = articles;
		}

		objStory.sections.push(objSection);
	})

	if (!isGetOriginLink) return callback(null, objStory);

	async.eachLimit(objStory.sections, LIMIT, (section, cbS) => {
		async.eachLimit(section.articles, LIMIT, (article, cbA) => {
			getLinkRedirect(article.link, (err, originLink) => {
				article.originLink = originLink;
				return cbA()
			});
		}, () => {
			return cbS();
		})
	}, (err, result) => {
		return callback(null, objStory);
	})
}

// get section -> feed from link Story
const getFeedFromStory = (storyUrl, callback, isGetOriginLink = false) => {
	request({
		url: storyUrl,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback(err);
		if (process.env.NODE_ENV != 'production') fs.writeFileSync(path.join(__dirname, '../data_sample/raw_ggn_story.html'), body);

		const $ = cheerio.load(body);

		_parse_gg_news_story($, isGetOriginLink, (err, content) => {
			return callback(err, content);
		});
	});
}

const _parse_gg_news_topic = ($, isGetOriginLink = false, callback) => {
	let cards = $('c-wiz > div > div > c-wiz > div > div > div > main > c-wiz > div > div > main > div > div > div');

	if (process.env.NODE_ENV != 'production') cards = [ cards[0], cards[1], cards[2] ]

	let result = [];

	_.forEach(cards, (card) => {
		let articles = $('article', card);

		let objCard = {
			articles: []
		}

		if (process.env.NODE_ENV != 'production') articles = [ articles[0] ]

		_.forEach(articles, (article) => {
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

			objCard.articles.push(objArticle);
		})

		let srcImg = $($('img', card)[0]).attr('src');
		let linkStory = $($('div > div > span > div > a', card)[0]).attr('href');
		if (linkStory && linkStory.length > 0) {
			linkStory = 'https://news.google.com' + linkStory.substr(1);
		}

		objCard.srcImg = srcImg;
		objCard.linkStory = linkStory;

		result.push(objCard);
	})

	if (!isGetOriginLink) return callback(null, result);

	async.eachLimit(result, 1, (card, cbCard) => {
		async.eachLimit(card.articles, 1, (article, cbArticle) => {
			getLinkRedirect(article.linkArticle, (err, originLink) => {
				article.originLink = originLink;
				return cbArticle()
			});
		}, cbCard)
	}, (err) => {
		console.log('_parse_gg_news_topic err=', err);

		return callback(null, result);
	})
}

// lấy danh sách feed và link story từ link Topic
const getFeedAndStoryFromTopic = (topicUrl, callback, isGetOriginLink = false) => {
	request({
		url: topicUrl,
		method: 'GET'
	}, (err, response, body) => {
		if (err) return callback(err);

		if (process.env.NODE_ENV != 'production') fs.writeFileSync(path.join(__dirname, '../data_sample/raw_ggn_topic.html'), body);
		const $ = cheerio.load(body);

		_parse_gg_news_topic($, isGetOriginLink, (err, content) => {
			return callback(err, content);
		});
	});
}

module.exports = {
	search,
	getLinkRedirect,
	getEntriesFromRss,
	getFeedFromStory,
	getFeedAndStoryFromTopic,
}