const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');

router.get('/news', controllers.youtube.news);
router.get('/feeds/:category', controllers.youtube.getFeeds);
router.get('/explore/:explore', controllers.youtube.getExplore);
router.get('/channel/:channelId', controllers.youtube.getChannel);
router.get('/channel/:channelId/community', controllers.youtube.getChannelCommunity);
router.get('/channel/:channelId/feeds', controllers.youtube.getFeedsChannelByRss);

module.exports = router;
