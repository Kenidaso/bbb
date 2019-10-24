const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Rss Model
 * =============
 */

const Rss = new keystone.List('Rss', {
	map: { name: 'title' },
	autokey: { from: 'title', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'title url category host',
	defaultSort: '-updatedAt'
});

Rss.add({
	title: { type: String, reqired: true, initial: true },
	url: { type: Types.Url, required: true, initial: true },
	category: { type: Types.Relationship, ref: 'Category', initial: true },
	host: { type: Types.Relationship, ref: 'Host', initial: true },
});

Rss.register();
