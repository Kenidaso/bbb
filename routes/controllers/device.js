const Response = require('../services/Response');
const Device = require('../services/DeviceService');

let DeviceCtrl = {};
module.exports = DeviceCtrl;

DeviceCtrl.register = (req, res) => {
	Device.register(req.body, (err, device) => {
		if (err) return Response.error(req, res, err, device);
		return Response.success(req, res, device);
	});
}