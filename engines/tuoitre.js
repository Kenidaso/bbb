const NAME = 'tuoitre';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);

const fs = require('fs');
const path = require('path');
const moment = require('moment');

const base = require('./base');
const utils = require('../helpers/utils');

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

engine.cleanSpecial = ($, content) => {
	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
	}

	// clear trash
	$('.networktop', content).remove();
	$('.relate-container', content).remove();
	$('[type="RelatedOneNews"]', content).remove();
	$('#tagandnetwork', content).remove();
}

engine.homepage = (callback) => {
	let linkRss = 'https://tuoitre.vn/rss/tin-moi-nhat.rss';
  base.getNewsFromRss(linkRss, (err, feeds) => {
    if (err || !feeds) return callback();

    feeds = feeds.map((f) => {
      f.pubishDate = moment(new Date(f.pubDate)).format();

      delete f.pubDate;
      if (f.guid) delete f.guid;

      return f;
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