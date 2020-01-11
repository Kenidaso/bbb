const request = require('request').defaults({
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    dnt: 1,
    referer: 'https://www.google.com.vn/',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'accept': '*/*',
    'authority': 'www.google.com.vn',
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

const autocomplete = (keyword, callback) => {
  request({
    url: `https://www.google.com.vn/complete/search?q=${keyword}&cp=1&client=psy-ab&xssi=t&gs_ri=gws-wiz&hl=en-VN&authuser=0&psi=E7oYXuqhJ9Lr-QbiqaeoDQ.1578678804793&ei=E7oYXuqhJ9Lr-QbiqaeoDQ`,
    method: 'GET',
    jar: cookie
  }, (err, response, body) => {
    if (err) return callback(err);
    if (!body) return callback(null, null);

    let tryparse = body.slice(4);
    tryparse = safeParse(tryparse);

    return callback(null, tryparse);
    return callback(null, body);
  })
}

module.exports = {
  autocomplete
}