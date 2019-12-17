const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Baomoi Model
 * =============
 */

const Baomoi = new keystone.List('Baomoi', {
	map: { name: 'title' },
	autokey: { from: 'title', path: 'slug', unique: true },
	track: {
		createdAt: true,
		updatedAt: true,
	},
	perPage: 50,
	defaultColumns: 'title url category host',
	defaultSort: '-updatedAt',
});

Baomoi.add({
	title: { type: String, reqired: true, initial: true },
	url: { type: Types.Url, required: true, initial: true },
	category: { type: Types.Relationship, ref: 'Category', initial: true, many: true },
	host: { type: Types.Relationship, ref: 'Host', initial: true },
});

Baomoi.register();
