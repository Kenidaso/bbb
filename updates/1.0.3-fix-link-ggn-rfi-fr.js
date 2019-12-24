const keystone = require('keystone');
const async = require('async');

const Category = keystone.list('Category');
const Feed = keystone.list('Feed');

const utils = require('../helpers/utils');
const ggn = require('../engines/googleNews');

exports = module.exports = function (done) {
	Feed.model.find({
		link: /rfi\.fr/
	}, '_id slug title metadata', (err, feeds) => {
		async.each(feeds, (feed, cbEach) => {
			if (!feed || !feed.metadata) return cbEach();

			let ggnLink = feed.metadata.linkArticle;
			if (!ggnLink) return cbEach();

			ggn.getLinkRedirect(ggnLink, (err, originLink) => {
				if (!originLink) return cbEach();

				console.log(`link= ${originLink}`);

				feed.link = originLink;
				feed.save((err) => {
					if (err) console.log('save err=', err);

					return cbEach();
				});
			});
		}, done)
	})
};