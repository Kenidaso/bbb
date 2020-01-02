// {"mainContentSelector": ".container .sidebar_1"}
const NODE_ENV = process.env.NODE_ENV || 'development';

const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const async = require('async');

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
  },
  gzip: true,
  rejectUnauthorized: false,
  timeout: 30e3
});

const UA_MOBILE = 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Mobile Safari/537.36';

const minify = require('html-minifier').minify;

const { JSDOM } = require('jsdom');
const Readability = require('@web-clipper/readability');

const clipper = require('./webClipper');
const utils = require('../helpers/utils');

const defaultSanitizeHtml = () => {
  return {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'header', 'article', 'section', 'footer', 'figure', 'video', 'amp-img', 'source' ]),
    allowedAttributes: {
      a: [ 'href', 'name' ],
      img: [ 'src', 'alt' ],
      video: [ 'src' ],
      source: [ 'src', 'type' ],
    },
  }
}

const proxies = [
  'http://atadi:v1etjetl@b0ngh0@l@1@fptapp.atadi.xyz:1201'
];

let base = {};
module.exports = base;

let _listHostUseUAMobile = [
  'm.vietnamfinance.vn',
  'm.baomoi.com'
];

let _ignoreGzip = [
  'vietbao.com',
  'nguoivietphone.com',
  'khoahocphattrien.vn'
]

let _useProxy = [
  'rfi.fr'
]

base.fetch = (link, callback) => {
  debug('base fetch link= %s', link);

  link = encodeURI(link);
  link = link.replace(/ufffd/g, '');

  let options = {
    url: link,
    method: 'GET'
  }

  for (let i in _ignoreGzip) {
    if (link.indexOf(_ignoreGzip[i]) > -1) {
      options['gzip'] = false

      break;
    }
  }

  for (let i in _useProxy) {
    if (link.indexOf(_useProxy[i]) > -1) {
      let use_proxy = _.sample(proxies);
      options['proxy'] = use_proxy;

      break;
    }
  }

  for (let i in _listHostUseUAMobile) {
    let _host = _listHostUseUAMobile[i]
    if (link.indexOf(_host) > -1) {
      options['headers'] = {
        'user-agent': UA_MOBILE
      }

      break;
    }
  }

  // console.log('fetch options=', JSON.stringify(options));

  request(options, (err, response, body) => {
    if (err) return callback('EFETCHLINK', err);
    if (!body) return callback('EFETCHNOBODY');

    if (body && body.toLowerCase().indexOf(`you don't have permission to access`) > -1) {
      return callback('ENOTPERMISSIONTOACCESS', body);
    }

    return callback(null, body);
  })
}

base.getRawContent = (link, hostInfo = {}, engine = {}, callback) => {
  if (NODE_ENV !== 'production') debug('hostInfo= %o', hostInfo);

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

  config.mainContentSelector = hostInfo.mainContentSelector || config.mainContentSelector;
  config.removeSelectors = config.removeSelectors || [];

  if (hostInfo && hostInfo.name) NAME = hostInfo.name;

  fetchEngine(link, (err, html) => {
    if (err) return callback('EFETCHLINK', err);

    let $ = cheerio.load(html);

    debug('host %s : mainContentSelector= %s', hostInfo.website, config.mainContentSelector);

    let description = clipper.getDescription(html).trim();

    if (!description || description.length == 0) {
      description = $('[property="og:description"]').attr('content');
    }

    let heroImageSelector = `${config.mainContentSelector} img`;
    let content = $(config.mainContentSelector);

    if ((!content || content.length == 0) && hostInfo.fallbackMainContent && hostInfo.fallbackMainContent.length > 0) {
      debug('use mainContentSelector not found content, using fallbackMainContent ...');

      for (let i=0; i < hostInfo.fallbackMainContent.length; i++) {
        let selector = hostInfo.fallbackMainContent[i];
        content = $(selector);

        if (content && content.length !== 0) {
          debug('found main content, use selector %s', selector);
          heroImageSelector = `${selector} img`;
          break;
        }
      }
    }

    if (!content || content.length == 0) {
      let extractor = clipper.extract(html, link);

      if (extractor && extractor.content) {
        if (NODE_ENV !== 'production') debug('content= %s', extractor.content);

        return callback(null, {
          ...extractor,
          rawHtml: extractor.content
        });
      }
    }

    if (!content || content.length == 0) {
      fatal('Can not parse link %s, please check', link);
      return callback(null, null);
    }

    $('script', content).remove();
    $('noscript', content).remove();

    if (NODE_ENV !== 'production') {
      fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
    }

    if (engine.cleanSpecial) {
      debug('go cleanSpecial ...');
      engine.cleanSpecial($, content);
    }

    // get hero Image
    let heroImage = clipper.getHeroImage(html);
    let imgs = $('img', content);

    if (!heroImage && imgs && imgs.length > 0) {
      debug('---> get hero image ...');
      heroImage = $(imgs[0]).attr('src');
    }

    // remove in config metadata
    for (let i=0; i < config.removeSelectors.length; i++) {
      let selector = config.removeSelectors[i];
      $(selector, content).remove();
      debug('remove selector %s', selector);
    }

    // remove in setup model
    if (hostInfo.removeSelectors) {
      for (let i=0; i < hostInfo.removeSelectors.length; i++) {
        let selector = hostInfo.removeSelectors[i];
        $(selector, content).remove();
        debug('remove selector %s', selector);
      }
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

    if (contentStr == null || contentStr == 'null' || contentStr.length == 0) {
      fatal('Can not parse link %s, please check', link);
      return callback(null, null);
    }

    if (hostInfo.name != 'baomoi') {
      contentStr = clipper.removeAttributes(contentStr);
      contentStr = clipper.removeSocialElements(contentStr);
      contentStr = clipper.removeNavigationalElements(contentStr, link);
      contentStr = clipper.removeEmptyElements(contentStr);
      contentStr = clipper.removeNewline(contentStr);
      contentStr = clipper.sanitizeHtml(contentStr, engine.optSanitizeHtml || defaultSanitizeHtml);
    }

    contentStr = clipper.getBody(contentStr);
    contentStr = clipper.minifyHtml(contentStr);
    contentStr = clipper.decodeEntities(contentStr);

    if (contentStr == null || contentStr == 'null' || contentStr.length == 0) {
      fatal('Can not clean after parsing link %s, please check', link);
      return callback(null, null);
    }

    let classStr = [];
    if (hostInfo && hostInfo.name) {
      classStr.push(`host-${hostInfo.name}`);
    }

    if (hostInfo && hostInfo.customClass && hostInfo.customClass.length > 0) {
      classStr = [...classStr, ...hostInfo.customClass];
    }

    contentStr = clipper.wrapWithSpecialClasses(contentStr, classStr);

    if (NODE_ENV !== 'production') {
      debug('content= %s', contentStr);
      fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), contentStr);
    }

    let result = {
      rawHtml: contentStr,
      heroImage,
      description
    }

    return callback(null, result);
  })
}

let clean = (content) => {
  content = entities.decode(content);

  let $ = cheerio.load(content);

  // remove class and inline style
  $('*').each(function () {
    $(this).removeAttr('class');
    $(this).removeAttr('style');
    $(this).removeAttr('href');
    $(this).removeAttr('onclick');
    $(this).remove('script');
  });

  let contentStr = $.html();
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
  let optSanitize = Object.assign({}, defaultSanitizeHtml());
  contentStr = sanitizeHtml(contentStr, optSanitize);

  return contentStr;
}

base.userArticleParse = (link, callback) => {
  base.fetch(link, (err, html) => {
    if (err) {
      debug('fetch link %s err= %s result= %s', link, err, html);
      return callback('EFETCHLINK', err);
    }
    if (!html) {
      debug('can not get html from link %s', link);
      return callback('EFETCHHTMLNOTFOUND');
    }

    let extractor = clipper.extract(html, link);

    if (extractor && extractor.content) {
      if (NODE_ENV !== 'production') debug('content= %s', extractor.content);

      return callback(null, {
        ...extractor,
        rawHtml: extractor.content
      });
    }

    return callback(null, null);
  })
}

base.grabArticle = (link, hostInfo = {}, engine = {}, callback) => {
  if (NODE_ENV !== 'production') debug('hostInfo= %o', hostInfo);

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

  config.mainContentSelector = hostInfo.mainContentSelector || config.mainContentSelector;
  config.removeSelectors = config.removeSelectors || hostInfo.removeSelectors || [];

  if (hostInfo && hostInfo.name) NAME = hostInfo.name;

  fetchEngine(link, (err, html) => {
    if (err) return callback(err);

    let domain = utils.getMainDomain(link);

    let extract = clipper.extract(html, link);

    debug('extract= %s', JSON.stringify(extract));

    return callback(null, 'HIHIHIHIHI');
  })
}








































