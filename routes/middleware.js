/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */
const _ = require('lodash');
const keystone = require('keystone');
const unidecode = require('unidecode');
const jwt = require('express-jwt');

const Response = require('./services/Response');
const SearchService = require('./services/SearchService');
const JwtService = require('./services/JwtService');

const UserSearch = keystone.list('UserSearch');

const i18n = keystone.get('i18n');
const Sentry = keystone.get('Sentry');
const t = i18n.__;

const { Statics } = keystone;

const ERROR_CODE = Statics.errorCode;

const utils = require('../helpers/utils');
const feed24hHeader = require('../helpers/feed24h-headers');

const noop = () => {}

/**
	Initialises the standard view locals

	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/
exports.initLocals = function (req, res, next) {
	let locals = res.locals;

	locals.i18n = i18n;
	locals.t = locals.__ = t;

	locals.navLinks = [
		{ label: 'Home', key: 'home', href: '/' },
		{ label: 'Blog', key: 'blog', href: '/blog' },
		{ label: 'Gallery', key: 'gallery', href: '/gallery' },
	];
	locals.user = req.user;

	next();
};

/**
	Fetches and clears the flashMessages before a view is rendered
*/
exports.flashMessages = function (req, res, next) {
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error'),
	};
	res.locals.messages = _.some(flashMessages, function (msgs) { return msgs.length; }) ? flashMessages : false;
	next();
};

/**
	Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function (req, res, next) {
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		next();
	}
};

/**
	Add function format error and success request
*/
exports.addFnFormatResponse = (req, res, next) => {
	res.error = Response.error;
	res.success = Response.success;

	return next();
}

exports.trackSearch = (req, res, next) => {
	let search = req.body.search || req.body.keyword;
	// if (!search) return Response.error(req, res, 'EMISSSEARCHKEYWORD');
	if (!search) return next();

	search = utils.normalizeSearch(search);
	if (!search || search.length == 0) return next();

	if (req.body.search) req.body.search = search;
	if (req.body.keyword) req.body.keyword = search;

	UserSearch.model.findOne({ searchContent: search }, (err, result) => {
		if (err) {
			console.log('track search err=', err);
			// return next('EFINDKEYWORD', err);
			return noop();
		}

		if (result) return result.incCount(noop);

		let newSearch = new UserSearch.model({ searchContent: search });
		newSearch.save(noop);
	});

	return next()
}

exports.trackSearchInPushTask = (req, res, next) => {
	if (!req.body.name) return next();
	if (req.body.name && req.body.name.toLowerCase() !== 'search') return next();

	if (!req.body.params || !req.body.params.keyword) return next();

	let search = req.body.params.keyword;

	if (!search || search.length == 0) return next();

	search = utils.normalizeSearch(search);

	if (!search || search.length == 0) return next();

	req.body.params.keyword = search;

	UserSearch.model.findOne({ searchContent: search }, (err, result) => {
		if (err) {
			console.log('track search err=', err);
			// return next('EFINDKEYWORD', err);
			return noop();
		}

		if (result) return result.incCount(noop);

		let newSearch = new UserSearch.model({ searchContent: search });
		newSearch.save(noop);
	});

	return next()
}

exports.verifyToken = jwt({ secret: JwtService.JWT_SECRET })

exports.handleError = function (err, req, res, next) {
  if (err) {
  	// Sentry.captureException(err);

  	console.log(`handleError err= ${JSON.stringify(err)}`);

    if (err.name === 'UnauthorizedError') {
    	return res.error(req, res, ERROR_CODE.EINVALIDTOKEN, err);
    }

    if (err.code === 'EBADCSRFTOKEN') {
    	return res.error(req, res, ERROR_CODE.EBADCSRFTOKEN, err);
    }

  	return res.error(req, res, err, err);
  }

  return next(err);
}

exports.verifyAccessTokenProvider = (req, res, next) => {

}

exports.printDetailRequest = (req, res, next) => {
	const _prefix = `[${req.id.red.bgYellow.bold}] [${new Date().toISOString().blue.bgWhite.bold}]`;
	const { originalUrl, method, headers, body, query } = req;
	const  detail = {
		originalUrl,
		method,
		headers,
		body,
		query,
	}

	console.log(`\n${_prefix} DETAIL_REQUEST ${JSON.stringify(detail).italic}`);

	return next();
}

exports.validateDynamicFeed24hToken = (req, res, next) => {
	const headers = req.headers;
	const appXToken = headers['app-x-token'];
	const origin = headers['origin'];

	// ignore SSR for speed
	const appFingerprint = headers['app-fingerprint'];

	if (origin === 'chickyky-by-pass') return next();
	if (appFingerprint === 'fingerprint_ssr') return next();

	let checkMissing = feed24hHeader.checkMissingHeaders(headers);

	if (checkMissing.isMissing) {
		return res.error(req, res, ERROR_CODE.EHEADERSMISSING/*, { headers: checkMissing.headersMiss }*/);
	}

	let checkTimestamp = feed24hHeader.validateReqTimestamp(headers);

	// if (!checkTimestamp) {
	// 	return res.error(req, res, ERROR_CODE.EREQTIMESTAMP);
	// }

	if (appFingerprint.length != 32) {
		return res.error(req, res, ERROR_CODE.EHEADERSFINGERPRINT);
	}

	let checkVersion = feed24hHeader.validateBuildKeyAndVersion(headers);

	// if (!checkVersion) {
	// 	return res.error(req, res, ERROR_CODE.EHEADERSVERSION);
	// }

	const hash = feed24hHeader.getHash(headers);

	if (hash !== appXToken) {
		const _prefix = `[${req.id.red.bgYellow.bold}]`;

		console.log(`${_prefix} Invalid x-token`);

		return res.error(req, res, ERROR_CODE.EXTOKEN);
	}

	return next();
}