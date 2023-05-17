const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');

router.get('/news', controllers.youtube.news);
router.get('/feeds/:category', controllers.youtube.getFeeds);

module.exports = router;
