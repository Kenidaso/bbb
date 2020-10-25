const dashboard = require('./dashboard');
const feed = require('./feed');
const googleNews = require('./google-news');
const device = require('./device');
const googleTrend = require('./google-trend');
const google = require('./google');
const queue = require('./queue');
const user = require('./user');
const firebase = require('./firebase');
const server = require('./server');

module.exports = {
	dashboard,
	feed,
	googleNews,
	device,
	googleTrend,
	queue,
	google,
	user,
	firebase,
	server
}