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

	app.get('/feed/:category/:page?', routes.controllers.feed.getFeeds);
	app.post('/ggn/search', middleware.trackSearch, routes.controllers.search.ggnSearch);
	app.post('/device/register', routes.controllers.device.register);

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);
};
