const engine = require('../../engines/youtube');

const ytbService = {};
module.exports = ytbService;

ytbService.news = (callback) => {
  engine.news(callback);
}

ytbService.getFeeds = (category, opts, callback) => {
  engine.getFeeds(category, opts, callback);
}

ytbService.exploreTrending = (explore, opts, callback) => {
  engine.exploreTrending(explore, opts, callback);
}

ytbService.getExplore = (explore, opts, callback) => {
  engine.getExplore(explore, opts, callback);
}
