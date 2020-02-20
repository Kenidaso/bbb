const Response = require('../services/Response');
const GoogleNewsService = require('../services/GoogleNewsService');
const QueueService = require('../services/QueueService');

let QueueCtrl = {};
module.exports = QueueCtrl;

QueueCtrl.pushTask = (req, res) => {
	let taskData = req.body;

	QueueService.pushTask(taskData, (err, result) => {
		console.log('err=', err);

		if (err) return Response.error(req, res, err, result);
		return Response.success(req, res, result);
	});
}
