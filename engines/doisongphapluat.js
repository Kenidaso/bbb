const NAME = 'doisongphapluat';
const sanitizeHtml = require('sanitize-html');
const debug = require('debug')(`Engine:${NAME}`);

const fs = require('fs');
const path = require('path');

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

engine.cleanSpecial = ($, content) => {
	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}.html`), $(content).html());
	}

	// clear trash
	$('.breakcrumb', content).remove();
	$('[href*="dmca"]', content).remove();
	$('.art-social', content).remove();
	$('.readmore-box', content).remove();
	$('.author-box', content).remove();
	$('[class*="qc"]', content).remove();
	$('[id*="art"]', content).remove();
	$('center', content).remove();
	$('#links', content).remove();
	$('[style*="display: none;"]', content).remove();
	$('#blueimp-gallery', content).remove();
	$('.blueimp-gallery', content).remove();
	$('#bs_mobileinpage', content).remove();
	$('#AdAsia', content).remove();
	$('[id*="ad"]', content).remove();
	$('#innity-in-post', content).remove();
	$('[style*="clear: both;"]', content).remove();

	// clear last div
	let divs = $('div', content);
	$(divs[divs.length - 1], content).remove();
}
