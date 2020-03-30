const NAME = 'kenh14';

const sanitizeHtml = require('sanitize-html');
const debug = require('debug')('Engine:kenh14');

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');
const moment = require('moment');

const base = require('./base');
const utils = require('../helpers/utils');

const URL_HOMEPAGE = 'https://kenh14.vn';

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

  let title = $('img', article).attr('alt');
  title = utils.normalizeText(title);

  if (!title || title.length == 0) {
    title = $(a[0], article).text();
    title = utils.normalizeText(title);
  }
  if (!title || title.length == 0) {
    title = $(a[0], article).attr('title');
    title = utils.normalizeText(title);
  }

  let link = $('a', article).attr('href');

  if (!utils.validURL(link)) {
    link = URL_HOMEPAGE + link;
  }

  let srcImg = $('img', article).attr('src');

  if (!utils.validURL(srcImg)) {
    srcImg = $('img', article).attr('data-src');
  }

  srcImg = scaleImage(srcImg, 600, 400);

  let description = $('p', article).text();

  if (description && description.length > 0) description = utils.normalizeText(description);

  let video = $('video', article);
  let srcVideo = null;
  if (video) {
    if (!srcImg) {
      srcImg = $(video).attr('poster');
      if (srcImg) srcImg = srcImg.replace('.gif.png', '.gif');
    }
    srcVideo = $(video).attr('data-src');
  }

  let publishDate = null;
  let time = $('[class*="time"]', article);
  if (time) {
    publishDate = $(time).attr('title');
    if (publishDate && publishDate.length > 0) publishDate += '+07:00';
  }

  // debug(`--------------\nlink= ${link}\ntitle= ${title}\nsrcImg= ${srcImg}\ndescription= ${description}\n--------------`);

  if (!utils.validURL(link)) return null;
  if (!title || title.length == 0) return null;

  let objFeed = {
    link,
    title,
  }

  if (srcImg) {
    objFeed.heroImage = {
      url: srcImg
    }
  }
  if (description && description.length > 0) objFeed.description = description;
  if (srcVideo && srcVideo.length > 0) {
    objFeed.metadata = {
      srcVideo
    };
  }
  if (publishDate && publishDate.length > 0) objFeed.publishDate = publishDate;

  return objFeed;
}

engine.cleanSpecial = ($, content) => {
  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
  }

  // clear trash
  // $('.relationnews', content).remove();
  // $('.hiding-react-relate', content).remove();
  // $('.kbwc-socials', content).remove();
  // $('.knc-menu-nav', content).remove();
  // $('.knc-rate-link', content).remove();
  // $('.post_embed', content).remove();
  // $('.klw-nomargin', content).remove();
  // $('[type="Vote"]', content).remove();
  // $('.klcbfn-subtitle', content).remove();

  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), $(content).html());
  }
}

engine.homepageByHtml = (callback) => {
  base.fetch(URL_HOMEPAGE, (err, html) => {
    if (err || !html) return callback();

    // fs.writeFileSync('kenh14.html', html);

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

    let articles = $('[rel="wrapt-newstype"]');
    debug('wrapt-newstype length=', articles.length);
    _eachArticle(articles);

    articles = $('[class*="klwcng-left"]');
    debug('klwcng-left length=', articles.length);
    _eachArticle(articles);

    articles = $('li[class*="klwcngrn"]');
    debug('klwcngrn length=', articles.length);
    _eachArticle(articles);

    debug('homepage feeds.length=', feeds.length);

    return callback(err, feeds);
  })
}

engine.homepage = (callback) => {
  engine.homepageByHtml(callback);
}

engine.hotnews = (callback) => {
  engine.homepage((err, news) => {
    // news = news.slice(0, 30);
    return callback(null, news);
  });
}
