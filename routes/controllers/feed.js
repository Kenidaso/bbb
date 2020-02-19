const Response = require('../services/Response');
const FeedService = require('../services/FeedService');
const RawFeedService = require('../services/RawFeedService');
const FacebookService = require('../services/FacebookService');

let FeedCtrl = {};
module.exports = FeedCtrl;

FeedCtrl.getFeeds = (req, res) => {
	let { category, page } = req.params;
	let { limit } = req.query;
	page = Number(page) || 1;

	limit = Number(limit) || 18;

	limit = Math.max(limit, 1);
	limit = Math.min(limit, 100);

	FeedService.getFeeds({ category, page, limit }, (err, feeds) => {
		if (err) return Response.error(req, res, err, feeds);
		return Response.success(req, res, feeds);
	});
}

FeedCtrl.getRawContent = (req, res) => {
	let { link, options } = req.body;

	RawFeedService.getHtmlContent(link, options, (err, html) => {
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
	let options = req.query || {};

	FeedService.getContent(slug, options, (err, result) => {
		if (err) return Response.error(req, res, err, result);

		if (options.shareFb) {
			if (options.slugBoard) {
				let link = `https://feed24h.net/${options.slugBoard}/${slug}`;
				console.log('sharing debugger link=', link);
				FacebookService.scrapedSharingDebugger(link);
			}
		}

		if (options.scrapeurl) {
			FacebookService.scrapedSharingDebugger(options.scrapeurl);
		}

		return Response.success(req, res, result);
	});
}

FeedCtrl.upsertFeed = (req, res) => {
	let { find, update } = req.body;

	if (!find) return Response.error(req, res, 'EINVALIDFIND');
	if (!update) return Response.error(req, res, 'EINVALIDUPDATE');

	FeedService.upsertFeed(find, update, (err, result) => {
		if (err) return Response.error(req, res, err, result);
		console.log(`upsert done: ${JSON.stringify(find)}`);
		return Response.success(req, res, result);
	});
}