const NAME = 'thethao247';
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
	$('.top_Utilities', content).remove();
	$('.ads', content).remove();
	$('.box_texlink', content).remove();
	$('.box_red_top', content).remove();
	$('.fb-page', content).remove();
	$('.box_new24h', content).remove();
	$('.box_blue_top', content).remove();
	$('[id*="sticky"]', content).remove();
	$('article', content).remove();
	$('.list_news_relate_bottom', content).remove();
	$('.content_box_home', content).remove();
	$('.box_tag_detail', content).remove();
	$('.list_news_relation', content).remove();
	$('center', content).remove();
	$('.detail_video_bottom', content).remove();

	// clear last div
	$('div strong', content).remove();
}
