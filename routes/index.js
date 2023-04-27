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

const routers = require('./routers');

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

    let inWhiteList = whitelist.some((host) => {
      return !origin || origin.includes(host);
    })

    // if (whitelist.indexOf(origin) !== -1) {
    //   callback(null, true)
    // } else {
    //   // callback(ERROR_CODE.ECORSNOTALLOWED)
    //   callback('ECORSNOTALLOWED')
    // }

    return callback(inWhiteList ? null: 'ECORSNOTALLOWED', inWhiteList)
  },

  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
} : {}

// Setup Route Bindings
exports = module.exports = function (app) {
  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  app.use(addRequestId);

  app.use('/dashboard', routers.dashboard);

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

  app.use((req, res, next) => {
    res.set('app-request-timestamp', req.headers['app-request-timestamp']);
    res.set('x-start', req.startAt.getTime());
    res.set('x-start-date', req.startAt.toGMTString());

    return next();
  })

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

  app.options('*', cors());

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

  // X-DNS-Prefetch-Control: https://github.com/helmetjs/dns-prefetch-control
  app.use(helmet.dnsPrefetchControl({ allow: false }));
  // https://github.com/helmetjs/referrer-policy
  // app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
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

  app.use((req, res, next) => {
    const headers = req.headers;

    if (headers.referer && headers.referer.indexOf('sahamportal') > -1) {
      return next('ECORSNOTALLOWED');
    }

    if (headers.via && headers.via.indexOf('proxy-fix-squid-pwd-float') > -1) {
      return next('ECORSNOTALLOWED');
    }

    return next();
  })

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

  app.use('/server', routers.server);

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

  app.use('/feed', routers.feed);
  app.use('/ggn', routers.googleNews);
  app.use('/device', routers.device);
  app.use('/ggt', routers.googleTrend);
  app.use('/gg', routers.google);
  app.use('/voz', routers.voz);

  app.post('/autocomplete', routes.controllers.gg.autocompleteMerge); // autocomplete by google search

  app.use('/q', routers.queue);
  app.get('/task/status/:taskId', routes.controllers.task.status);

  app.use('/users', routers.user);

  // firebase
  app.use('/firebase', routers.firebase);

  app.post('/tele/webhook/cky-tele-bot', routes.controllers.telegram.processUpdate);
  app.post('/tele/send-to-group', upload.single('image'), routes.controllers.telegram.sendMessage2Group);

  app.post('/heroku/restart', routes.controllers.heroku.restart);

  app.post('/fb/sharing-debugger', routes.controllers.fb.scrapedSharingDebugger);

  app.use('/posts', routers.post);
  app.use('/comments', routers.comment);

  app.post(acrud.ROUTE, acrud.controller);

  // The error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());

  app.use(middleware.handleError);
};
