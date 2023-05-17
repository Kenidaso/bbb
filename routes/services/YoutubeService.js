const engine = require('../../engines/youtube');

const ytbService = {};
module.exports = ytbService;

ytbService.news = (callback) => {
  engine.news(callback);
}

ytbService.getFeeds = (category, opts, callback) => {
  engine.getFeeds(category, opts, callback);
}
