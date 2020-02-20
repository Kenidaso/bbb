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

const Response = require('./services/Response');
const SearchService = require('./services/SearchService');

const UserSearch = keystone.list('UserSearch');

const i18n = keystone.get('i18n');
const t = i18n.__;

const utils = require('../helpers/utils');

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
