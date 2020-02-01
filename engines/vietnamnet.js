const NAME = 'vietnamnet';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);

const fs = require('fs');
const path = require('path');
const async = require('async');

const base = require('./base');
const fetchRss = require('./fetchRss');
const utils = require('../helpers/utils');

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
              item: result.channel[0].vnn[0].item
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
          item['rawHtml'] = item['content:encoded'];

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
