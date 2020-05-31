const Device = require('../services/DeviceService');

let DeviceCtrl = {};
module.exports = DeviceCtrl;

DeviceCtrl.register = (req, res) => {
	let params = {
		...req.body,
		_headers: req.headers
	}

	Device.register(params, (err, device) => {
		if (err) return res.error(req, res, err, device);
		return res.success(req, res, device);
	});
}