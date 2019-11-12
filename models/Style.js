const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Style Model
 * =============
 */

const Style = new keystone.List('Style', {
	map: { name: 'name' },
	autokey: { from: 'name', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'name url category host',
	defaultSort: '-updatedAt'
});

Style.add({
	name: { type: String, reqired: true, initial: true },
	description: { type: String, initial: true },
	style: { type: Types.Html, reqired: true, initial: true },
});

Style.register();
