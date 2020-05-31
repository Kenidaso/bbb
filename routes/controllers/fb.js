const FbService = require('../services/FacebookService');

let FbCtrl = {};
module.exports = FbCtrl;

FbCtrl.scrapedSharingDebugger = (req, res) => {
	let { link } = req.body;

	FbService.scrapedSharingDebugger(link, (err, result) => {
		if (err) return res.error(req, res, err, result);
		return res.success(req, res, result);
	})
}