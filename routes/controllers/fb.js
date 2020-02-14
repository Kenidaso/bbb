const Response = require('../services/Response');
const FbService = require('../services/FacebookService');

let FbCtrl = {};
module.exports = FbCtrl;

FbCtrl.scrapedSharingDebugger = (req, res) => {
	let { link } = req.body;

	FbService.scrapedSharingDebugger(link, (err, result) => {
		if (err) return Response.error(req, res, err, result);
		return Response.success(req, res, result);
	})
}