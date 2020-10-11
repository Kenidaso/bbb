const keystone = require('keystone');
const express = require('express');
const rateLimit = require("express-rate-limit");

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
const controllers = importRoutes('../controllers');
const middleware = require('../middleware');

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5 // limit each IP to 100 requests per windowMs
});

router.post('/register', limiter, middleware.validateDynamicFeed24hToken, controllers.device.register);

module.exports = router;