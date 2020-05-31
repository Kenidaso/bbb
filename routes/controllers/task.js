const RedisService = require('../services/RedisService');

let TaskCtrl = {};
module.exports = TaskCtrl;

TaskCtrl.status = (req, res) => {
	let taskId = req.params.taskId;

	RedisService.getTaskKey(taskId, (err, result) => {
		if (err) return res.error(req, res, err, result);
		return res.success(req, res, result);
	})
}
