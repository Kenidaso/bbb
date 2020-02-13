const Response = require('../services/Response');
const RedisService = require('../services/RedisService');

let TaskCtrl = {};
module.exports = TaskCtrl;

TaskCtrl.status = (req, res) => {
	let taskId = req.params.taskId;

	RedisService.getTaskKey(taskId, (err, result) => {
		if (err) return Response.error(req, res, err, result);
		return Response.success(req, res, result);
	})
}
