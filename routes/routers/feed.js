const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');
const middleware = require('../middleware');

router.post('/raw', controllers.feed.getRawContent);
router.get('/hotnews', middleware.validateDynamicFeed24hToken, controllers.feed.getHotNews);
router.get('/:category/:page?', middleware.validateDynamicFeed24hToken, controllers.feed.getFeeds);
router.post('/upsert', controllers.feed.upsertFeed);

module.exports = router