
const vozService = require('../services/VozService');

const VozCtrl = {};
module.exports = VozCtrl;

VozCtrl.getThreadsOfForum = (req, res) => {
  const { query: { f, page }} = req;

  vozService.getThreadsOfForum({ f, page }, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

VozCtrl.getThreadDetail = (req, res) => {
  const { query: { t, page }} = req;

  vozService.getThreadDetail({ t, page }, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}
