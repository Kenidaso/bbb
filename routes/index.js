/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

const keystone = require('keystone');

const middleware = require('./middleware');
const importRoutes = keystone.importer(__dirname);

const cors = require('cors');

const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

const Response = require('./services/Response');

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
const routes = {
	views: importRoutes('./views'),
	controllers: importRoutes('./controllers'),
};

const i18n = keystone.get('i18n');
const acrud = keystone.get('acrud');

// Setup Route Bindings
exports = module.exports = function (app) {

	app.use(i18n.init);

	app.use(function (req, res, next) {
	  app.disable('x-powered-by');
	  next();
	});

	app.use(cors());

	app.get('/ping', (req, res) => {
	  return Response.success(req, res, {
	    message: 'pong',
	    query: req.query,
	    params: req.params,
	    path: req.path,
	    ip: req.ip,
	    ips: req.ips,
	    hostname: req.hostname,
	    headers: req.headers,
	    i18n: {
	      getLocales: res.locals.i18n.getLocales()
	    }
	  });
	});

	// Views
	app.get('/', routes.views.index);
	app.get('/blog/:category?', routes.views.blog);
	app.get('/blog/post/:post', routes.views.post);
	app.get('/gallery', routes.views.gallery);

	app.get('/image-of-day', routes.controllers.image.imageOfDay);

	app.get('/categories', routes.controllers.feed.getCategories);
	app.get('/content/:slug', routes.controllers.feed.getContent);
	app.post('/feed/raw', routes.controllers.feed.getRawContent);
	app.get('/feed/:category/:page?', routes.controllers.feed.getFeeds);
	app.post('/ggn/search', middleware.trackSearch, routes.controllers.search.ggnSearch);
	app.post('/ggn/search-ggs', middleware.trackSearch, routes.controllers.search.searchFromGgSearch);
	app.post('/device/register', routes.controllers.device.register);

	app.post('/feed/upsert', routes.controllers.feed.upsertFeed);

	app.post('/autocomplete', routes.controllers.gg.autocompleteMerge); // autocomplete by google search
	app.post('/gg/autocomplete', routes.controllers.gg.autocomplete); // autocomplete by google search
	app.post('/ggt/yis', routes.controllers.trends.yearInSearch); // Year in Search, top search in year
	app.post('/ggt/autocomplete', routes.controllers.trends.autocomplete); // autocomplete with region
	app.post('/ggt/daily', routes.controllers.trends.dailytrends);
	app.post('/ggt/realtime', routes.controllers.trends.realtimetrends);

	app.post('/gg/standing-of-league', routes.controllers.gg.standingOfLeague);
	app.post('/gg/stat-of-league', routes.controllers.gg.statOfLeague);
	app.post('/gg/news-of-league', routes.controllers.gg.newsOfLeague);
	app.post('/gg/player-of-league', routes.controllers.gg.playerOfLeague);
	app.post('/gg/match-of-league', routes.controllers.gg.matchOfLeague);
	app.post('/gg/player-stat', routes.controllers.gg.statOfPlayer);
	app.post('/gg/timeline-of-match', routes.controllers.gg.timelineOfMatch);
	app.post('/gg/lineups-of-match', routes.controllers.gg.lineupsOfMatch);
	app.post('/gg/stats-of-match', routes.controllers.gg.statsOfMatch);
	app.post('/gg/news-of-match', routes.controllers.gg.newsOfMatch);
	app.post('/gg/layout-header-of-match', routes.controllers.gg.layoutHeaderOfMatch);

	app.post('/q/search', routes.controllers.search.queueSearch); // push search into queue
	app.get('/task/status/:taskId', routes.controllers.task.status);

	app.post('/tele/webhook/cky-tele-bot', routes.controllers.telegram.processUpdate);
	app.post('/tele/send-to-group', upload.single('image'), routes.controllers.telegram.sendMessage2Group);

	app.post('/heroku/restart', routes.controllers.heroku.restart);

	app.post(acrud.ROUTE, acrud.controller);

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);
};
