const NAME = 'vietnamnet';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);

const fs = require('fs');
const path = require('path');
const async = require('async');
const cheerio = require('cheerio');
const _ = require('lodash');
const moment = require('moment');

const base = require('./base');
const fetchRss = require('./fetchRss');
const utils = require('../helpers/utils');

const URL_HOMEPAGE = 'https://vietnamnet.vn';

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

engine.getNewsFromRss = (rssUrl, callback) => {
  let task = (cb) => {
    console.log(`[${NAME}] fetching rss ... ${rssUrl}`);

    fetchRss({
      link: rssUrl
    }, (err, result) => {
      if (err) return cb(err);

      if (result && result.vnn) {
        result = result.vnn;
        let _rss = utils.clone(result.rss);

        if (_rss && Array.isArray(_rss)) {
          _rss = _rss[0];
          result.rss = {};

          if (_rss.channel && _rss.channel[0] && _rss.channel[0].vnn && _rss.channel[0].vnn[0] && _rss.channel[0].vnn[0].item) {
            result.rss['channel'] = [];
            result.rss.channel.push({
              item: _rss.channel[0].vnn[0].item
            })
          }
        }
      }

      let isValid = base.validateRssResult(result);

      if (!isValid) return cb('ENOITEMINRSS');

      let items = result.rss.channel[0].item;
      items = items.map((item) => {
        for (let key in item) {
          let value = item[key][0];
          if (value && key == 'description') {
            try {
              let $ = cheerio.load(item[key][0]);
              value = $(value).text().trim();
            } catch {

            }
          }

          item[key] = value;

          if (item['content:encoded']) {
            let raw = item['content:encoded'];

            item['rawHtml'] = `<div class='host-vietnamnet _wrap'>${raw}</div>`;
          }

          if (item['pubDate']) {
            item['publishDate'] = moment(new Date(item['pubDate'])).format();
          }

          if (item['media:content']) {
          	let media = item['media:content'];
          	if (media['$'] && media['$']['url']) {
          		item['image'] = media['$'];
          	}
          }
        }

        return item;
      });

      return cb(null, items);
    });
  }

  async.retry({
    times: 1,
    interval: 5e3
  }, task, callback);
}

engine.cleanSpecial = ($, content) => {
	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
	}

	// clear trash
	$('.VnnAdsPos', content).remove();
	$('#shareBoxTop', content).remove();
	$('.article-relate', content).remove();
}

let scaleRatio = (srcImg, ratio) => {
  let wxh = srcImg.match(/\d{1,3}x\d{1,3}/);

  if (!wxh || wxh.length == 0) return srcImg;

  wxh = wxh[0]

  let w = wxh.split('x')[0];
  let h = wxh.split('x')[1];

  w = Number(w);
  h = Number(h);

  if (!w || !h) return srcImg;

  w *= ratio;
  h *= ratio;

  srcImg = srcImg.replace(wxh, `${w}x${h}`);

  return srcImg;
}

let scaleHardWidthHeight = (srcImg, width, height) => {
  let wxh = srcImg.match(/\d{1,3}x\d{1,3}/);

  if (!wxh || wxh.length == 0) return srcImg;

  wxh = wxh[0]

  srcImg = srcImg.replace(wxh, `${width}x${height}`);

  return srcImg;
}

let scaleImage = (srcImg, width, height) => {
  if (!width && !height) return srcImg;

  if (!height) return scaleRatio(srcImg, width);

  return scaleHardWidthHeight(srcImg, width, height);
}

engine.homepageByHtml = (callback) => {
  base.fetch(URL_HOMEPAGE, (err, html) => {
    if (err || !html) return callback();

    let feeds = [];
    let STORE = {};

    let $ = cheerio.load(html);
    let articles = $('a.thumb');

    _.forEach(articles, (article) => {
      let title = $('img', article).attr('alt');

      let link = $('a', article).attr('href');

      if (!utils.validURL(link)) {
        link = URL_HOMEPAGE + link;
      }

      if (link.indexOf('?') > -1) link = link.substr(0, link.indexOf('?'));

      if (!utils.validURL(link)) return;
      if (!title || title.length == 0) return;

      let srcImg = $('img', article).attr('src');

      if (!utils.validURL(srcImg)) {
        srcImg = $('img', article).attr('data-src');
      }

      srcImg = scaleImage(srcImg, 600, 400);

      feeds.push({
        link,
        heroImage: {
          url: srcImg
        },
        title,
      });

      STORE[link] = true;
    })

    articles = $('a[class*="articletype"]');
    _.forEach(articles, (article) => {
      let title = $('img', article).attr('alt');

      let link = $(article).attr('href');

      if (!utils.validURL(link)) {
        link = URL_HOMEPAGE + link;
      }

      if (link.indexOf('?') > -1) link = link.substr(0, link.indexOf('?'));

      if (!utils.validURL(link)) return;
      if (!title || title.length == 0) return;
      if (STORE[link]) return;

      feeds.push({
        link,
        title,
      });

      STORE[link] = true;
    })

    return callback(err, feeds);
  })
}

engine.homepage = (callback) => {
  let rssUrl = 'https://vietnamnet.vn/rss/tin-moi-nong.rss';
  engine.getNewsFromRss(rssUrl, (err, feeds) => {
    if (err) return callback();

    feeds = feeds.map((f) => {
      if (f.guid) delete f.guid;
      if (f.pubDate) {
        f.publishDate = moment(new Date(f.pubDate)).format();
        delete f.pubDate;
      }
      if (f.category) delete f.category;
      if (f['content:encoded']) delete f['content:encoded'];
      if (f['media:content']) delete f['media:content'];
      if (f['rawHtml']) delete f['rawHtml'];
      if (f['image']) {
        f.heroImage = {
          url: f.image.url
        }

        delete f['image'];
      }

      return f;
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
