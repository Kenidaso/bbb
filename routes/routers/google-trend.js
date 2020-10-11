const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');
const middleware = require('../middleware');

router.use('/', middleware.validateDynamicFeed24hToken);
router.post('/yis', controllers.trends.yearInSearch); // Year in Search, top search in year
router.post('/autocomplete', controllers.trends.autocomplete); // autocomplete with region
router.post('/daily', controllers.trends.dailytrends);
router.post('/realtime', controllers.trends.realtimetrends);

module.exports = router;