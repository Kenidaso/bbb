const debug = require('debug')('GoogleTranslate');
const url = require('url');
const fs = require('fs');
const path = require('path');

const request = require('request').defaults({
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'accept': 'application/json, text/plain, */*'
  },
  jar: true
})

let cookie = request.jar();

const safeParse = (text) => {
  if (typeof text === 'object') return text;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const GG_TRANS_DOMAIN = `translate.goog`;

const ggTrans = {};
module.exports = ggTrans;

const convertHost = (host) => {
  return host.replace(/\./g, '-');
}

ggTrans.fetch = (link, callback) => {
  const parser = url.parse(link);
  const { host, path: _path } = parser;
  const subDomain = convertHost(host);

  const transLink = `https://${subDomain}.${GG_TRANS_DOMAIN}${_path}/?_x_tr_sl=en&_x_tr_tl=vi&_x_tr_hl=en&_x_tr_pto=wapp`;

  request({
    url: transLink,
    method: 'GET'
  }, (err, res, body) => {
    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(path.join(__dirname, `../data_sample/ggTrans_${subDomain}.html`), body);
    }

    return callback(err, body);
  })
}
