
const queueService = require('./QueueService');

const utils = require('../../helpers/utils');

const TASK_MAP = {
	SEARCH: 'SEARCH'
}

const SearchService = {};
module.exports = SearchService;

SearchService.queueSearch = (keyword, options = {}, callback) => {
	if (!keyword) return callback('EMISSKEYWORD');

	options = options || {}

	let taskName = TASK_MAP.SEARCH;
	let key = utils.buildTaskKey();

	let data = {
		taskName,
		keyword,
		key,
	}

	queueService.push(data, callback);
}