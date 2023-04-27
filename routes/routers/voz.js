const keystone = require('keystone');
const express = require('express');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');

router.get('/threads-of-forum', controllers.voz.getThreadsOfForum);
router.get('/thread', controllers.voz.getThreadDetail);

module.exports = router