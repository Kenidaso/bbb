const NAME = 'nhattao';

const request = require('request').defaults({
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36'
});
const cheerio = require('cheerio');
const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const debug = require('debug')(`Engine:${NAME}`);

const base = require('./base');
const fetchRss = require('./fetchRss');
const utils = require('../helpers/utils');

const HOMEPAGE = 'https://nhattao.com';

const search = (keyword, callback) => {
  let options = {
    'method': 'POST',
    'url': `${HOMEPAGE}/spotlight/search`,
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    form: {
      q: keyword,
      _xfRequestUri: '/',
      _xfNoRedirect: 1,
      _xfResponseType: 'json'
    }
  };

  request(options, (error, response, body) => {
    if (body) body = utils.safeParse(body);
    return callback(error, body);
  });
}

const searchIPhone = (callback) => {
  let options = {
    method: 'POST',
    url: `${HOMEPAGE}/f/iphone.219`,
    headers: {
      'Origin': 'https://nhattao.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Referer': 'https://nhattao.com/f/iphone.219/',
      'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,la;q=0.5'
    },
    form: {
      'mnp': 0,
      'mxp': 30000000,
      'type': 'recent',
      'order': 'up_time',
      'direction': 'desc',
      'l': 'HoChiMinh',
      't': 1,
      '_xfToken': ''
    }
  };

  request(options, (error, response, body) => {
    return callback(error, body);
  });
}

module.exports = {
  search,
  searchIPhone
}