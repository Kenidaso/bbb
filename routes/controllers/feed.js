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
	let { slug } = req.params;

	FeedService.getContent(slug, (err, result) => {
		if (err) return Response.error(req, res, err, result);
		return Response.success(req, res, result);
	});
}
