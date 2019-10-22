const keystone = require('keystone');
const Types = keystone.Field.Types;

let configModel = require('../statics/configModel');
let { host_names } = configModel;
/**
 * Host Model
 * =============
 */

const Host = new keystone.List('Host', {
	map: { name: 'name' },
	autokey: { from: 'website', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'name website',
	defaultSort: '-updatedAt'
});

Host.add({
	name: {
		type: Types.Select,
		options: host_names.options,
		required: true,
		initial: true,
		index: true
	},
	website: { type: String, type: Types.Url }
});

Host.register();
