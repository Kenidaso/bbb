const Response = require('../services/Response');
const Device = require('../services/DeviceService');

let DeviceCtrl = {};
module.exports = DeviceCtrl;

DeviceCtrl.register = (req, res) => {
	let params = {
		...req.body,
		_headers: req.headers
	}

	Device.register(params, (err, device) => {
		if (err) return Response.error(req, res, err, device);
		return Response.success(req, res, device);
	});
}