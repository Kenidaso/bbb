const sanitizeHtml = require('sanitize-html');
const debug = require('debug')('Engine:24h.com.vn');

let engine = {};
module.exports = engine;

engine.optSanitizeHtml = {
	// Dành cho dọn rác html đặc biệt, nếu không sử dụng default của baseEngine
}

engine.cleanSpecial = ($, content) => {
	debug('tag img: convert data-original -> src ');
	$('img', content).each(function () {
		let dataOriginal = $(this).attr('data-original');
		$(this).attr('src', dataOriginal);
		$(this).removeAttr('data-original');
	});

	// get zone baner
	debug('remove last div ViewMore ...');
	let zoneBanner = $('#zone_banner_sponser_product', content);
	let nextZone = zoneBanner.next();
	nextZone.remove();

	// remove ads
	debug('remove zone_banner');
	$('[id*="zone_banner"]').each(function () {
		$(this).remove();
	});

	debug('remove all div #ADS');
	$('[id*="ADS"]').each(function () {
		$(this).remove();
	});
}
