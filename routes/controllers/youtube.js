
const youtubeService = require('../services/YoutubeService');

const YoutubeCtrl = {};
module.exports = YoutubeCtrl;

YoutubeCtrl.news = (req, res) => {
  youtubeService.news((err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

YoutubeCtrl.getFeeds = (req, res) => {
  // const { query: { category }} = req;
  const { params: { category }} = req;

  youtubeService.getFeeds(category, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}
