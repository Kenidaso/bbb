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
const jwt = require('express-jwt');
const addRequestId = require('express-request-id')();
const morgan = require('morgan');
const helmet = require('helmet');
const crypto = require('crypto');
const compression = require('compression');
const debug = require('debug');
const rateLimit = require("express-rate-limit");
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const middleware = require('./middleware');
const importRoutes = keystone.importer(__dirname);

const cors = require('cors');

const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

// const Response = require('./services/Response');
const JwtService = require('./services/JwtService');

const { Statics } = keystone;
const NODE_ENV = process.env.NODE_ENV || 'development';

const ERROR_CODE = Statics.errorCode;

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
const controllers = importRoutes('./controllers');
const views = importRoutes('./views');

const services = importRoutes('./services');

let warningMsg = '';
for (let name in services) {
  if (!services[name].log) {
    warningMsg += `Service \`${name}\` don't expose \`log\` function\n`;
  }
}

if (warningMsg.length) {
  let dash = '----------------------------------------';
  console.log(dash);
  console.log(`WARNING: LOG FUNCTION IN SERVICE`);
  console.log(dash);
  console.log(warningMsg);
}

const routes = {
  views,
  controllers,
};

const i18n = keystone.get('i18n');
const acrud = keystone.get('acrud');
const Sentry = keystone.get('Sentry');

morgan.token('id', function getId (req) {
  return req.id
})

morgan.token('ISODate', function getId (req) {
  return new Date().toISOString();
})

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }

  // fallback to standard filter function
  return compression.filter(req, res)
}

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5 // limit each IP to 100 requests per windowMs
});

const csrfProtection = csrf({ cookie: true });

const whitelist = [
  'https://feed24h.net',
  'https://www.feed24h.net',

  'http://feed24h.net',
  'http://www.feed24h.net',

  'herokuapp.com',

  'chickyky-by-pass',
  'Chickyky-by-pass',

  'localhost',
  'http://localhost',
  '127.0.0.1',

  '157.230.253.180',
]

const corsOptions = NODE_ENV === 'production' ? {
  origin: function (origin, callback) {
    console.log('cors origin=', origin);

    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      // callback(ERROR_CODE.ECORSNOTALLOWED)
      callback('ECORSNOTALLOWED')
    }
  },
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
} : {}

// Setup Route Bindings
exports = module.exports = function (app) {
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  app.use(addRequestId);

  app.use(function (req, res, next) {
    req.startAt = new Date();

    app.disable('x-powered-by');

    req.query = req.query || {};
    if (!req.query.lang && req.headers['accept-language']) {
      req.query.lang = req.headers['accept-language'];
    }

    req.logId = (nameSpace) => {
      let log = debug(nameSpace);
      let isExtend = false;

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

        if (!isExtend && req.id) {
          log = log.extend(req.id);
          isExtend = true;
        }

        log.apply(null, [paterns, ...args]);
      }
    }

    next();
  });

  app.use(middleware.addFnFormatResponse);
  app.use(middleware.printDetailRequest);

  // limit request
  /*app.use((req, res, next) => {
    console.log(`--> ${req.url}`);

    return limiter(req, res, next);
  });*/

  // app.use(morgan('combined'));
  // app.use(morgan('[:id] :remote-addr - :remote-user [:date[iso]] ":method :url" :status ":referrer" ":user-agent" - :response-time ms'));

  app.use(morgan(function (tokens, req, res) {
    let id = tokens.id(req, res);
    let remoteAddr = tokens['remote-addr'](req, res);
    let remoteUser = tokens['remote-user'](req, res) || '';
    let isoDate = tokens['ISODate'](req, res);
    let method = tokens.method(req, res);
    let url = tokens.url(req, res);
    let status = tokens.status(req, res);
    let referrer = tokens.referrer(req, res) || '-';
    let userAgent = tokens['user-agent'](req, res) || '-';
    let responseTime = tokens['response-time'](req, res);

    return `[${id.red.bgYellow.bold}] ${remoteAddr} - ${remoteUser} [${isoDate.blue.bgWhite}] "${method.red.bgGreen} ${url.bgGreen}" ${status} "${referrer}" "${userAgent}" - ${responseTime} ms`;
  }))

  // X-Frame-Options: https://github.com/helmetjs/frameguard
  app.use(helmet.frameguard({ action: 'deny' }));
  // X-XSS-Protection: https://github.com/helmetjs/x-xss-protection
  app.use(helmet.xssFilter());
  // Strict-Transport-Security: https://github.com/helmetjs/hsts
  app.use(helmet.hsts({
    maxAge: 1296000, // 15 days in seconds
    includeSubDomains: true,
    preload: true
  }));
  // X-Powered-By: http://expressjs.com/en/4x/api.html#app.settings.table
  app.disable('x-powered-by');
  // X-Download-Options: https://github.com/helmetjs/ienoopen
  app.use(helmet.ieNoOpen());
  // X-Content-Type-Options: https://github.com/helmetjs/dont-sniff-mimetype
  app.use(helmet.noSniff());
  // Content-Security-Policy: https://github.com/helmetjs/csp
  app.use(function nonceGenerator(req, res, next) {
    res.locals.nonce = crypto.randomBytes(16).toString('hex');
    next();
  });
  /* eslint-disable quotes */
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [ "'self'", (req, res) => `'nonce-${res.locals.nonce}'` ],
      styleSrc: [ "'self'", (req, res) => `'nonce-${res.locals.nonce}'` ],
      baseUri: ["'self'"],
      connectSrc: [ "'self'", 'wss:' ],
      frameAncestors: ["'none'"],
      reportUri: 'https://feed24h.net'
    },
    setAllHeaders: false,
    reportOnly: false,
    browserSniff: false
  })); /* eslint-enable */

  // X-DNS-Prefetch-Control: https://github.com/helmetjs/dns-prefetch-control
  app.use(helmet.dnsPrefetchControl({ allow: false }));
  // https://github.com/helmetjs/referrer-policy
  app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
  // https://helmetjs.github.io/docs/expect-ct/
  app.use(helmet.expectCt({
    enforce: true,
    maxAge: 1296000,
    // reportUri: config.expectCT.reportUri
  }));

  // parse cookies
  // we need this because "cookie" is true in csrfProtection
  app.use(cookieParser());
  // app.use(csrfProtection);

  // app.all('*', function (req, res, next) {
  //   res.cookie('XSRF-TOKEN', req.csrfToken())
  //   return next();
  // })

  app.use(i18n.init);

  // compress responses
  app.use(compression({ filter: shouldCompress }));

  app.use(hpp());

  app.use('/ping', /*middleware.validateDynamicFeed24hToken,*/ (req, res) => {
    return res.success(req, res, {
      id: req.id,
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
      },
    });
  });

  // Views
  app.get('/', routes.views.index);
  app.get('/blog/:category?', routes.views.blog);
  app.get('/blog/post/:post', routes.views.post);
  app.get('/gallery', routes.views.gallery);

  app.use(cors(corsOptions));

  app.get('/image-of-day', routes.controllers.image.imageOfDay);

  app.get('/test/sentry', (req, res) => {
    throw new Error('Test Sentry ...');
  })

  app.get('/categories', middleware.validateDynamicFeed24hToken, routes.controllers.feed.getCategories);
  app.get('/content/:slug', middleware.validateDynamicFeed24hToken, routes.controllers.feed.getContent);
  app.get('/view/:slug', middleware.validateDynamicFeed24hToken, routes.controllers.feed.incView);

  // app.use('/feed', middleware.validateDynamicFeed24hToken);
  app.post('/feed/raw', routes.controllers.feed.getRawContent);
  app.get('/feed/hotnews', middleware.validateDynamicFeed24hToken, routes.controllers.feed.getHotNews);
  app.get('/feed/:category/:page?', middleware.validateDynamicFeed24hToken, routes.controllers.feed.getFeeds);

  app.use('/ggn', middleware.validateDynamicFeed24hToken);
  app.post('/ggn/search', middleware.trackSearch, routes.controllers.search.ggnSearch);
  app.post('/ggn/search-ggs', middleware.trackSearch, routes.controllers.search.searchFromGgSearch);

  app.post('/device/register', limiter, middleware.validateDynamicFeed24hToken, routes.controllers.device.register);

  app.post('/feed/upsert', routes.controllers.feed.upsertFeed);

  app.post('/autocomplete', routes.controllers.gg.autocompleteMerge); // autocomplete by google search

  app.use('/ggt', middleware.validateDynamicFeed24hToken);
  app.post('/ggt/yis', routes.controllers.trends.yearInSearch); // Year in Search, top search in year
  app.post('/ggt/autocomplete', routes.controllers.trends.autocomplete); // autocomplete with region
  app.post('/ggt/daily', routes.controllers.trends.dailytrends);
  app.post('/ggt/realtime', routes.controllers.trends.realtimetrends);

  app.use('/gg', middleware.validateDynamicFeed24hToken);
  app.post('/gg/autocomplete', routes.controllers.gg.autocomplete); // autocomplete by google search
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

  app.use('/q', middleware.validateDynamicFeed24hToken);
  app.post('/q/search', middleware.trackSearch, routes.controllers.search.queueSearch); // push search into queue
  app.post('/q/push-task', limiter, middleware.trackSearchInPushTask, routes.controllers.queue.pushTask); // push task
  app.get('/task/status/:taskId', routes.controllers.task.status);

  app.use('/user', middleware.validateDynamicFeed24hToken);
  app.post('/user/register-guest', limiter, routes.controllers.user.registerGuest);
  // app.get('/user/verify-token', jwt({ secret: JwtService.JWT_SECRET }));
  app.get('/user/verify-token', middleware.verifyToken, (req, res, next) => {
    return res.json(req.user);
  });

  // firebase
  app.use('/firebase', middleware.validateDynamicFeed24hToken);
  app.post('/firebase/verify-access-token', routes.controllers.firebase.verifyAccessToken);
  app.get('/firebase/generate-access-token', routes.controllers.firebase.generateAccessToken);
  app.post('/firebase/refresh-access-token', routes.controllers.firebase.refreshAccessToken);

  app.post('/tele/webhook/cky-tele-bot', routes.controllers.telegram.processUpdate);
  app.post('/tele/send-to-group', upload.single('image'), routes.controllers.telegram.sendMessage2Group);

  app.post('/heroku/restart', routes.controllers.heroku.restart);

  app.post('/fb/sharing-debugger', routes.controllers.fb.scrapedSharingDebugger);

  app.post(acrud.ROUTE, acrud.controller);

  // The error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());

  app.use(middleware.handleError);
  // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
  // app.get('/protected', middleware.requireUser, routes.views.protected);
};
