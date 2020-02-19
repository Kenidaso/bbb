const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const parse = require('feed-reader').parse;
const moment = require('moment');
const unidecode = require('unidecode');
const once = require('once');

const url = require('url');
const querystring = require('querystring');

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

function escapeUnicode(str) {
  return str.replace(/[\u00A0-\uffff]/gu, function (c) {
    return "\\u" + ("000" + c.charCodeAt().toString(16)).slice(-4)
  });
}

const removeQs = [
	'vn_source',
	'vn_campaign',
	'vn_medium',
	'vn_term',
	'vn_thumb'
]

const cleanQueryString = (qs) => {
	let qsParsed = querystring.parse(qs);
	for (let key in qsParsed) {
		if (removeQs.indexOf(key) > -1) delete qsParsed[key];
	}

	return querystring.stringify(qsParsed);
}

const _ignoreDecode = [
	'rfi.fr',
	'voh.com.vn',
]

const _switchOffHttps = [
	'vietbao.vn',
]

const decodeLinkGgn = function (articleLink) {
	if (!articleLink || articleLink.length == 0) return null;

	const urlParsed = url.parse(articleLink);
	let pathname = urlParsed.pathname;

	let encode = pathname.substr(pathname.lastIndexOf('/') + 1);
	// let decode = atob(encode);
	encode = decodeURIComponent(encode);

	let decode = Buffer.from(encode, 'base64').toString();
	decode = decode.substr(decode.lastIndexOf('http'));
	decode = decodeURIComponent(decode);
	// decode = unidecode(decode);
	decode = decode.toString('utf8').replace('\x01', '').replace('\x00', '');
	decode = decode.replace('\u0001\u0000', '');
	decode = escapeUnicode(decode);

	if (decode[decode.length - 1] === '/') decode.substr(0, decode.length - 1);

	decode = decode.trim();

	try {
		let test = new URL(decode);
	} catch (ex) {
		return null;
	}

	let decodeParserd = url.parse(decode);
	const qs = cleanQueryString(decodeParserd.query);

	// console.log('decode=', decode);
	// console.log('decodeParserd=', JSON.stringify(decodeParserd));
	// console.log('qs=', qs);

	let finalLink = `${decodeParserd.protocol}//${decodeParserd.host}${decodeParserd.port ? ':' + decodeParserd.port : ''}${decodeParserd.pathname}`;

	if (qs && qs.length > 0) finalLink += `?${qs}`;

	if (finalLink[finalLink.length - 1] === '/') finalLink.substr(0, finalLink.length - 1);

	for (let i in _ignoreDecode) {
		if (finalLink.indexOf(_ignoreDecode[i]) > -1) {
			console.log(`[decodeLinkGgn] ignoreDecode ${_ignoreDecode[i]} ...`);
			return null;
		}
	}

	// switch https -> http
	for (let i in _switchOffHttps) {
		if (finalLink.indexOf(_switchOffHttps[i]) > -1) {
			finalLink = finalLink.replace('https', 'http');
		}
	}

	if (finalLink.indexOf('https://amp.rfi.fr') > -1) {
		finalLink = finalLink.replace('https://amp.rfi.fr', 'http://www.rfi.fr');
	}

	finalLink = finalLink.replace('/ufffd', '');
	finalLink = finalLink.replace('%5Cufffd', '');

	return finalLink;
}

const getLinkRedirect = (articleLink, callback) => {

	let decode = decodeLinkGgn(articleLink);
	if (decode && decode.length > 0) return callback(null, decode);

	let _getLink = (cb) => {
		console.log(`_getLink articleLink= ${articleLink}`);

		request({
			url: articleLink,
			method: 'GET'
		}, (err, response, body) => {
			if (err || !body) {
				return cb(null, null);
			}

			let $ = cheerio.load(body);
			let redirectLink = $('c-wiz > div > div > c-wiz > div > a').text();

			if (redirectLink) {
				redirectLink = redirectLink.replace('%E2%80%98', '');
				redirectLink = redirectLink.replace('‘', '');
				redirectLink = redirectLink.replace('/u2018', '');
			}

			return cb(null, redirectLink);
		})
	}

	async.retry({ times: 10, interval: 1000}, (cbRetry) => {
		_getLink((err, originLink) => {
			if (originLink) return cbRetry(null, originLink);

			console.log('----> retry getLinkRedirect ...');

			return cbRetry('ENOORIGINLINK');
		});
	}, (err, result) => {
		return callback(null, result);
	});
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

		_parse_gg_news($, true, (err, content) => {
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

/*
&biw=1800
&bih=888
&tbm=nws
&ei=YZDfXdyNEsnW-QbCiZiADQ
&start=20
&sa=N
&ved=0ahUKEwicwsKGyYzmAhVJa94KHcIEBtA4HhDy0wMIWQ
*/
const defaultGgSearch = {
	tbm: 'nws',
	source: 'lnt',
	tbs: 'lr:lang_1vi',
	lr: 'lang_vi',
	sa: 'X',
	biw: 1800,
	bih: 888,
	dpr: 1.6,
	start: 0
}

// search từ rss cung cấp bởi google news
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

			let link = article.link || article.linkArticle;

			getLinkRedirect(link, (err, originLink) => {
				// if (originLink)
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
	// let cards = $('div > div > main > c-wiz > div > div > main > div > div > div');

	if (!cards || cards.length == 0) {
		cards = $('div > div > main > c-wiz > div > div > main > div > div > div');
	}

	// if (process.env.NODE_ENV != 'production') cards = [ cards[0], cards[1], cards[2] ]

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

const _parse_gg_search = (body) => {
	let $ = cheerio.load(body);

	let search = $('#search');

	let div = $('div > div:nth-child(1)', search);
	div = $(div[1], search);

	let children = div.children();

	let articles = [];
	let linkStories = [];

	children.each(function (index, child) {
		let title = $('div > div h3', child).text();
		let link = $('div > div h3 a', child).attr('href')

		let description = $('div div div div:nth-child(3)', child).text();
		let publishDateText = $('div div div div:nth-child(2) span:nth-child(3)', child).text();

		let publishDate = null;

		console.log(`index= ${index} : publishDateText= ${publishDateText}`);

		if (publishDateText.indexOf('giờ trước') > -1) {
			let _tmp = publishDateText.match(/\d{1,2} giờ trước/)[0];
			let hour = Number(_tmp.match(/\d{1,2}/)[0]);
			publishDate = moment().add(hour * -1, 'h').utcOffset(420).format();
		} else if (publishDateText.indexOf('phút trước') > -1) {
			let _tmp = publishDateText.match(/\d{1,2} phút trước/)[0];
			let minute = Number(_tmp.match(/\d{1,2}/)[0]);
			publishDate = moment().add(minute * -1, 'm').utcOffset(420).format();
		} else {
			let _tmp = publishDateText.match(/\d{1,2} thg \d{1,2}, \d{4}/)[0];
			_tmp = publishDateText.replace('thg', '').replace(',', '');

			publishDate = moment(_tmp, 'DD MM YYYY')
			publishDate = publishDate.isValid() ? publishDate.utcOffset(420).format() : null;
		}

		console.log(`-> ${publishDateText} : ${publishDate}`);

		// let image = $('img', child).attr('src');

		let article = {
			title,
			link,
			description,
			publishDate,
			// image
		}

		articles.push(article);

		let cardSection = $('.card-section', child);

		if (cardSection && cardSection.length > 0) {
			let linkCard = $('.card-section > a', cardSection).attr('href');
			let titleCard = $('.card-section > a', cardSection).text();
			let descriptionCard = $('.card-section span', cardSection).text();
			let spans = $('.card-section span', cardSection);
			// let publishDateCardText = $(spans[2]).text();
			let publishDateCardText = $(spans).text();
			let publishDateCard = null;

			console.log('publishDateCardText=', publishDateCardText)

			if (publishDateCardText.indexOf('giờ trước') > -1) {
				let _tmp = publishDateCardText.match(/\d{1,2} giờ trước/)[0];
				let hour = Number(_tmp.match(/\d{1,2}/)[0]);
				publishDate = moment().add(hour * -1, 'h').utcOffset(420).format();
			} else if (publishDateCardText.indexOf('phút trước') > -1) {
				let _tmp = publishDateCardText.match(/\d{1,2} phút trước/)[0];
				let minute = Number(_tmp.match(/\d{1,2}/)[0]);
				publishDate = moment().add(minute * -1, 'm').utcOffset(420).format();
			} else {
				let _tmp = publishDateCardText.match(/\d{1,2} thg \d{1,2}, \d{4}/)[0];
				_tmp = publishDateCardText.replace('thg', '').replace(',', '');

				publishDateCard = moment(_tmp, 'DD MM YYYY')
				publishDateCard = publishDateCard.isValid() ? publishDateCard.utcOffset(420).format() : null;
			}

			console.log(`-> ${publishDateCardText} : ${publishDateCard}`);

			articles.push({
				isExtra: true,
				title: titleCard,
				link: linkCard,
				description: descriptionCard,
				publishDate: publishDateCard,
			});

			let linkStory = $('.card-section div:last-child > a', cardSection).attr('href');

			if (linkStory && linkStory.length > 0) linkStories.push(linkStory);
		}
	});

	// get query string
	let next = $('#pnnext').attr('href');

	if (next && next.length > 0) next = 'https://www.google.com' + next;

	return { articles, linkStories, next};
}

// search từ tab News của google search
const getFeedFromGgSearch = (keyword, options, callback) => {
	if (typeof options === 'function') {
		callback = options;
		options =  {};
	}

	options['maxPage'] = options['maxPage'] || 1;
	options['maxPage'] = Math.max(options['maxPage'], 0);
	options['maxPage'] = Math.min(options['maxPage'], 10);

	if (options['maxFeed']) {
		options['maxFeed'] = Number(options['maxFeed']);
		options['maxFeed'] = Math.max(options['maxFeed'], 0);
		options['maxFeed'] = Math.min(options['maxFeed'], 100);
	}

	let finalResult = {
		articles: [],
		linkStories: [],
	}

	let nextLink = null;

	let times = [...Array(options.maxPage).keys()];

	let qsNext = null;

	let _processPage = (page, cb) => {
		console.log(`--> page ${page + 1} ...`);

		if (page > 0 && !qsNext) {
			console.log('result search is max ...')
			return async.nextTick(cb);
		}

		if (options['maxFeed'] && finalResult.articles.length >= options['maxFeed']) {
			console.log('stop get feed, maxFeed=', options['maxFeed'], 'articles.length=', finalResult.articles.length);
			return async.nextTick(cb);
		}

		let qs = Object.assign({}, defaultGgSearch, options.qs);
		qs.q = qs.q || keyword;
		qs.start = page * 10;

		if (qsNext) qs = Object.assign({}, qsNext);;

		console.log('qs=', qs);

		request({
			url: `https://www.google.com/search`,
			method: 'GET',
			qs
		}, (err, response, body) => {
			if (err) return cb();

			fs.writeFileSync(path.join(__dirname, '../data_sample/google_search.html'), body, 'utf8');

			let result = _parse_gg_search(body);

			if (result.next) {
				console.log('===> next= ', result.next);

				let nextParse = url.parse(result.next);
				qsNext = querystring.parse(nextParse.query);
			} else {
				qsNext = null;
			}

			result = result || {};
			result.articles = result.articles || [];
			result.linkStories = result.linkStories || [];

			finalResult.articles = [...finalResult.articles, ...result.articles];
			finalResult.linkStories = [...finalResult.linkStories, ...result.linkStories];

			return cb();
		});
	}

	async.eachSeries(times, _processPage, (err) => {
		finalResult.articles = finalResult.articles.map((a) => {
			a.originLink = a.link;
			return a;
		})

		if (!options.getFeedFromStory) {
			_.remove(finalResult.articles, function (n) {
			  return !n.publishDate;
			});

			finalResult.articles = _.uniqBy(finalResult.articles, 'originLink');

			finalResult.articles = _.orderBy(
				finalResult.articles,
				[
					function (o) {
						return (new Date(o.publishDate).getTime());
					}
				],
				['desc']
			);

			return callback(null, finalResult);
		}

		console.log('getFeedFromStory ...');

		async.eachLimit(finalResult.linkStories, LIMIT, (linkStory, cbEach) => {
			getFeedFromStory(
				linkStory,
				(err2, feeds) => {
					if (!err2 && feeds) {
						_.forEach(feeds.sections, (section) => {
							finalResult.articles = [...finalResult.articles, ...section.articles];
						})
					}

					return cbEach();
				},
				options.isGetOriginLink
			);
		}, (err3) => {
			_.remove(finalResult.articles, function (n) {
			  return !n.publishDate || !n.originLink;
			});

			finalResult.articles = _.uniqBy(finalResult.articles, 'originLink');

			finalResult.articles = _.orderBy(
				finalResult.articles,
				[
					function (o) {
						return (new Date(o.publishDate).getTime());
					}
				],
				['desc']
			);

			return callback(null, finalResult);
		})
	})
}

module.exports = {
	decodeLinkGgn,
	search,
	getLinkRedirect,
	getEntriesFromRss,
	getFeedFromStory,
	getFeedAndStoryFromTopic,
	getFeedFromGgSearch
}