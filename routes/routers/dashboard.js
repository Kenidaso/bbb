const keystone = require('keystone');
const express = require('express');
const { UI } = require('bull-board');
const Agendash = require('agendash');

const router = express.Router();
const agenda = keystone.get('agenda');

// dashboard Agenda
router.use('/', function (req, res, next) {
  if (req.user) return next();
  return res.send(401);
});

// router.use('/agenda', Agendash(agenda));
// router.use('/bull', UI);

module.exports = router