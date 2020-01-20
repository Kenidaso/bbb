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

GgCtrl.statOfLeague = (req, res) => {
	let options = req.body;

	GoogleService.statOfLeague(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.newsOfLeague = (req, res) => {
	let options = req.body;

	GoogleService.newsOfLeague(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.playerOfLeague = (req, res) => {
	let options = req.body;

	GoogleService.playerOfLeague(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.matchOfLeague = (req, res) => {
	let options = req.body;

	GoogleService.matchOfLeague(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.statOfPlayer = (req, res) => {
	let options = req.body;

	GoogleService.statOfPlayer(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.timelineOfMatch = (req, res) => {
	let options = req.body;

	GoogleService.timelineOfMatch(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.lineupsOfMatch = (req, res) => {
	let options = req.body;

	GoogleService.lineupsOfMatch(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.statsOfMatch = (req, res) => {
	let options = req.body;

	GoogleService.statsOfMatch(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.newsOfMatch = (req, res) => {
	let options = req.body;

	GoogleService.newsOfMatch(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}

GgCtrl.layoutHeaderOfMatch = (req, res) => {
	let options = req.body;

	GoogleService.layoutHeaderOfMatch(options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	})
}
