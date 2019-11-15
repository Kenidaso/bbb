const keystone = require('keystone');
const async = require('async');
const unidecode = require('unidecode');

const Category = keystone.list('Category');

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
	Category.model.find({}, '_id slug display title', (err, categories) => {
		if (err) return done(err);
		if (!categories) return done();

		async.each(categories, (category, cbEach) => {
			let slug = unidecode(category.display);
			slug = slug.toLowerCase();

			while (slug.indexOf('  ') > -1) {
				slug = slug.replace(/\s\s/g, ' ');
			}

			slug = slug.replace(/\s/g, '-');

			while (slug.indexOf('--') > -1) {
				slug = slug.replace(/\-\-/g, '-');
			}

			console.log('slug=', slug);
			let c = 0;

			let _save = (count, done) => {
				category.slug = slug;
				if (count > 0) category.slug = `${slug}-${count}`;

				category.save((err) => {
					if (err) {
						c++;
						return _save(c, done);
					}
					return done();
				});
			}

			_save(c, cbEach);
		}, done)
	})
};