
const Response = require('../services/Response');
const FeedService = require('../services/FeedService');

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