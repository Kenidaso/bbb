const keystone = require('keystone');
const express = require('express');

const router = express.Router();
const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');
const middleware = require('../middleware');

router.use('/', middleware.validateDynamicFeed24hToken);
router.post('/verify-access-token', controllers.firebase.verifyAccessToken);
router.get('/generate-access-token', controllers.firebase.generateAccessToken);
router.post('/refresh-access-token', controllers.firebase.refreshAccessToken);

module.exports = router;
