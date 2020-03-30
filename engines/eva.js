const NAME = 'eva';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');

const base = require('./base');
const utils = require('../helpers/utils');

const URL_HOMEPAGE = 'https://eva.vn';

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

let extractArticle = ($, article) => {
	let a = $('a', article);

	let title = $('h4', article).text();
	title = utils.normalizeText(title);

	if (!title || title.length == 0) {
	  title = $(a[0], article).text();
	  title = utils.normalizeText(title);
	}

	if (!title || title.length == 0) {
		title = $('img', article).attr('alt');
		title = utils.normalizeText(title);
	}

	let link = $(a[0], article).attr('href');

	if (!utils.validURL(link)) {
	  link = URL_HOMEPAGE + link;
	}

	let description = $('span', article).text();
	description = utils.normalizeText(description);

	let srcImg = $('img', article).attr('src');
	if (!utils.validURL(srcImg)) {
		srcImg = $('img', article).attr('data-original');
	}

	let time = $('.time', article);
	let publishDate = null;

	if (time) {
		publishDate = $(time).attr('title');
		if (publishDate && publishDate.length > 0) publishDate += '+07:00';
	}

	if (!utils.validURL(link)) return null;
	if (!title || title.length == 0) return null;

  let objFeed = {
  	title,
  	link,
  }

  if (description) objFeed.description = description;
  if (publishDate) objFeed.publishDate = publishDate;
  if (srcImg) {
  	objFeed.heroImage = {
  		url: srcImg
  	}
  }

  return objFeed;
}

engine.homepageByRss = (callback) => {
	let linkRss = 'https://eva.vn/rss/rss.php';
  base.getNewsFromRss(linkRss, (err, feeds) => {
    if (err || !feeds) return callback(null, []);

    feeds = feeds.map((f) => {
      f.publishDate = moment(new Date(f.pubDate)).format();

      if (f.pubDate) delete f.pubDate;
      if (f.guid) delete f.guid;
      if (f['atom:link']) delete f['atom:link'];

      return f;
    })

    return callback(err, feeds);
  })
}

engine.homepageByHtml = (callback) => {
	base.fetch(URL_HOMEPAGE, (err, html) => {
	  if (err || !html) return callback(null, []);

	  let feeds = [];
	  let STORE = {};

	  let $ = cheerio.load(html);

	  let _eachArticle = (articles) => {
	    _.forEach(articles, (article) => {
	      let objFeed = extractArticle($, article);

	      if (!objFeed) return;

	      if (!STORE[objFeed.link]) {
	        feeds.push(objFeed);
	        STORE[objFeed.link] = true;
	      }
	    })
	  }

	  let selectors = [
	  	'article'
	  ];

	  for (let i in selectors) {
	  	let selector = selectors[i];
	  	let articles = $(selector);

		  _eachArticle(articles);
	  }

	  debug('feeds.length=', feeds.length);

	  return callback(err, feeds);
	})
}

engine.homepage = (callback) => {
	async.parallel({
		by_rss: engine.homepageByRss,
		by_html: engine.homepageByHtml,
	}, (err, result) => {
		if (err) return callback(null, []);

		let feeds = [...result.by_html];
		let rsses = result.by_rss;

		let diff = _.differenceBy(rsses, feeds, 'link');
		feeds = [...feeds, ...diff];

		_.forEach(feeds, (feed) => {
			let findIndexRss = _.findIndex(rsses, function (o) { return o.link == feed.link; });

			if (findIndexRss > -1) {
				feed = Object.assign({}, feed, rsses[findIndexRss]);
			}
		})

		return callback(null, feeds);
	})
}

engine.hotnews = (callback) => {
  engine.homepage((err, news) => {
    // news = news.slice(0, 30);
    return callback(null, news);
  });
}
