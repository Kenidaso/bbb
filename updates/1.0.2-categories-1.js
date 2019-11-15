const keystone = require('keystone');
const async = require('async');
const unidecode = require('unidecode');

const Category = keystone.list('Category');
const Feed = keystone.list('Feed');

exports = module.exports = function (done) {
	Category.model.find({
		slug: /\-1/
	}, '_id slug', (err, categories) => {
		async.each(categories, (category, cbEach) => {
			let slug = category.slug.replace('-1', '');

			console.log('-->', category.slug, slug);

			Category.model.findOne({
				slug
			}, '_id', (err2, cate) => {
				if (err2) return cbEach(err2);
				if (!cate) return cbEach('ESLUGNOTFOUND', slug);

				console.log('update', category.slug, '-->', cate);

				Feed.model.findOneAndUpdate({
					category: category._id
				}, {
					$set: {
						category: [ cate._id ]
					}
				}, {
					multi: true
				}, (err3, result) => {
					if (err3) return cbEach(err3);

					console.log('remove ', category.slug);

					Category.model.remove({
						slug: category.slug
					}, cbEach);
				})
			});
		}, done)
	})
};