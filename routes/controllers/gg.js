const Response = require('../services/Response');
const GoogleService = require('../services/GoogleService');

let GgCtrl = {};
module.exports = GgCtrl;

GgCtrl.autocomplete = (req, res) => {
	let { keyword } = req.body;

	GoogleService.autocomplete(keyword, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.autocompleteMerge = (req, res) => {
	let { keyword } = req.body;

	GoogleService.autocompleteMerge(keyword, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.standingOfLeague = (req, res) => {
	let options = req.body;

	GoogleService.standingOfLeague(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}