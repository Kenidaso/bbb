const requireDir = require('require-dir');
const async = require('async');
const _ = require('lodash');
const moment = require('moment');

const utils = require('../../helpers/utils');

const Statics = requireDir('../../statics');

const searchService = require('./SearchService');

const TASK = Statics.task;
const UPSERT_MAP_LIMIT = 10;

const TaskService = {};
module.exports = TaskService;

TaskService[TASK.SEARCH] = (taskParams, callback) => {
  searchService.mixSearch(taskParams.keyword, taskParams.options, (err, result) => {
    if (err) return callback(err);

    async.mapLimit(result, UPSERT_MAP_LIMIT, (feed, cbMap) => {
      /*
        {
          "link": "https://webthethao.vn/lien-minh-huyen-thoai/lich-thi-dau-va-ket-qua-vong-loai-dota-2-esl-one-los-angeles-2020-115714.htm",
          "title": "Kết quả vòng loại Dota 2 ESL One Los Angeles 2020 - Web Thể Thao (Thể Thao 24h)",
          "contentSnippet": "Kết quả vòng loại Dota 2 ESL One Los Angeles 2020    Web Thể Thao (Thể Thao 24h)",
          "publishedDate": "Sun, 09 Feb 2020 08:00:00 GMT",
          "author": "",
          "content": "Kết quả vòng loại Dota 2 ESL One Los Angeles 2020  Web Thể Thao (Thể Thao 24h)",
          "description": "Kết quả vòng loại Dota 2 ESL One Los Angeles 2020    Web Thể Thao (Thể Thao 24h)",
          "publishDate": "2020-02-09T15:00:00+07:00"
        }
      */

      let { link, title, description, publishDate, image } = feed;

      let find = {
        link
      }

      let update = {
        $set: {
          link,
          title,
          description,
          publishDate
        }
      }

      if (image && image.length > 4) {
        update['$set']['heroImage'] = {
          url: image
        }
      }

      utils.reqUpsertFeed(find, update, (errUpsert, resUpsert) => {
        /*
          {
            "error": 0,
            "data": {
              "__v": 0,
              "slug": "dich-do-virus-corona-ha-noi-khuyen-khich-nop-ho-so-quyet-toan-thue-qua-buu-dien-bnews-vn",
              "updatedAt": "2020-02-18T15:34:06.386Z",
              "createdAt": "2020-02-18T15:34:06.312Z",
              "link": "https://bnews.vn/dich-do-virus-corona-ha-noi-khuyen-khich-nop-ho-so-quyet-toan-thue-qua-buu-dien/147945.html",
              "title": "Dịch do virus Corona: Hà Nội khuyến khích nộp hồ sơ quyết toán thuế qua bưu điện - Bnews.vn",
              "description": "Dịch do virus Corona: Hà Nội khuyến khích nộp hồ sơ quyết toán thuế qua bưu điện    Bnews.vn",
              "publishDate": "2020-02-18T09:26:33.000Z",
              "videos": [],
              "images": [],
              "contentOrder": [],
              "status": 1,
              "view": 0,
              "topic": [],
              "story": [],
              "category": [],
              "_id": "5e4c03eedaf99907f10934bc"
            },
            "message": "Thành công"
          }
        */
        if (errUpsert) return cbMap(null, null);

        resUpsert = utils.safeParse(resUpsert);
        if (!resUpsert || !resUpsert.data) return cbMap(null, null);

        let data = resUpsert.data;

        let res = {
          slug: data.slug,
          link: data.link,
          title: data.title,
          publishDate: data.publishDate,
        }

        if (data.description) res.description = data.description;
        if (data.heroImage && data.heroImage.url) res.heroImage = data.heroImage;
        if (data.rawHtml) res.rawHtml = data.rawHtml;

        return cbMap(errUpsert, res);
      })
    }, (err2, results) => {
      return callback(err2, results);
    })
  })
}