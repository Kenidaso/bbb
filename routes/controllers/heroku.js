const Response = require('../services/Response');
const HerokuService = require('../services/HerokuService');

const herokuCtrl = {};

herokuCtrl.restart = (req, res) => {
	let { app, dyno } = req.body;

	if (!app || !dyno) return Response.error(req, res, 'EINVALIDBODY');

	HerokuService.restart(app, dyno, (err, result) => {
		if (err) return Response.error(req, res, err, result);
		return Response.success(req, res, result);
	})
}

module.exports = herokuCtrl;