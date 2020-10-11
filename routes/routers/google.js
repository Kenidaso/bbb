const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');
const middleware = require('../middleware');

router.use('/', middleware.validateDynamicFeed24hToken);
router.post('/autocomplete', controllers.gg.autocomplete); // autocomplete by google search
router.post('/standing-of-league', controllers.gg.standingOfLeague);
router.post('/stat-of-league', controllers.gg.statOfLeague);
router.post('/news-of-league', controllers.gg.newsOfLeague);
router.post('/player-of-league', controllers.gg.playerOfLeague);
router.post('/match-of-league', controllers.gg.matchOfLeague);
router.post('/player-stat', controllers.gg.statOfPlayer);
router.post('/timeline-of-match', controllers.gg.timelineOfMatch);
router.post('/lineups-of-match', controllers.gg.lineupsOfMatch);
router.post('/stats-of-match', controllers.gg.statsOfMatch);
router.post('/news-of-match', controllers.gg.newsOfMatch);
router.post('/layout-header-of-match', controllers.gg.layoutHeaderOfMatch);

module.exports = router;