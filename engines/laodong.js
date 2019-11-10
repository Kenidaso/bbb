const NAME = 'laodong';
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

	debug('tag img: convert data-src -> src ');
	$('img', content).each(function () {
		let dataSrc = $(this).attr('data-src');
		$(this).attr('src', dataSrc);
		$(this).removeAttr('data-src');
	});

	// clear trash
	$('.breadcrumb', content).remove();
	$('.fb-share-button', content).remove();
	$('.wrapper-audio', content).remove();
	$('.social-link', content).remove();
	$('.keywords-box', content).remove();
	$('section.wrapper-banner', content).remove();
	$('.related-news', content).remove();
	$('.comments-section', content).remove();
	$('.clearfix', content).remove();
	$('.ads-responsive', content).remove();
	$('.notification-off', content).remove();
	$('.right-sidebar', content).remove();
	$('.time-line', content).remove();
	$('.adsbygoogle', content).remove();
	$('[id*="google"]', content).remove();
}
