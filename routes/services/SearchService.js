const requireDir = require('require-dir');
const async = require('async');
const _ = require('lodash');
const moment = require('moment');

const engine = require('../../engines/googleNews');

const queueService = require('./QueueService');
const redisService = require('./RedisService');

const utils = require('../../helpers/utils');

const Statics = requireDir('../../statics');

const TASK = Statics.task;
const TTL_MIXSEARCH = 1 * 60 * 30; // 30 mins

const SearchService = {};
module.exports = SearchService;

SearchService.queueSearch = (keyword, options = {}, callback) => {
  if (!keyword) return callback('EMISSKEYWORD');

  options = options || {}

  let taskName = TASK.SEARCH;
  let key = utils.buildTaskKey();

  let data = {
    taskName,
    keyword,
    options,
    key,
  }

  queueService.push(data, callback);
}

SearchService.mixSearch = (keyword, options = {}, callback) => {
  options = options || {};
  options['isGetOriginLink'] = true;

  options['page'] = options['page'] || 1;
  options['limit'] = options['limit'] || 20;

  let keyCache = `mixSearch:${keyword}:${JSON.stringify(options)}`;

  redisService.get(keyCache, (errC, value) => {
    value = utils.safeParse(value);

    if (!errC && value) {
      console.log('use cache key=', keyCache);
      return callback(null, value);
    }

    async.parallel({
      gg_rss: (next) => {
        /*
          [
            {
              "link": "https://tuoitre.vn/vi-sao-noi-chung-moi-virus-corona-o-trung-quoc-bat-thuong-20200217092101198.htm",
              "title": "Vì sao nói chủng mới virus corona ở Trung Quốc bất thường? - Tuổi Trẻ Online",
              "contentSnippet": "Vì sao nói chủng mới virus corona ở Trung Quốc bất thường?    Tuổi Trẻ Online",
              "publishedDate": "Mon, 17 Feb 2020 03:08:00 GMT",
              "author": "",
              "content": "Vì sao nói chủng mới virus corona ở Trung Quốc bất thường?  Tuổi Trẻ Online"
            }
          ]
        */

        engine.getEntriesFromRss(keyword, options, (err, result) => {
          if (err || !result || result.length == 0) return next(null, []);

          result = result.map((r) => {
            r.description = r.contentSnippet || r.content;
            r.publishDate = moment(r.publishedDate).format();

            return r;
          })

          return next(null, result);
        })
      },

      gg_search: (next) => {
        /*
          {
            "articles": [
              {
                "title": "Người dân chủ động hạn chế qua lại Campuchia",
                "link": "https://news.google.com/articles/CBMiVWh0dHBzOi8vdHVvaXRyZS52bi9uZ3VvaS1kYW4tY2h1LWRvbmctaGFuLWNoZS1xdWEtbGFpLWNhbXB1Y2hpYS0yMDIwMDIxNzE0NDcxMjI0Ni5odG3SAQA?hl=vi&gl=VN&ceid=VN%3Avi",
                "image": "https://lh3.googleusercontent.com/proxy/e--cTIFcWwPcNv1LatKeMG3eDMNit0O1qDdYuYJTeOHtZsLkJbwdrsQ3B3hXQXh0Hrie_VXPUbtIK4OFGLS5t4mH2rt-YGSUjQwP4dfUNsulZtLEwi_p23u40yYfFHlQ8UUbVDC4rNC7Z0ptK4Wh4Jb0NzeM2ZszLMNYtCeUSPX7PANbM_X4fOGAdPMh--kq03jWxmeJFRXDQGu-9E_JyxowOp_GDQ=-p-h200-w200-rw",
                "paperImg": "https://encrypted-tbn2.gstatic.com/faviconV2?url=https://tuoitre.vn&client=NEWS_360&size=96&type=FAVICON&fallback_opts=TYPE,SIZE,URL",
                "paperName": "Tuổi Trẻ Online",
                "publishDate": "2020-02-17T08:01:00Z",
                "originLink": "https://tuoitre.vn/nguoi-dan-chu-dong-han-che-qua-lai-campuchia-20200217144712246.htm"
              }
            ],
            "linkStories": [
              "https://news.google.com/news?ncl=dBh_WT90uGRoU5M9v0wbJaGOchpXM&q=corona&lr=Vietnamese&hl=vi",
              "https://news.google.com/news?ncl=dHjmGZjI2wjVo3Mr7WoFFAFRTkSHM&q=corona&lr=Vietnamese&hl=vi",
              "https://news.google.com/news?ncl=d6jcqktbZqYS_eM_uSpwo_KI6b7yM&q=corona&lr=Vietnamese&hl=vi"
            ]
          }
        */

        engine.getFeedFromGgSearch(keyword, options, (err, result) => {
          if (err || !result || !result.articles || result.articles.length == 0) return next(null, []);

          result = result.articles;

          _.remove(result, function (f) {
            return !f.originLink;
          });

          result = result.map((r) => {
            r.link = r.originLink;
            delete r.originLink;

            if (r.image) r.image = utils.scaleImageGg(r.image, 3);

            return r;
          })

          return next(null, result);
        })
      }
    }, (err, result) => {
      // never return error, if error will return empty array

      let feeds = [...result.gg_rss, ...result.gg_search];

      // remove link duplicate
      feeds = _.unionBy(feeds, 'link');

      // sort by publishDate
      feeds = _.orderBy(feeds, [
        function (f) {
          return Number(moment(f.publishDate).format('X'));
        }
      ], [
        'desc'
      ]);

      if (options['page']) {
        let page = options.page;
        let limit = options.limit;
        let skip = (page - 1) * limit;

        feeds = _.slice(feeds, skip, (skip + limit))
      }

      redisService.set(keyCache, feeds, TTL_MIXSEARCH);

      return callback(null, feeds);
    })
  })
}
