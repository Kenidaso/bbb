const NAME = 'nguoilaodong';
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
