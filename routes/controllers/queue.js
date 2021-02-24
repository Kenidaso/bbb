const GoogleNewsService = require('../services/GoogleNewsService');
const QueueService = require('../services/QueueService');

let QueueCtrl = {};
module.exports = QueueCtrl;

QueueCtrl.pushTaskSearch = (req, res) => {
  let { keyword } = req.body;

  if (!keyword) return res.error(req, res, 'EINVALIDBODY');

  const taskData = {
    name: 'search',
    params: {
      keyword
    }
  }

  QueueService.pushTask(taskData, (err, result) => {
    console.log('err=', err);

    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

QueueCtrl.pushTask = (req, res) => {
	let taskData = req.body;

	QueueService.pushTask(taskData, (err, result) => {
		console.log('err=', err);

		if (err) return res.error(req, res, err, result);
		return res.success(req, res, result);
	});
}
