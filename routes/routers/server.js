const keystone = require('keystone');
const express = require('express');
const moment = require('moment');

const router = express.Router();

const importRoutes = keystone.importer(__dirname);
// const controllers = importRoutes('../controllers');
const middleware = require('../middleware');

router.get('/time-detail', (req, res) => {
	let now = new Date();
	let m_now = moment();

	let appReqTimestamp = Number(req.headers['app-request-timestamp']);
	let appReqTimezoneOffset = Number(req.headers['app-timezone-offset']);

	let timeDiffMs = m_now.diff(new Date(appReqTimestamp), 'ms');

	let result = {
		now: {
			unix: m_now.unix(),
			getTime:  now.getTime(),
			timezoneOffset: now.getTimezoneOffset(),
			localeTimeString: now.toLocaleTimeString(),
			dateString: now.toDateString(),
			gmtString: now.toGMTString(),
			ISOString: now.toISOString(),
			UTCString: now.toUTCString(),
		},

		headers: {
			appReqTimestamp,
			appReqTimezoneOffset,
		},

		timeDiffAsMilliseconds: timeDiffMs,
		timeDiffAsSeconds: moment.duration(timeDiffMs).asSeconds()
	};

	return res.success(req, res, result);
});

module.exports = router;