const NAME = 'nguoilaodong';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);
const request = require('request');
const cheerio = require('cheerio');

const fs = require('fs');
const path = require('path');

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

engine.fetch = (link, callback) => {
  request({
    url: link,
    method: 'GET',
  }, (err, response, body) => {
  	if (err) return callback(err);
  	if (!body) return callback('ENOBODY');

  	let $ = cheerio.load(body);
  	let onload = $('body').attr('onload');

  	if (onload && onload.length > 0) {
  		const i1 = onload.indexOf("'");
  		const i2 = onload.indexOf('htm');
  		let href = onload.substr(i1 + 1, i2 - i1 + 2);
  		href = 'https://nld.com.vn/' + href;

  		debug('href= %s', href);

  		return engine.fetch(href, callback);
  	}

    return callback(err, body);
  })
}

engine.cleanSpecial = ($, content) => {
	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
	}

	// clear trash
	$('.sharemxh .line-middle', content).remove();
	$('.sharemxh a', content).remove();
	$('.fb', content).remove();
	$('#start-social', content).remove();
	$('.clear-both', content).remove();
	$('#ele-social', content).remove();
	$('.relatednews', content).remove();
	$('#end-social', content).remove();
	$('.clear', content).remove();
	$('.bottomshare', content).remove();
	$('.listtags', content).remove();
	$('[type="hidden"]', content).remove();
	$('.displaynone', content).remove();
	$('#infomxh', content).remove();
	$('.comment-container', content).remove();
	$('.hide', content).remove();
	$('[id*="admzone"]', content).remove();
	$('[id*="sticky"]', content).remove();
}
