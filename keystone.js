// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
const keystone = require('keystone');
const requireDir = require('require-dir');
const i18n = require("i18n");
const async = require('async');
const Sentry = require('@sentry/node');
const debug = require('debug');
const path = require('path');
const colors = require('colors');

const acrud = require('./helpers/acrud');

const utils = require('./helpers/utils');

// console.log('--->', utils.randomStr(32))

acrud.init({
  keystone
});

i18n.configure({
	// setup some locales - other locales default to en silently
	locales: ['en', 'vi'],

	// where to store json files - defaults to './locales' relative to modules directory
	directory: __dirname + '/locales',

	// you may alter a site wide default locale
	defaultLocale: 'vi',

	// sets a custom cookie name to parse locale settings from - defaults to NULL
	cookie: 'lang',

	// query parameter to switch locale (ie. /home?lang=ch) - defaults to NULL
	queryParameter: 'lang',

	// sync locale information accros all files - defaults to false
	syncFiles: false,
});

if (process.env.NODE_ENV === 'production') {
	Sentry.init({
		release: 'api-feed24h@1.0.0',
		dsn: 'https://7281f0a1561440aebecba820081aacb2@o309267.ingest.sentry.io/5243553'
	});
}

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'name': 'sk-news-backend',
	'brand': 'sk News Backend',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'pug',

	'emails': 'templates/emails',

	'auto update': true,
	'session': true,
	'session store' : 'mongo',
	'session options': { cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1e3 } },

	'auth': true,
	'user model': 'KsUser',
	'logger': false,
});

keystone.set('i18n', i18n);
keystone.set('acrud', acrud);
keystone.set('Sentry', Sentry);
keystone.set('debug', debug);

keystone.set('useLogContext', function (reqContext, logVariable, namespace) {
	if (reqContext && reqContext.logId) {
		return reqContext.logId(namespace);
	}

	return (...args) => {
	  args = args.map( s => {
	    if (typeof s === 'object') {
	      try {
	        // mongoose object
          if (s.toObject) {
            return JSON.stringify(s.toObject());
          }

	        return JSON.stringify(s);
	      } catch {
	        return s;
	      }
	    }

	    return s;
	  })

	  let paterns = args.map( arg => typeof arg === 'string' ? '%s' : '%o')
	  paterns = paterns.join(' ');

	  logVariable.apply(null, [paterns, ...args]);
	}
})

keystone.set('getFileName', (filename) => {
	return  path.basename(filename).split('.')[0];
})

// Load your project's Models
keystone.import('models');

// Load Statics and Settings
keystone.Statics = requireDir('statics');
keystone.Settings = requireDir('settings');
keystone.Helpers = requireDir('helpers');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
});

// Load your project's Routes
keystone.set('routes', require('./routes'));


// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	'posts': ['posts', 'post-categories'],
	'galleries': 'galleries',
	'ks-users': 'ks-users',

	'System': [
		'Counting',
		'Device',
		'User',
		'RegisterProvider'
	],

	'News': [
		'categories',
		'hosts',
		'Style',
		'feeds',
		'Rss',
		'Baomoi',
		'CrawlLog',
		'CmdExec',
	],
	'Google News': [
		'NewsTopic',
		'NewsStory',
		'UserSearch'
	]
});

// Start Keystone to connect to your database and initialise the web server

if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
	console.log('----------------------------------------'
		+ '\nWARNING: MISSING MAILGUN CREDENTIALS'
		+ '\n----------------------------------------'
		+ '\nYou have opted into email sending but have not provided'
		+ '\nmailgun credentials. Attempts to send will fail.'
		+ '\n\nCreate a mailgun account and add the credentials to the .env file to'
		+ '\nset up your mailgun integration');
}

let redisService = require('./routes/services/RedisService');

let events = require('events');
keystone.keystoneEmitter = new events.EventEmitter();

keystone.emit = function (eventname) {
	keystone.keystoneEmitter.emit(eventname);
};

keystone.on = function (eventname, callback) {
	keystone.keystoneEmitter.on(eventname, callback);
};

process.on('uncaughtException', (error) => {
  console.log(`====> uncaughtException=`, error);
  utils.sendMessageTelegram(`[news-backend] uncaughtException: ${error.toString()}`);
  Sentry.captureException(error);
});

async.parallel({
	start_keystone: (next) => {
		keystone.start(next)
	},
	init_redis: redisService.init
}, (err, result) => {
	if (err) {
		console.log('start keystone fail, err=', err);
		return;
	}

	let queueService = require('./routes/services/QueueService');

	console.log('keystone start done. PORT:', process.env.PORT);
	keystone.emit('ready');
})

// keystone.start(() => {
// 	console.log('keystone start done.');
// 	keystone.emit('ready');
// });

module.exports = keystone;
