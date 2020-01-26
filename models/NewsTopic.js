const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * NewsTopic Model
 * =============
 */

const NewsTopic = new keystone.List('NewsTopic', {
	map: { name: 'name' },
	autokey: { from: 'name', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	updatedAt: true,
	},
});

NewsTopic.add({
	name: { type: Types.Text, required: true, initial: true, index: true },
	link: { type: Types.Url, required: true, initial: true },
	category: { type: Types.Relationship, ref: 'Category', initial: true, many: true },
	ggn_id: { type: Types.Text, initial: true },
	description: { type: Types.Textarea, initial: true },
	type: {
		type: Types.Select,
		options: 'TOPIC, LOCATION',
		default: 'TOPIC',
		index: true,
		initial: true
	},
	status: { type: Types.Number, default: 1 },
});

NewsTopic.defaultColumns = 'name description status';

NewsTopic.register();
