const engine = require('../../engines/youtube');

const ytbService = {};
module.exports = ytbService;

ytbService.news = (callback) => {
  engine.news(callback);
}

ytbService.getFeeds = (category, callback) => {
  engine.getFeeds(category, callback);
}
