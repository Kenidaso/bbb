const keystone = require('keystone');
const async = require('async');
const Host = keystone.list('Host');

const hosts = [
	{ name: 'VNEXPRESS', website: 'https://vnexpress.net' },
	{ name: 'ZINGNEWS', website: 'https://news.zing.vn' },
];

function createHost (host, done) {
	const newHost = new Host.model(host);

	newHost.save(function (err) {
		if (err) {
			console.error('Error adding host ' + host.website + ' to the database:');
			console.error(err);
		} else {
			console.log('Added host ' + host.website + ' to the database.');
		}

		done(err);
	});

}

exports = module.exports = function (done) {
	async.forEach(hosts, createHost, done);
};