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

router.use('/', middleware.validateDynamicFeed24hToken);
router.post('/register-guest', limiter, controllers.user.registerGuest);
// router.get('/verify-token', jwt({ secret: JwtService.JWT_SECRET }));
router.get('/verify-token', middleware.verifyToken, (req, res, next) => {
  return res.json(req.user);
});

module.exports = router;