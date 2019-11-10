const NAME = 'vov';
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
	$('#hlPrint', content).remove();
	$('.social-button', content).remove();
	$('.clearfix', content).remove();
	$('[style*="display:none;"]', content).remove();
	$('.ds-info', content).remove();
	$('.article__tag', content).remove();
	$('.position-code', content).remove();
	$('[id*="ads"]', content).remove();
	$('[class*="article__stories"]', content).remove();
	$('.article__footer-group', content).remove();
	$('[class*="sticky"]', content).remove();
	$('.commentbox', content).remove();
	$('.article__hot-video', content).remove();
}
