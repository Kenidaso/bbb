const Response = require('../services/Response');
const FeedService = require('../services/FeedService');
const RawFeedService = require('../services/RawFeedService');

let FeedCtrl = {};
module.exports = FeedCtrl;

FeedCtrl.getFeeds = (req, res) => {
	let { category, page } = req.params;
	let { limit } = req.query;
	page = Number(page) || 1;

	limit = Number(limit) || 18;

	if (limit < 1) limit = 1;
	else if (limit > 100) limit = 100;

	FeedService.getFeeds({ category, page, limit }, (err, feeds) => {
		if (err) return Response.error(req, res, err, feeds);
		return Response.success(req, res, feeds);
	});
}

FeedCtrl.getRawContent = (req, res) => {
	let { link, ignoreCache } = req.body;

	RawFeedService.getHtmlContent(link, ignoreCache, (err, html) => {
		if (err) return Response.error(req, res, err, html);
		return Response.success(req, res, html);
	});
}

FeedCtrl.getCategories = (req, res) => {
	FeedService.getCategories((err, result) => {
		if (err) return Response.error(req, res, err, result);
		return Response.success(req, res, result);
	});
}

FeedCtrl.getContent = (req, res) => {
	let { slug, ignoreCache } = req.params;

	FeedService.getContent(slug, ignoreCache, (err, result) => {
		if (err) return Response.error(req, res, err, result);
		return Response.success(req, res, result);
	});
}
