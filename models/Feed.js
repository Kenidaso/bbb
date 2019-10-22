const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Feed Model
 * =============
 */

const Feed = new keystone.List('Feed', {
	map: { name: 'title' },
	autokey: { from: 'title', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'title content heroImage',
	defaultSort: '-updatedAt'
});

Feed.add({
	title: { type: String, required: true },
	summary: { type: Types.Textarea },
	content: { type: Types.Textarea },
	html: { type: Types.Html, wysiwyg: true },
	heroImage: { type: Types.CloudinaryImage },
	images: { type: Types.CloudinaryImages },
});

Feed.register();
