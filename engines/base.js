// {"mainContentSelector": ".container .sidebar_1"}
const NODE_ENV = process.env.NODE_ENV || 'development';

const cheerio = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
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
});

const minify = require('html-minifier').minify;

const {
  extract
} = require('article-parser');
const extractor = require('article-extractor');

const { JSDOM } = require('jsdom');
const Readability = require('@web-clipper/readability');

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
  debug('base fetch link= %s', link);

  request({
    url: link,
    method: 'GET'
  }, (err, response, body) => {
    return callback(err, body);
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

    // debug('html= %s', html);

    const $ = cheerio.load(html);

    debug('host %s : mainContentSelector= %s', hostInfo.website, config.mainContentSelector);

    let description = $('[name="description"]').attr('content');

    if (!description || description.length == 0) {
      description = $('[property="og:description"]').attr('content');
    }

    let heroImageSelector = `${config.mainContentSelector} img`;
    let content = $(config.mainContentSelector);

    if ((!content || content.length == 0) && hostInfo.fallbackMainContent) {
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
      // fatal('Can not parse link %s, please check', link);
      // return callback(null, null);

      let doc = new JSDOM(html, {
        url: link,
      });
      let reader = new Readability(doc.window.document);
      let article = reader.parse();

      content = article.content;
    }

    $('script', content).remove();

    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
    }

    if (engine.cleanSpecial) {
      debug('go cleanSpecial ...');
      engine.cleanSpecial($, content);
    }

    // get hero Image
    let heroImage = null;
    // debug('selector hero image: %s', heroImageSelector);
    let imgs = $('img', content);

    if (imgs && imgs.length > 0) {
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

    let result = {
      rawHtml: contentStr,
      heroImage,
      description
    }

    debug('result= %o', result);

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
    if (err) return callback('EFETCHLINK', err);
    if (!html) return callback('EFETCHHTMLNOTFOUND');

    let doc = new JSDOM(html, {
      url: link,
    });
    let reader = new Readability(doc.window.document);
    let article = reader.parse();

    if (article) {
      let contentStr = clean(article.content);
      article.content = entities.decode(contentStr);
      article.content = `<div class="default-auto">${article.content}</div>`;
    }

    extract(html).then((articleParse) => {
      article = Object.assign({}, articleParse, article);
      debug('article= %s', JSON.stringify(article));

      return callback(null, article);
    }).catch(ex => {
      return callback(null, article);
    })
  })
}