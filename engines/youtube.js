const NAME = 'youtube';

const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);
const numeral = require('numeral');
const async = require('async');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const url = require('url');
const request = require('request');
const _ = require('lodash');

const clipper = require('./webClipper');

const { normalizeText } = require('../helpers/utils');

const BASE_URL = `https://www.youtube.com`;
const BASE_URL_SHORT = `https://youtu.be`;

// https://www.youtube.com/feed/news_destination
// https://www.youtube.com/channel/UCYfdidRxbB8Qhf0Nx7ioOYw

const BASE_PATH_TOPSTORIES = '/feed/news_destination';
const YT_FEED_PATH = {
  topstories: `${BASE_PATH_TOPSTORIES}`,
  sports: `${BASE_PATH_TOPSTORIES}/sports`,
  entertainment: `${BASE_PATH_TOPSTORIES}/entertainment`,
  business: `${BASE_PATH_TOPSTORIES}/business`,
  technology: `${BASE_PATH_TOPSTORIES}/technology`,
  world: `${BASE_PATH_TOPSTORIES}/world`,
  national: `${BASE_PATH_TOPSTORIES}/national`,
  science: `${BASE_PATH_TOPSTORIES}/science`,
}

let engine = {};
module.exports = engine;

const extractYtInitialData = (initData) => {
  let categories = _.get(initData, 'contents.twoColumnBrowseResultsRenderer.tabs');
  categories = _.filter(categories, 'tabRenderer.selected');
  categories = _.map(categories, (s) => {
      let stories = _.get(s, 'tabRenderer.content.richGridRenderer.contents');
      const title = _.get(s, 'tabRenderer.title');

      stories = _.map(stories, (c) => {
        let videos = _.get(c, 'richSectionRenderer.content.richShelfRenderer.contents');
        const title = _.get(c, 'richSectionRenderer.content.richShelfRenderer.title.simpleText');

        videos = _.map(videos, (item) => {
          const content = _.get(item, 'richItemRenderer.content');
          const browseId = _.get(content, 'videoRenderer.ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId');
          const videoId = _.get(content, 'videoRenderer.videoId');

          const video = {
            lengthText: _.get(content, 'videoRenderer.lengthText.simpleText'),
            owner: {
              name: _.get(content, 'videoRenderer.ownerText.runs.0.text'),
              canonicalBaseUrl: _.get(content, 'videoRenderer.ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl'),
              browseId,
              url: `${BASE_URL}/channel/${browseId}`
            },
            publishedTimeText: _.get(content, 'videoRenderer.publishedTimeText.simpleText'),
            thumbnails: _.get(content, 'videoRenderer.thumbnail.thumbnails'),
            title: _.get(content, 'videoRenderer.title.runs.0.text'),
            videoId,
            viewCountText: _.get(content, 'videoRenderer.viewCountText.simpleText'),
            url: `${BASE_URL_SHORT}/${videoId}`
          }

          return video;
        })

        return { videos, title };
      })

      return { title, stories };
  });

  const [category] = categories;

  return category;
}

const _parseContent = ($) => {
  const scripts = $('script')
    .map((i, ele) => {
      return $(ele).text();
    })
    .toArray();

  const [_ytInitialData] = scripts.filter(s => s.indexOf('ytInitialData') > -1)

  eval(_ytInitialData);

  let result = null;

  if (ytInitialData) {
    result = extractYtInitialData(ytInitialData);
  }

  return result;
}

engine.news = (callback) => {
  request({
    url: `${BASE_URL}/feed/news_destination`,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return callback('EYOUTUBE', err);
    if (!body) return callback('EYOUTUBEBODYNULL');

    if (process.env.NODE_ENV != 'production') {
      fs.writeFileSync(path.join(__dirname, '../data_sample/raw_youtube_news.html'), body);
    }

    const $ = cheerio.load(body);
    const content = _parseContent($);

    return callback(null, content);
  });
}

engine.getFeeds = (category, callback) => {
  const pathFeed = YT_FEED_PATH[category];

  console.log('category=', category, pathFeed);

  if (!pathFeed) {
    return callback('EINVALIDCATEGORY', `category "${category}" not support`);
  }

  request({
    url: `${BASE_URL}${pathFeed}`,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return callback('EYOUTUBE', err);
    if (!body) return callback('EYOUTUBEBODYNULL');

    if (process.env.NODE_ENV != 'production') {
      fs.writeFileSync(path.join(__dirname, '../data_sample/raw_youtube_news.html'), body);
    }

    const $ = cheerio.load(body);
    const content = _parseContent($);

    return callback(null, content);
  });
}
