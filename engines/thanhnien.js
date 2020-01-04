const NAME = 'thanhnien';
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
	$('[type="hidden"]', content).remove();
	$('[style*="display: none"]', content).remove();
	$('#storyvideolist', content).remove();
	$('.details__author', content).remove();
	$('.details__meta', content).remove();
	$('#livetimelinetop', content).remove();
	$('#livetimelinebot', content).remove();
	$('#stickymidbot', content).remove();
	$('[id*="sticky"]', content).remove();
	$('#abde', content).remove();
	$('.inread-ads', content).remove();
	$('[class*="ads"]', content).remove();
	$('.native-ad', content).remove();
	$('#commentbox', content).remove();
	$('[id*="dablewidget"]', content).remove();
	$('#detailsbottombanner', content).remove();
	$('[class*="banner"]', content).remove();
	$('.sidebar', content).remove();
	$('section.zone--media', content).remove();
	$('.as-content', content).remove();
	$('.details__morenews', content).remove();

	// $('.clearfix', content).remove();

	debug('tag img: convert data-src -> src ');
	$('img', content).each(function () {
		let dataSrc = $(this).attr('data-src');
		$(this).attr('src', dataSrc);
		$(this).removeAttr('data-src');
	});

	// convert amp-img to img
	$('amp-img', content).each(function () {
		this.tagName = 'img';
	});
}
