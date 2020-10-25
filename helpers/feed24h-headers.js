const crypto = require('crypto');
const moment = require('moment');

const FEED24H_APIKEY = process.env.FEED24H_APIKEY;
const LIMIT_DIFF_TIMESTAMP = 1000 * 10; // 10s

const utils = require('./utils');

const md = (data) => {
  return crypto.createHash('md5').update(data).digest("hex");
}

const sha256 = (data) => {
  return crypto.createHash('sha256').update(data).digest("hex");
}

const HmacSHA1 = (data, key) => {
  return crypto.createHmac('sha1', key)
    .update(data)
    .digest('hex');
}

const hmac = (data, key) => {
  return HmacSHA1(data, key);
}

const decodeAppHeaders = {
  'order': 'app-order-headers',
  'x-token': 'app-x-token',
  'app-version': 'app-version',

  'e': 'app-build-key',
  'o': 'app-refesh-token',
  'i': 'app-request-timestamp',
  'f': 'app-timezone-offset',
  'in': 'app-fingerprint',
}

const checkMissingHeaders = (headers) => {
  let isMissing = true;
  let headersMiss = Object.values(decodeAppHeaders)
    .filter( h => !headers[h])
    .sort((a, b) => .5 - Math.random())

  isMissing = headersMiss.length > 0

  return { isMissing, headersMiss }
}

const getHash = (headers) => {
  const order = headers['app-order-headers'];

  const decode = order
    .split(':')
    .map(o => headers[decodeAppHeaders[o]])
    // .map(o => headers[o])
    .join(':');

  let hash = hmac(decode, FEED24H_APIKEY);

  return hash;
}

const checkFormatHeaders = (headers) => {
  let isInvalidFormat = true;
  let invalidFormats = [];

  let version = headers['app-version'];

  if (Number.isNaN(headers['app-request-timestamp'])) invalidFormats.push('app-request-timestamp');
  if (Number.isNaN(headers['app-timezone-offset'])) invalidFormats.push('app-timezone-offset');

  isInvalidFormat = invalidFormats.length > 0;

  return { isInvalidFormat, invalidFormats }
}

const validateBuildKeyAndVersion = (headers) => {
  const buildKey = headers['app-build-key'];
  const version = headers['app-version'];

  const now = new Date();
  let date = utils.dateFromObjectId(buildKey);

  if (date > now) return false;

  let dateVersion = moment(version, 'vYYYYMMDD.HH.mm').utcOffset(420).format('YYYYMMDD');
  dateVersion = Number(dateVersion);

  date = Number(moment(date).utcOffset(420).format('YYYYMMDD'));

  if (Math.abs(dateVersion - date) > 1) {
    console.log(`check headers version: dateVersion= ${dateVersion} :: date= ${date}`);
    return false;
  }

  return true;
}

const validateReqTimestamp = (req, headers) => {
  const timestamp = Number(headers['app-request-timestamp']);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  const isValid = diff <= LIMIT_DIFF_TIMESTAMP;

  if (!isValid) {
    console.log(`timestamp diff= ${diff} : ${timestamp} : ${now.getTime()}`);
  }

  req.timeDiff = diff;

  return isValid;
}

module.exports = {
  getHash,
  checkMissingHeaders,
  checkFormatHeaders,
  validateBuildKeyAndVersion,
  validateReqTimestamp
}
