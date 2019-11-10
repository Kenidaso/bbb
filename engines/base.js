// {"mainContentSelector": ".container .sidebar_1"}
const NODE_ENV = process.env.NODE_ENV || 'development';

const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const sanitizeHtml = require('sanitize-html');

const debug = require('debug')('BaseEngine');
const fatal = require('debug')('FATAL');

const request = require('request').defaults({
  headers: {
    'cache-control': 'max-age=0',
    'upgrade-insecure-requests': 1,
    dnt: 1,
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'sec-fetch-site': 'cross-site',
    'accept-language': 'en-US,en;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,la;q=0.5',
  }
});

const minify = require('html-minifier').minify;

const defaultSanitizeHtml = () => {
  return {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'header', 'article', 'section', 'footer', 'figure' ]),
    allowedAttributes: {
      a: [ 'href', 'name' ],
      img: [ 'src', 'alt' ]
    },
  }
}

let base = {};
module.exports = base;

base.fetch = (link, callback) => {
  request({
    url: link,
    method: 'GET'
  }, (err, response, body) => {
    return callback(err, body);
  })
}

base.getRawContent = (link, hostInfo, engine = {}, callback) => {
  engine = engine || {};
  let fetchEngine = engine.fetch || base.fetch;
  let config = hostInfo.metadata;

  if (!config) return callback('ENOCONFIG');
  if (!config.mainContentSelector) return callback('ENOMAINCONTENTSELECTOR');

  fetchEngine(link, (err, html) => {
    if (err) return callback('EFETCHLINK', err);

    // debug('html= %s', html);

    const $ = cheerio.load(html);

    debug('host %s : mainContentSelector= %s', hostInfo.website, config.mainContentSelector);

    let content = $(config.mainContentSelector);

    $('script', content).remove();

    if (engine.cleanSpecial) {
      debug('go cleanSpecial ...');
      engine.cleanSpecial($, content);
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

    try {
      contentStr = minify(contentStr, {
        removeComments: true,
        decodeEntities: true
      });
    } catch (ex) {
      fatal('minify err= %s', ex.toString());
    }

    debug('sanitize html ...');
    let optSanitize = Object.assign({}, defaultSanitizeHtml(), engine.optSanitizeHtml || {});
    contentStr = sanitizeHtml(contentStr, optSanitize);

    contentStr = contentStr.replace(/\n/g, ' ').replace(/\t/g, ' ');

    while (contentStr.indexOf('  ') > -1) {
      contentStr = contentStr.replace(/\s\s/g, ' ');
    }

    contentStr = contentStr.replace(/\> \</g, '><');
    contentStr = contentStr.trim();

    if (NODE_ENV !== 'production') debug('content= %s', contentStr);

    return callback(null, contentStr);
  })
}