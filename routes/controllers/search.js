const Response = require('../services/Response');
const GoogleNewsService = require('../services/GoogleNewsService');

let SearchCtrl = {};
module.exports = SearchCtrl;

SearchCtrl.ggnSearch = (req, res) => {
	let { search, type } = req.body;

	type = type || 'rss';

	let moduleSearch = GoogleNewsService.getEntriesFromRss;

	if (type === 'html') moduleSearch = GoogleNewsService.search;

	moduleSearch(search, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	});
}

SearchCtrl.searchFromGgSearch = (req, res) => {
	let { search, options } = req.body;

	GoogleNewsService.searchFromGgSearch(search, options, (err, results) => {
		if (err) return Response.error(req, res, err, results);
		return Response.success(req, res, results);
	});
}

SearchCtrl.queueSearch = () => {

}
