const NAME = 'cafef';
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

const URL_HOMEPAGE = 'https://cafef.vn';

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

let scaleRatio = (srcImg, ratio) => {
  let wxh = srcImg.match(/\d{1,3}x\d{1,3}/);

  if (!wxh || wxh.length == 0) return srcImg;

  wxh = wxh[0]

  let w = wxh.split('_')[0];
  let h = wxh.split('_')[1];

  w = Number(w);
  h = Number(h);

  if (!w || !h) return srcImg;

  w *= ratio;
  h *= ratio;

  return scaleHardWidthHeight(srcImg, w, h);
}

let scaleHardWidthHeight = (srcImg, width, height) => {
  let wxh = srcImg.match(/\d{1,3}_\d{1,3}/);

  if (!wxh || wxh.length == 0) return srcImg;

  wxh = wxh[0];

  let w = wxh.split('_')[0];
  let h = wxh.split('_')[1];

  w = Number(w);
  h = Number(h);

  if (!w || !h) return srcImg;

  if (w > h) {
    srcImg = srcImg.replace(wxh, `600_400`);
  } else {
    srcImg = srcImg.replace(wxh, `400_600`);
  }

  return srcImg;
}

let scaleImage = (srcImg, width, height) => {
  if (!width && !height) return srcImg;
  if (!srcImg) return srcImg;

  if (!height) return scaleRatio(srcImg, width);

  return scaleHardWidthHeight(srcImg, width, height);
}

let extractArticle = ($, article) => {
	let a = $('a', article);

	let title = $('h2', article).text();
	title = utils.normalizeText(title);

	if (!title || title.length == 0) {
		title = $('img', article).attr('alt');
		title = utils.normalizeText(title);
	}

	if (!title || title.length == 0) {
	  title = $(a[0], article).text();
	  title = utils.normalizeText(title);
	}

	let link = $(a[0], article).attr('href');

	if (!utils.validURL(link)) {
	  link = URL_HOMEPAGE + link;
	}

	let description = $('.sapo', article).text();
	description = utils.normalizeText(description);

	let srcImg = $('img', article).attr('src');
	srcImg = scaleImage(srcImg, 600, 400);

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
	let linkRss = 'https://cafef.vn/trang-chu.rss';
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
	  	'.top_noibat_row1',
	  	'.top_noibat_row2 li',
	  	'.home-box-magazine-news',
	  	'.box-nha-dau-tu-content li',
	  	'.listchungkhoannew li',
	  	'.chuyengia_bg',
	  	'.list-kdsdsk li',
	  	'.news-list li',
	  	'#loadDataBoxSPNB li',
	  	'#loadDataBoxAdm li',
	  	'.chuyenmuc li',
	  	'.CauChuyenThuongHieuul li',
	  	'#loadDataThongCao li',
	  ];

	  for (let i in selectors) {
	  	let selector = selectors[i];
	  	let articles = $(selector);
	  	// debug(`${selector}: length= ${articles.length}`);
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

		// feeds = _.uniqBy(feeds, 'link');

		return callback(null, feeds);
	})
}

engine.hotnews = (callback) => {
  engine.homepage((err, news) => {
    // news = news.slice(0, 30);
    return callback(null, news);
  });
}
