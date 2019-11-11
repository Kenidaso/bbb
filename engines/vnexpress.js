const NAME = 'vnexpress';

const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const fetchRss = require('./fetchRss');
const utils = require('../helpers/utils');

const _parseContent = ($, objRss) => {
  let pubishDate = $('.container .time').text();
  let title = $('.container .title_news_detail').text();
  title = utils.normalizeText(title);
  title = title.replace(/\n/g, '');

  let description = $('.container .sidebar_1 .description').text();

  // let content = $('article.content_detail p.Normal').text();
  // content = utils.normalizeText(content);

  let children = $('article.content_detail').contents();

  let contentOrder = children.map(function () {

    if (this.name === 'p') {
      return {
        type: 'text',
        text: $(this).text().trim()
      };
    }

    if (this.name === 'table') {
      let img = $('img', this);

      return {
        type: 'image',
        src: $(img).attr('src'),
        description: $(img).attr('alt')
      };
    }

  }).get();
  // console.log('contentOrder=', JSON.stringify(contentOrder));

  let heroImage = null;
  let images = [];

  let imgs = $('article.content_detail img');
  _.forEach(imgs, (img) => {
    let src = utils.normalizeText($(img).attr('src'));
    let description = utils.normalizeText($(img).attr('alt'));

    images.push({
      src,
      description,
    });
  })

  let videos = [];

  let rawHtml = '';
  if (objRss && objRss.host && objRss.host.metadata && objRss.host.metadata.mainSelector) {
    rawHtml = $(objRss.host.metadata.mainSelector).html();
  }

  let result = {
    pubishDate,
    title,
    description,
    // content,
    contentOrder,

    images,
    heroImage,
    videos,

    rawHtml
  }

  return result;
}

const getContent = (objRss = {}, callback) => {
  if (!objRss || !objRss.link) return callback('ERSSNOLINK', objRss);

  request({
    url: objRss.link,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return callback('EVNEXPRESSGETLINK', err);
    if (!body) return callback('EVNEXPRESSBODYNULL');

    const $ = cheerio.load(body);
    const content = _parseContent($, objRss);

    objRss._content = content;

    return callback(null, objRss);
  });
}

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
    console.log('fetching rss ...');

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

          item[key] = value;
        }

        return item;
      });

      return cb(null, items);
    });
  }

  async.retry({
    times: 5,
    interval: 5e3
  }, task, callback);
}

const cleanSpecial = ($, content) => {
  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
  }

  // clear trash
  $('.box_category', content).remove();
  $('#box_splienquan', content).remove();
  $('[id*="social"]', content).remove();
  $('[class*="banner"]', content).remove();
  $('#ms_topic', content).remove();
  $('.bottom_detail', content).remove();
  $('#ms_seemore', content).remove();

  let ps = $('p', content);
  let flag = false;
  for (let i = 0; i < ps.length; i++) {
    let text = $(ps[i]).text();

    if (text && text.toLowerCase().indexOf('xem thêm:') > -1) flag = true;
    if (flag) $(ps[i]).remove();
  }

  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), $(content).html());
  }
}

module.exports = {
  getContent,
  getNewsFromRss,
  cleanSpecial,
}