const NAME = 'msn';
const NODE_ENV = process.env.NODE_ENV || 'development';

const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);

const fs = require('fs');
const path = require('path');
const async = require('async');
const cheerio = require('cheerio');
const url = require('url');
const querystring = require('querystring');
const Entities = require('html-entities').AllHtmlEntities;
const moment = require('moment');
moment.locale('vi');

const base = require('./base');
const fetchRss = require('./fetchRss');
const utils = require('../helpers/utils');
const clipper = require('./webClipper');

const entities = new Entities();

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

let mainContentSelector = 'body';
let removeSelectors = [
  '.head',
  '.paddle',
  '.xnetvidplayer',
  '.megamenu',
  '.non-empty-ad',
  '.stb-flexhorizontal',
  '.readmore',
  '.stb-flexvertical',
  '.vl_disclosure',
  '#coachmark',
  '.hidden',
  '#aside',
  '.normalsection',
  '#prefooter',
  '#sticky-footer',
  '.fbpopup-container',
  '#feedback-flyout',
  'iframe',
  '#fb-root',
];

let _scaleImage = (srcImg, width = 600) => {
  if (!srcImg) return srcImg;

  let parseUrl = url.parse(srcImg);
  let parseQs = querystring.parse(parseUrl.query);

  let ratio = 1;
  if (parseQs.w) {
    ratio = width / parseQs.w;
  }

  if (parseQs.w) parseQs.w *= ratio;
  if (parseQs.h) parseQs.h *= ratio;

  let result = `${parseUrl.protocol}//${parseUrl.host}${parseUrl.pathname}?${querystring.stringify(parseQs)}`;

  return result;
}

engine.scaleImage = _scaleImage;

let _parse = (html, linkArticle) => {
  let $ = cheerio.load(html);

  let applicationName = $('meta[name="application-name"]').attr('content');
  let title = $('title').text().trim();
  let description = $('meta[name="description"]').attr('content');
  if (!description || description.length == 0) $('[property="og:description"]').attr('content');

  let originLink = $('[rel="canonical"]').attr('href');
  let publishDate = $('time').attr('datetime');

  $('time').text(moment(publishDate).utcOffset(420).format('dddd DD/MM/YYYY HH:mm'));

  let content = $(mainContentSelector);

  $('script', content).remove();
  $('noscript', content).remove();

  // remove in config removeSelectors
  for (let i=0; i < removeSelectors.length; i++) {
    let selector = removeSelectors[i];
    $(selector, content).remove();
    debug('remove selector %s', selector);
  }

  $('img', content).each(function () {
    let dataSrc = $(this).attr('data-src');
    dataSrc = utils.safeParse(dataSrc);

    if (dataSrc) {
      if (dataSrc.default && dataSrc.default.src) $(this).attr('src', dataSrc.default.src);
      $(this).removeAttr('data-src');
    }
  });

  if (NODE_ENV !== 'production') {
    fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), $(content).html());
  }

  // remove class and inline style
  $('*', content).each(function () {
    $(this).removeAttr('class');
    $(this).removeAttr('style');
    $(this).removeAttr('href');
    $(this).removeAttr('onclick');
    $(this).remove('script');
  });

  let contentStr = $(content).html();

  contentStr = clipper.removeAttributes(contentStr);
  contentStr = clipper.removeSocialElements(contentStr);
  contentStr = clipper.removeNavigationalElements(contentStr, linkArticle);
  contentStr = clipper.removeEmptyElements(contentStr);
  contentStr = clipper.removeNewline(contentStr);
  contentStr = clipper.sanitizeHtml(contentStr);

  contentStr = clipper.getBody(contentStr);
  contentStr = clipper.minifyHtml(contentStr);
  contentStr = clipper.decodeEntities(contentStr);

  let classStr = [
    `host-${NAME}`
  ];

  contentStr = clipper.wrapWithSpecialClasses(contentStr, classStr);

  let result = {
    title,
    description,
    publishDate,
    originLink,
    rawHtml: contentStr
  }

  return result;
}

engine.getNewsFromRss = (rssUrl, callback) => {
  let task = (cb) => {
    console.log(`[${NAME}] fetching rss ... ${rssUrl}`);

    fetchRss({
      link: rssUrl
    }, (err, result) => {
      if (err) return cb(err);

      let isValid = base.validateRssResult(result);

      if (!isValid) return cb('ENOITEMINRSS');

      let items = result.rss.channel[0].item;
      items = items.map((item) => {
        for (let key in item) {
          let value = item[key][0];

          switch (key) {
            case 'description':
              try {
                let valueDecode = entities.decode(value);
                // console.log('valueDecode=', valueDecode);

                let description = valueDecode.substr(valueDecode.indexOf('/>') + 2);
                let $ = cheerio.load(valueDecode);
                let srcImg = $('img').attr('src');

                item['description'] = description;
                item['image'] = _scaleImage(srcImg, 600);;

              } catch (ex) {
                console.log('ex=', ex);
              }
              break
            case 'link':
              let parseUrl = url.parse(value);
              let parseQs = querystring.parse(parseUrl.query);

              if (parseQs.srcref) delete parseQs.srcref;

              let _link = `${parseUrl.protocol}//${parseUrl.host}${parseUrl.pathname}?${querystring.stringify(parseQs)}`;
              item['link'] = _link;

              break;
            default:
              item[key] = value;
          }
        }

        return item;
      });

      if (NODE_ENV != 'production') items = items.slice(0, 1);

      async.mapLimit(items, 1, (item, cbMap) => {
        base.fetch(item.link, (err, html) => {
          if (err) return cbMap(null, item);

          let parser = _parse(html, item.link);
          let { rawHtml, publishDate, description, originLink } = parser;

          item['rawHtml'] = rawHtml;
          item['publishDate'] = publishDate;
          item['description'] = description;

          item['articleLink'] = item.link;
          item['link'] = originLink;

          return cbMap(null, item);
        })
      }, (err, results) => {
        return cb(null, results);
      });
    });
  }

  async.retry({
    times: 1,
    interval: 5e3
  }, task, callback);
}

engine.cleanSpecial = ($, content) => {

}
