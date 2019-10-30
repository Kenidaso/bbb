const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Html Model
 * =============
 */

const Html = new keystone.List('Html', {
	map: { name: 'title' },
	autokey: { from: 'title', path: 'slug', unique: true },
	track: {
		createdAt: true,
		createdBy: true,
		updatedAt: true,
		updatedBy: true,
	},
	perPage: 20,
	defaultColumns: 'title url category host',
	defaultSort: '-updatedAt',
});

Html.add({
	title: { type: String, reqired: true, initial: true },
	url: { type: Types.Url, required: true, initial: true },
	category: { type: Types.Relationship, ref: 'Category', initial: true },
	host: { type: Types.Relationship, ref: 'Host', initial: true },
});

Html.register();
