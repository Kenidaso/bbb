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
  trending: `/feed/trending?bp=6gQJRkVleHBsb3Jl`,
}

const YT_TYPE = {
  FEEDS: 'feed',
  EXPORE: 'explore'
}

const YT_EXPORE_QUERYSTRING = {
  now: {},
  trending: {},
  music: {
    bp: '4gINGgt5dG1hX2NoYXJ0cw%3D%3D'
  },
  gaming: {
    bp: '4gIcGhpnYW1pbmdfY29ycHVzX21vc3RfcG9wdWxhcg%3D%3D'
  },
  movies: {
    bp: '4gIKGgh0cmFpbGVycw%3D%3D'
  }
}

const QS_COUNTRY = {
  VN: {
    hl: 'vi',
    gl: 'VN',
    ceid: 'VN:vi'
  },
  US: {
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en'
  },
}

let engine = {};
module.exports = engine;

const extractVideoExplore = (item) => {
  const videoRenderer = _.get(item, 'videoRenderer');

  const browseId = _.get(videoRenderer, 'ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId');
  const videoId = _.get(videoRenderer, 'videoId');
  const videoThumbnails = _.get(videoRenderer, 'thumbnail.thumbnails');
  const lengthText = _.get(videoRenderer, 'lengthText.simpleText');
  const ownerName = _.get(videoRenderer, 'ownerText.runs.0.text');
  const canonicalBaseUrl = _.get(videoRenderer, 'ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl');
  const publishedTimeText = _.get(videoRenderer, 'publishedTimeText.simpleText');
  const viewCountText = _.get(videoRenderer, 'viewCountText.simpleText');

  const video = {
    lengthText,
    owner: {
      name: ownerName,
      canonicalBaseUrl,
      browseId,
      url: `${BASE_URL}/channel/${browseId}`
    },
    publishedTimeText,
    thumbnails: videoThumbnails,
    title: _.get(videoRenderer, 'title.runs.0.text'),
    videoId,
    viewCountText,
    url: `${BASE_URL_SHORT}/${videoId}`
  }

  return video;
}

const extractVideoFeed = (item) => {
  const videoRenderer = _.get(item, 'richItemRenderer.content.videoRenderer');

  const browseId = _.get(videoRenderer, 'ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId');
  const videoId = _.get(videoRenderer, 'videoId');
  const videoThumbnails = _.get(videoRenderer, 'thumbnail.thumbnails');
  const lengthText = _.get(videoRenderer, 'lengthText.simpleText');
  const ownerName = _.get(videoRenderer, 'ownerText.runs.0.text');
  const canonicalBaseUrl = _.get(videoRenderer, 'ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl');
  const publishedTimeText = _.get(videoRenderer, 'publishedTimeText.simpleText');
  const viewCountText = _.get(videoRenderer, 'viewCountText.simpleText');

  const video = {
    lengthText,
    owner: {
      name: ownerName,
      canonicalBaseUrl,
      browseId,
      url: `${BASE_URL}/channel/${browseId}`
    },
    publishedTimeText,
    thumbnails: videoThumbnails,
    title: _.get(videoRenderer, 'title.runs.0.text'),
    videoId,
    viewCountText,
    url: `${BASE_URL_SHORT}/${videoId}`
  }

  return video;
}

const extractYtInitialDataFeeds = (initData) => {
  const [category] = _.chain(_.get(initData, 'contents.twoColumnBrowseResultsRenderer.tabs'))
    .filter('tabRenderer.selected')
    .map(s => {
      const title = _.get(s, 'tabRenderer.title');
      let stories = _.get(s, 'tabRenderer.content.richGridRenderer.contents');

      stories = _.map(stories, (c) => {
        const sectionContent = _.get(c, 'richSectionRenderer.content.richShelfRenderer');
        const title = _.get(sectionContent, 'title.simpleText');
        let videos = _.get(sectionContent, 'contents');
        videos = _.map(videos, extractVideoFeed);

        return { videos, title };
      })

      return { title, stories };
    })
    .value()

  return category;
}

const extractYtInitialDataExplore = (initData) => {
  const [category] = _.chain(_.get(initData, 'contents.twoColumnBrowseResultsRenderer.tabs'))
    .filter('tabRenderer.selected')
    .map(s => {
      const title = _.get(s, 'tabRenderer.title');
      let stories = _.get(s, 'tabRenderer.content.sectionListRenderer.contents');

      stories = _.map(stories, (story) => {
        const sectionContent = _.get(story, 'itemSectionRenderer');
        let sections = _.get(sectionContent, 'contents');

        sections = _.map(sections, section => {
          let videos = _.get(section, 'shelfRenderer.content.expandedShelfContentsRenderer.items');
          videos = _.map(videos, extractVideoExplore);

          return { videos };
        });


        return { sections };
      })

      return { title, stories };
    })
    .value()

  return category;
}

const _parseContent = ($, type = YT_TYPE.FEEDS) => {
  const scripts = $('script')
    .map((i, ele) => $(ele).text())
    .toArray();

  const [_ytInitialData] = scripts.filter(s => s.indexOf('ytInitialData') > -1)

  // cheat/hack
  var ytInitialData = null;
  eval(_ytInitialData);

  let result = null;

  if (ytInitialData) {
    result = type === YT_TYPE.FEEDS
      ? extractYtInitialDataFeeds(ytInitialData)
      : extractYtInitialDataExplore(ytInitialData)
  }

  return result;
}

engine.exploreTrending = (explore, opts, callback) => {
  request({
    url: `${BASE_URL}/feed/trending`,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return callback('EYOUTUBE', err);
    if (!body) return callback('EYOUTUBEBODYNULL');

    if (process.env.NODE_ENV != 'production') {
      fs.writeFileSync(path.join(__dirname, '../data_sample/raw_youtube_explore.html'), body);
    }

    const $ = cheerio.load(body);
    const content = _parseContent($, YT_TYPE.EXPORE);

    return callback(null, content);
  });
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

engine.getFeeds = (category, opts, callback) => {
  const pathFeed = YT_FEED_PATH[category];

  if (!pathFeed) {
    return callback('EINVALIDCATEGORY', `category "${category}" not support`);
  }

  opts = opts || {};
  let { country } = opts;
  country = country || 'VN';

  if (country !== 'VN') {
    country = 'US';
  }

  const qs = {
    ...QS_COUNTRY[country]
  }

  request({
    url: `${BASE_URL}${pathFeed}`,
    method: 'GET',
    qs
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

engine.getExplore = (explore, opts, callback) => {
  const qsExplore = YT_EXPORE_QUERYSTRING[explore];

  if (!qsExplore) {
    return callback('EINVALIDEXPLORE', `explore "${explore}" not support`);
  }

  opts = opts || {};
  let { country } = opts;
  country = country || 'VN';

  if (country !== 'VN') {
    country = 'US';
  }

  const qs = {
    ...qsExplore,
    ...QS_COUNTRY[country]
  }

  request({
    url: `${BASE_URL}/feed/trending`,
    method: 'GET',
    qs
  }, (err, response, body) => {
    if (err) return callback('EYOUTUBE', err);
    if (!body) return callback('EYOUTUBEBODYNULL');

    if (process.env.NODE_ENV != 'production') {
      fs.writeFileSync(path.join(__dirname, '../data_sample/raw_youtube_news.html'), body);
    }

    const $ = cheerio.load(body);
    const content = _parseContent($, YT_TYPE.EXPORE);

    return callback(null, content);
  });
}
