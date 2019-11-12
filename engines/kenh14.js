const NAME = 'kenh14';

const sanitizeHtml = require('sanitize-html');
const debug = require('debug')('Engine:kenh14');

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
	// $('.relationnews', content).remove();
	// $('.hiding-react-relate', content).remove();
	// $('.kbwc-socials', content).remove();
	// $('.knc-menu-nav', content).remove();
	// $('.knc-rate-link', content).remove();
	// $('.post_embed', content).remove();
	// $('.klw-nomargin', content).remove();
	// $('[type="Vote"]', content).remove();
	// $('.klcbfn-subtitle', content).remove();

	if (process.env.NODE_ENV !== 'production') {
		fs.writeFileSync(path.join(__dirname, `../data_sample/parse_${NAME}_2.html`), $(content).html());
	}
}
