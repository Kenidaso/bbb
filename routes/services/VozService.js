const engine = require('../../engines/voz');

const vozService = {};
module.exports = vozService;

vozService.getThreadsOfForum = (params,  callback) => {
  engine.getThreadsOfForum(params, callback);
}

vozService.getThreadDetail = (params,  callback) => {
  engine.getThreadDetail(params, callback);
}
