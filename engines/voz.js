const NAME = 'voz';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);
const numeral = require('numeral');
const async = require('async');

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const url = require('url');

const ggTrans = require('./googleTranslate');
const clipper = require('./webClipper');

const { normalizeText } = require('../helpers/utils');

const BASE_URL = `https://voz.vn`;

const mapPreviews = new Map();

let engine = {};
module.exports = engine;

const defaultSanitizeHtml = () => {
  return {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'header', 'article', 'section', 'footer', 'figure', 'video', 'amp-img', 'source' ]),
    allowedAttributes: {
      a: [ 'href', 'name' ],
      img: [ 'src', 'alt' ],
      video: [ 'src' ],
      source: [ 'src', 'type' ],
      'amp-img': ['src'],
    },
  }
}

function revertLinkGgTrans(link) {
  const parser = url.parse(link);

  return `${BASE_URL}${parser.pathname}`;
}

const storeCache = (key, value) => {
  if (mapPreviews.size >= 100) {
    mapPreviews.clear();
  }

  mapPreviews.set(key, value);
}

const getPreview = (t, callback) => {
  const { link } = t.thread;
  const linkPreview = `${link}preview`;

  if (mapPreviews.has(linkPreview)) {
    const preview = mapPreviews.get(linkPreview);

    t.thread = {
      ...t.thread,
      ...preview
    }

    return callback(null, t);
  }

  ggTrans.fetch(linkPreview, (err, body) => {
    if (err) return callback(null, {});

    const $ = cheerio.load(body);
    const preview = $('.bbWrapper').text();
    const previewRawHtml = clean($, $('.bbWrapper'));

    // const trimPreview = normalizeText(preview).substr(0, 150) + ' ...';
    const trimPreview = normalizeText(preview);

    t.thread = {
      ...t.thread,
      preview: trimPreview,
      previewRawHtml
    }

    storeCache(linkPreview, {
      preview: trimPreview,
      previewRawHtml
    });

    return callback(null, t);
  })
}

const parseListThreadsInForum = ($, slug) => {
  const title = $('.p-title-value').text();
  const page = $($('.pageNav-page--current')[0]).text();
  const blockOuterMainTop = $('.block-outer-main');
  const pageNav = $('.pageNav-page:not(.pageNav-page--current):not(.pageNav-page--later):not(.pageNav-page--skipEnd)', blockOuterMainTop);
  const totalPage = $(pageNav[pageNav.length - 1]).text();

  const threads = $('.structItem--thread')
    .map((i, ele) => {
      const parent = $(ele).parent().attr('class');

      if (parent.indexOf('sticky') > -1) {
        return null;
      }

      const iconImgSrc = $('.structItem-cell--icon img', ele).attr('src');
      const iconLink = $('.structItem-cell--icon a', ele).attr('href');
      const threadTitle = $('.structItem-title', ele).text();
      const threadLink = $('.structItem-title a', ele).attr('href');
      const authorName = $('.structItem-parts li:not(.structItem-startDate)', ele).text();
      const time = $('.structItem-startDate time', ele).attr('datetime');
      const [answer, view] = $('.structItem-cell--meta dd', ele)
        .map((i, m) => normalizeText($(m).text()))
        .toArray();

      const latestTime = $('.structItem-cell--latest time', ele).attr('datetime');
      const latestAuthorLink = $('.structItem-cell--latest .structItem-minor a', ele).attr('href');
      const latestAuthorName = $('.structItem-cell--latest .structItem-minor a', ele).text();
      const lastestAuthoImg = $('.structItem-cell--iconEnd img', ele).attr('src');

      const link = revertLinkGgTrans(threadLink);
      const slug = url.parse(link).path.split('/')[2];
      const [seo, threadId] = slug.split('.');

      const threadDetail = {
        thread: {
          title: normalizeText(threadTitle),
          link,
          slug: threadId,
          author: {
            name: authorName,
            img: iconImgSrc,
            link: revertLinkGgTrans(iconLink),
          },
          time,
          meta: {
            answer: Number(answer),
            view: numeral(view.toLowerCase()).value()
          },
        },
        latest: {
          time: latestTime,
          author: {
            link: revertLinkGgTrans(latestAuthorLink),
            name: latestAuthorName,
            img: lastestAuthoImg
          }
        }
      };

      return threadDetail;
    })
    .filter(t => !!t)
    .toArray();

  const result = {
    forum: {
      slug,
      title,
      page: Number(page),
      totalPage: Number(totalPage),
    },
    threads
  }

  return result;
}

engine.getThreadsOfForum = (params, callback) => {
  const { f } = params;
  const page = Number(params.page) || 1;

  let linkForum = `${BASE_URL}/f/${f}`;

  if (page > 1) {
    linkForum = `${linkForum}/page-${page}`;
  }

  ggTrans.fetch(linkForum, (err, body) => {
    if (err) return callback(err, body);

    const $ = cheerio.load(body);

    const result = parseListThreadsInForum($, f);

    if (!result || !result.threads || !result.threads.length) {
      return result;
    }

    async.mapLimit(result.threads, 5, getPreview, (err, threads) => {
      if (err) {
        return callback(err, threads);
      }

      result.threads = threads;

      return callback(err, result);
    });
  });
}

const clean = ($, context) => {
  $('script', context).remove();
  $('noscript', context).remove();
  $('.bbCodeBlock-expandLink.js-expandLink', context).remove();

  // remove class and inline style
  $('*', context).each(function () {
    $(this).removeAttr('class');
    $(this).removeAttr('style');
    $(this).removeAttr('href');
    $(this).removeAttr('onclick');
    $(this).remove('script');
  });

  let rawHtml = $(context).html();

  rawHtml = clipper.removeAttributes(rawHtml);
  rawHtml = clipper.removeSocialElements(rawHtml);
  rawHtml = clipper.removeEmptyElements(rawHtml);
  rawHtml = clipper.removeNewline(rawHtml);
  rawHtml = clipper.sanitizeHtml(rawHtml, defaultSanitizeHtml);

  rawHtml = clipper.minifyHtml(rawHtml);
  rawHtml = clipper.decodeEntities(rawHtml);

  return rawHtml;
}

const parseThreadDetail = ($, slug) => {
  $('.p-title-value span').remove();
  const title = $('.p-title-value').text();
  const page = $($('.pageNav-page--current')[0]).text();
  const blockOuterMainTop = $('.block-outer-main');
  const totalPage = $('.pageNav li:last-child', blockOuterMainTop[0]).text();

  const articles = $('article.message')
    .map((i, ele) => {
      $('script', ele).remove();
      $('.bbCodeBlock-expandLink', ele).remove();

      const authorName = $(ele).attr('data-author');
      const authorLink = $('.message-avatar a', ele).attr('href');
      const authorImg = $('.message-avatar a img', ele).attr('src');
      const authorTitle = $('.userTitle', ele).text();

      let messageBody = $('.message-content article.message-body', ele);
      let messageContent = $(messageBody).text();
      messageContent = normalizeText(messageContent);

      const hash = $('.message-attribution-opposite li:last-child', ele).text();

      const time = $('time', ele).attr('datetime');
      const rawHtml = clean($, messageBody);

      return {
        hash: normalizeText(hash),
        time,
        author: {
          name: authorName,
          link: revertLinkGgTrans(authorLink),
          img: authorImg,
          title: authorTitle
        },
        messageContent,
        rawHtml
      };
    })
    .toArray();

  const result = {
    thread: {
      slug,
      title,
      page: Number(page),
      totalPage: Number(totalPage),
    },
    articles
  }

  return result;
}

engine.getThreadDetail = (params, callback) => {
  const { t } = params;
  const page = Number(params.page) || 1;

  let linkThread = `${BASE_URL}/t/${t}`;

  if (page > 1) {
    linkThread = `${linkThread}/page-${page}`;
  }

  ggTrans.fetch(linkThread, (err, body) => {
    if (err) return callback(err, body);

    const $ = cheerio.load(body);

    const result = parseThreadDetail($, t);

    return callback(err, result);
  });
}