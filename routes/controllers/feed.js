const Response = require('../services/Response');
const FeedService = require('../services/FeedService');
const RawFeedService = require('../services/RawFeedService');

let FeedCtrl = {};
module.exports = FeedCtrl;

FeedCtrl.getFeeds = (req, res) => {
	let { category, page } = req.params;
	page = Number(page) || 1;

	FeedService.getFeeds({ category, page }, (err, feeds) => {
		if (err) return Response.error(req, res, err, feeds);
		return Response.success(req, res, feeds);
	});
}

FeedCtrl.getRawContent = (req, res) => {
	let { link } = req.body;

	RawFeedService.getHtmlContent(link, (err, html) => {
		if (err) return Response.error(req, res, err, html);
		return Response.success(req, res, html);
	});
}
