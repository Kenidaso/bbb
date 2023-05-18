const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');

router.get('/news', controllers.youtube.news);
router.get('/feeds/:category', controllers.youtube.getFeeds);
router.get('/explore/:explore', controllers.youtube.getExplore);

module.exports = router;
