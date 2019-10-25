const keystone = require('keystone');
const Types = keystone.Field.Types;

let configModel = require('../statics/configModel');
let { category_titles } = configModel;

/**
 * Category Model
 * =============
 */

const Category = new keystone.List('Category', {
	map: { name: 'title' },
	autokey: { from: 'title', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'title display',
	defaultSort: '-updatedAt'
});

Category.add({
	// title: {
	// 	type: Types.Select,
	// 	options: category_titles.options,
	// 	required: true
	// },
	title: {
		type: String
	},
	display: { type: String, required: true, initial: true },
});

Category.schema.pre('save', function (next) {
	this.title = this.title.toLowerCase();

	return next();
});

Category.register();
