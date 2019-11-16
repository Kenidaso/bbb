// {"mainContentSelector": ".container .sidebar_1"}
const NODE_ENV = process.env.NODE_ENV || 'development';

const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const path = require('path');

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
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'header', 'article', 'section', 'footer', 'figure', 'video' ]),
    allowedAttributes: {
      a: [ 'href', 'name' ],
      img: [ 'src', 'alt' ],
      video: [ 'src' ],
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

base.getRawContent = (link, hostInfo = {}, engine = {}, callback) => {
  engine = engine || {};
  hostInfo = hostInfo || {};

  let NAME = 'default';

  let fetchEngine = base.fetch;

  if (engine.fetch) {
    debug('using fetch of engine')
    fetchEngine = engine.fetch;
  }

  let config = hostInfo.metadata || {};

  debug('host config= %o', config);

  // if (!config) return callback('ENOCONFIG');
  // if (!config.mainContentSelector) return callback('ENOMAINCONTENTSELECTOR');

  config.mainContentSelector = config.mainContentSelector;
  config.removeSelectors = config.removeSelectors || [];

  if (hostInfo && hostInfo.name) NAME = hostInfo.name;

  fetchEngine(link, (err, html) => {
    if (err) return callback('EFETCHLINK', err);

    // debug('html= %s', html);

    const $ = cheerio.load(html);

    debug('host %s : mainContentSelector= %s', hostInfo.website, config.mainContentSelector);

    let content = $(config.mainContentSelector);

    $('script', content).remove();

    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
    }

    if (engine.cleanSpecial) {
      debug('go cleanSpecial ...');
      engine.cleanSpecial($, content);
    }

    for (let i=0; i < config.removeSelectors.length; i++) {
      let selector = config.removeSelectors[i];
      $(selector, content).remove();
      debug('remove selector %s', selector);
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
      contentStr = contentStr.replace(/\n/g, ' ').replace(/\t/g, ' ');

      while (contentStr.indexOf('  ') > -1) {
        contentStr = contentStr.replace(/\s\s/g, ' ');
      }

      contentStr = contentStr.replace(/\>\s\</g, '><');
      contentStr = contentStr.trim();

      contentStr = minify(contentStr, {
        removeComments: true,
        removeCommentsFromCDATA: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        removeEmptyElements: true,

        decodeEntities: true,
        collapseInlineTagWhitespace: true,

        conservativeCollapse: true,
        html5: true,
        quoteCharacter: '\'',
        removeScriptTypeAttributes: true,
        useShortDoctype: true
      });
    } catch (ex) {
      fatal('minify err= %s', ex.toString());
    }

    debug('sanitize html ...');
    let optSanitize = Object.assign({}, defaultSanitizeHtml(), engine.optSanitizeHtml || {});
    contentStr = sanitizeHtml(contentStr, optSanitize);

    if (contentStr == null || contentStr == 'null' || contentStr.length == 0) {
      fatal('Can not parse link %s, please check', link);
      return callback(null, null);
    }

    let classStr = [];
    if (hostInfo && hostInfo.name) {
      classStr.push(`host-${hostInfo.name}`);
    }

    if (hostInfo && hostInfo.customClass && hostInfo.customClass.length > 0) {
      classStr = [...classStr, ...hostInfo.customClass];
    }

    classStr = classStr.join(' ');

    contentStr = `<div class="${classStr}">${contentStr}</div>`;

    if (NODE_ENV !== 'production') {
      debug('content= %s', contentStr);
      fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), contentStr);
    }

    return callback(null, contentStr);
  })
}