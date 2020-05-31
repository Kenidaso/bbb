const GoogleTrendsService = require('../services/GoogleTrendsService');

let TrendsCtrl = {};
module.exports = TrendsCtrl;

TrendsCtrl.yearInSearch = (req, res) => {
	let options= req.body;

	GoogleTrendsService.yearInSearch(options, (err, results) => {
		if (err) return res.error(req, res, err, results);
		return res.success(req, res, results);
	})
}

TrendsCtrl.autocomplete = (req, res) => {
	let options= req.body;

	GoogleTrendsService.autocomplete(options, (err, results) => {
		if (err) return res.error(req, res, err, results);
		return res.success(req, res, results);
	})
}

TrendsCtrl.dailytrends = (req, res) => {
	let options= req.body;

	GoogleTrendsService.dailytrends(options, (err, results) => {
		if (err) return res.error(req, res, err, results);
		return res.success(req, res, results);
	})
}

TrendsCtrl.realtimetrends = (req, res) => {
	let options= req.body;

	GoogleTrendsService.realtimetrends(options, (err, results) => {
		if (err) return res.error(req, res, err, results);
		return res.success(req, res, results);
	})
}
