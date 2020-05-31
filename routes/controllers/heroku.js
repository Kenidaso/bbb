const HerokuService = require('../services/HerokuService');

const herokuCtrl = {};

herokuCtrl.restart = (req, res) => {
	let { app, dyno } = req.body;

	if (!app || !dyno) return res.error(req, res, 'EINVALIDBODY');

	HerokuService.restart(app, dyno, (err, result) => {
		if (err) return res.error(req, res, err, result);
		return res.success(req, res, result);
	})
}

module.exports = herokuCtrl;