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

const base = require('./base');
const fetchRss = require('./fetchRss');
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
  EXPORE: 'explore',
  CHANNEL: 'channel',
  CHANNEL_COMMUNITY: 'channel_community'
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

const extractVideoChannel = (item) => {
  const videoRenderer = _.get(item, 'compactStationRenderer') || _.get(item, 'gridVideoRenderer');

  const description = _.get(videoRenderer, 'description.simpleText');
  let videoCountText = _.get(videoRenderer, 'videoCountText.runs');

  if (videoCountText) {
    videoCountText = videoCountText.map(v => v.text).join(' ');
  } else {
    videoCountText = _.get(videoRenderer, 'videoCountText.simpleText');
  }

  const title = _.get(videoRenderer, 'title.simpleText');
  const thumbnails = _.get(videoRenderer, 'thumbnail.thumbnails');
  const videoId = _.get(videoRenderer, 'navigationEndpoint.watchEndpoint.videoId');
  const playlistId = _.get(videoRenderer, 'navigationEndpoint.watchEndpoint.playlistId');
  const publishedTimeText = _.get(videoRenderer, 'publishedTimeText.simpleText');
  const shortViewCountText = _.get(videoRenderer, 'shortViewCountText.simpleText');

  const video = {
    description,
    thumbnails,
    title,
    videoId,
    playlistId,
    videoCountText,
    publishedTimeText,
    shortViewCountText,
    url: `${BASE_URL_SHORT}/${videoId}`
  }

  return video;
}

const extractPostChannelCommunity = (item) => {
  const postRender = _.get(item, 'backstagePostThreadRenderer.post.backstagePostRenderer');

  const postId = _.get(postRender, 'postId');
  const authorName = _.get(postRender, 'authorText.runs.0.text');
  const authorThumbnails = _.get(postRender, 'authorThumbnail.thumbnails');
  let contentText = _.get(postRender, 'contentText.runs') //.map(c => c.text).join(' ');
  const publishedTimeText = _.get(postRender, 'publishedTimeText.runs.0.text');
  const image = _.get(postRender, 'backstageAttachment.backstageImageRenderer.image');
  const voteCount = _.get(postRender, 'voteCount.simpleText');
  const labelLikeButton = _.get(postRender, 'actionButtons.commentActionButtonsRenderer.likeButton.accessibility.label');
  const labelReplyButton = _.get(postRender, 'actionButtons.commentActionButtonsRenderer.replyButton.buttonRenderer.simpleText');

  if (contentText && contentText.length) {
    contentText = contentText.map(c => c.text).join(' ');
  } else {
    contentText = '';
  }

  const post = {
    postId,
    author: {
      name: authorName,
      thumbnails: authorThumbnails
    },
    content: contentText,
    publishedTimeText,
    image,
    voteCount,
    labelLikeButton,
    labelReplyButton,
  }

  return post;
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
  const [tab] = _.chain(_.get(initData, 'contents.twoColumnBrowseResultsRenderer.tabs'))
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

        const [row] = sections;
        return row;
      })

      const [row] = stories;
      const { videos } = row;

      return { title, videos };
    })
    .value()

  return tab;
}

const extractYtInitialDataChannel = (initData) => {
  const metadata = _.get(initData, 'metadata.channelMetadataRenderer');
  const [tab] = _.chain(_.get(initData, 'contents.twoColumnBrowseResultsRenderer.tabs'))
    .filter('tabRenderer.selected')
    .map(s => {
      const title = _.get(s, 'tabRenderer.title');
      let sections = _.get(s, 'tabRenderer.content.sectionListRenderer.contents');

      sections = _.map(sections, (section) => {
        const sectionContent = _.get(section, 'itemSectionRenderer');
        let items = _.get(sectionContent, 'contents');

        items = _.map(items, item => {
          const render = _.get(item, 'shelfRenderer') || _.get(item, 'channelVideoPlayerRenderer');
          const title = _.get(render, 'title.runs.0.text');
          let videos = _.get(render, 'content.horizontalListRenderer.items');

          if (videos) {
            videos = _.map(videos, extractVideoChannel);

            return { videos, title };
          }

          const videoId = _.get(render, 'videoId');
          const description = _.get(render, 'description.runs').map(d => d.text).join(' ');
          const viewCountText = _.get(render, 'viewCountText.simpleText');
          const publishedTimeText = _.get(render, 'publishedTimeText.runs.0.text');

          const video = {
            videoId,
            description,
            viewCountText,
            publishedTimeText,
            type: item.hasOwnProperty('channelVideoPlayerRenderer') ? 'CHANNEL_VIDEO' : 'VIDEO'
          }

          return { video, title };
        });

        const [row] = items;

        return row;
      })

      return { title, sections, metadata };
    })
    .value()

  return tab;
}

const extractYtInitialDataChannelCommunity = (initData) => {
  const metadata = _.get(initData, 'metadata.channelMetadataRenderer');
  const [tab] = _.chain(_.get(initData, 'contents.twoColumnBrowseResultsRenderer.tabs'))
    .filter('tabRenderer.selected')
    .map(s => {
      const title = _.get(s, 'tabRenderer.title');
      let sections = _.get(s, 'tabRenderer.content.sectionListRenderer.contents');

      sections = _.map(sections, (section) => {
        const sectionContent = _.get(section, 'itemSectionRenderer');
        let items = _.get(sectionContent, 'contents');
        items = _.map(items, extractPostChannelCommunity);

        return items;
      })

      return { title, sections, metadata };
    })
    .value()

  return tab;
}

const _parseContent = ($, type = YT_TYPE.FEEDS) => {
  const scripts = $('script')
    .map((i, ele) => $(ele).text())
    .toArray();

  let result = null;
  const [_ytInitialData] = scripts.filter(s => s.indexOf('ytInitialData') > -1)

  // cheat/hack
  var ytInitialData = null;
  eval(_ytInitialData);

  if (ytInitialData) {
    switch (type) {
      case YT_TYPE.FEEDS:
        result = extractYtInitialDataFeeds(ytInitialData);
        break;

      case YT_TYPE.EXPORE:
        result = extractYtInitialDataExplore(ytInitialData);
        break;

      case YT_TYPE.CHANNEL:
        result = extractYtInitialDataChannel(ytInitialData);
        break;

      case YT_TYPE.CHANNEL_COMMUNITY:
        result = extractYtInitialDataChannelCommunity(ytInitialData);
        break;

      default:
        result = extractYtInitialDataFeeds(ytInitialData);
    }
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

    const $ = cheerio.load(body);
    const content = _parseContent($, YT_TYPE.EXPORE);

    return callback(null, content);
  });
}

engine.getChannel = (channelId, opts, callback) => {
  opts = opts || {};
  let { country } = opts;
  country = country || 'VN';

  if (country !== 'VN') {
    country = 'US';
  }

  const qs = {
    ...QS_COUNTRY[country]
  }

  let urlChannel = channelId.startsWith('@')
    ? `${BASE_URL}/${channelId}`
    : `${BASE_URL}/channel/${channelId}`;

  request({
    url: urlChannel,
    method: 'GET',
    qs
  }, (err, response, body) => {
    if (err) return callback('EYOUTUBE', err);
    if (!body) return callback('EYOUTUBEBODYNULL');

    if (process.env.NODE_ENV != 'production') {
      fs.writeFileSync(path.join(__dirname, '../data_sample/raw_youtube_channel.html'), body);
    }

    const $ = cheerio.load(body);
    const content = _parseContent($, YT_TYPE.CHANNEL);

    return callback(null, content);
  });
}

engine.getChannelCommunity = (channelId, opts, callback) => {
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
    url: `${BASE_URL}/channel/${channelId}/community`,
    method: 'GET',
    qs
  }, (err, response, body) => {
    if (err) return callback('EYOUTUBE', err);
    if (!body) return callback('EYOUTUBEBODYNULL');

    if (process.env.NODE_ENV != 'production') {
      fs.writeFileSync(path.join(__dirname, '../data_sample/raw_youtube_channel-community.html'), body);
    }

    const $ = cheerio.load(body);
    const content = _parseContent($, YT_TYPE.CHANNEL_COMMUNITY);

    return callback(null, content);
  });
}

const fnTransform = (o) => {
  if (Array.isArray(o) && o.length === 1) {
    let [value] = o;

    if (_.isObject(value) && _.keys(value).length === 1 && value.hasOwnProperty('$')) {
      value = value['$'];
    }

    return _.isObject(value)
      ? _.mapValues(value, fnTransform)
      : value;
  }

  if (Array.isArray(o)) {
    return _.map(o, fnTransform)
  }

  if (_.isObject(o)) {
    return _.mapValues(o, fnTransform)
  }

  return o;
}

const restructureRss = (data) => {
  const feed = _.mapValues(data.feed, fnTransform)

  const { title, author, published, entry: entries } = feed;

  const videos = entries.map(entry => {
    const { title, author, published, updated } = entry;
    const videoId = entry['yt:videoId'];
    const channelId = entry['yt:channelId'];
    const link = _.get(entry, 'link.href');

    const mediaGroup = entry['media:group'];
    const mediaCommunity = mediaGroup['media:community'];

    const media = {
      title: mediaGroup['media:title'],
      content: mediaGroup['media:content'],
      thumbnail: mediaGroup['media:thumbnail'],
      description: mediaGroup['media:description'],
      community: {
        starRating: mediaCommunity['media:starRating'],
        statistics: mediaCommunity['media:statistics']
      }
    }

    const video = {
      videoId,
      channelId,
      title,
      link,
      author,
      published,
      updated,
      media
    }

    return video;
  });

  const result = {
    title,
    author,
    published,
    videos
  }

  return result;
}

engine.getFeedsChannelByRss = (channelId, opts, callback) => {
  fetchRss({
    link: `${BASE_URL}/feeds/videos.xml?channel_id=${channelId}`
  }, (err, result) => {
    if (err) {
      return callback('INVALIDRSS', 'Invalid Rss');
    }

    const data = restructureRss(result);

    return callback(null, data);
  });
}

