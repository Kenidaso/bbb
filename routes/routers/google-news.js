const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');
const middleware = require('../middleware');

router.use('/', middleware.validateDynamicFeed24hToken);
router.post('/search', middleware.trackSearch, controllers.search.ggnSearch);
router.post('/search-ggs', middleware.trackSearch, controllers.search.searchFromGgSearch);

module.exports = router;