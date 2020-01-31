const NAME = 'vietstock';

const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const fetchRss = require('./fetchRss');
const utils = require('../helpers/utils');

const validateRssResult = (result) => {
  if (!result) return false;

  let { rss } = result;
  if (!rss) return false;

  let { channel } = rss;
  if (!channel || channel.length == 0) return false;

  channel = channel[0];

  let { item } = channel;
  if (!item || item.length == 0) return false;

  return true;
}

const getNewsFromRss = (rssUrl, callback) => {
  let task = (cb) => {
    console.log(`[${NAME}] fetching rss ${rssUrl} ...`);

    fetchRss({
      link: rssUrl
    }, (err, result) => {
      if (err) return cb(err);

      let isValid = validateRssResult(result);

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

          if (value && key === 'a10:link') {
            value = value['$']['href'];
          }

          item[key] = value;
        }

        return item;
      });

      return cb(null, items);
    });
  }

  async.retry({
    times: 2,
    interval: 5e3
  }, task, callback);
}

const cleanSpecial = ($, content) => {
  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
  }


  // if (process.env.NODE_ENV !== 'production') {
  //   fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), $(content).html());
  // }
}

module.exports = {
  getNewsFromRss,
  cleanSpecial,
}