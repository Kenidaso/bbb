
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
  const { params: { category }} = req;
  const opts = req.query;

  youtubeService.getFeeds(category, opts, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

YoutubeCtrl.exploreTrending = (req, res) => {
  const { params: { explore }} = req;
  const opts = req.query;

  youtubeService.exploreTrending(explore, opts, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

YoutubeCtrl.getExplore = (req, res) => {
  const { params: { explore }} = req;
  const opts = req.query;

  youtubeService.getExplore(explore, opts, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

YoutubeCtrl.getChannel = (req, res) => {
  const { params: { channelId }} = req;
  const opts = req.query;

  youtubeService.getChannel(channelId, opts, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

YoutubeCtrl.getChannelCommunity = (req, res) => {
  const { params: { channelId }} = req;
  const opts = req.query;

  youtubeService.getChannelCommunity(channelId, opts, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

YoutubeCtrl.getFeedsChannelByRss = (req, res) => {
  const { params: { channelId }} = req;
  const opts = req.query;

  youtubeService.getFeedsChannelByRss(channelId, opts, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}
