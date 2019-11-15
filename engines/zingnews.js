const NAME = 'zingnews';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);

const fs = require('fs');
const path = require('path');

const request = require('request').defaults({
	headers: {
		authority: 'news.zing.vn',
		'cache-control': 'max-age=0',
		'upgrade-insecure-requests': 1,
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
		'sec-fetch-user': '?1',
		'sec-fetch-site': 'same-origin',
		'sec-fetch-mode': 'navigate',
		'accept-encoding': 'gzip, deflate, br',
		'accept-language': 'en-US,en;q=0.9',
	}
})

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

engine.fetch = (link, callback) => {
	console.log('go to fetch engine');
  request({
    url: link,
    method: 'GET',
    gzip: true
  }, (err, response, body) => {
    return callback(err, body);
  })
}

engine.cleanSpecial = ($, content) => {
	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
	}

	// clear trash
	$('.the-article-category').remove();
	$('.the-article-tags').remove();
	$('#divComment').remove();
	$('.sidebar').remove();
	$('section.recommendation').remove();
}
