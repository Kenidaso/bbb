const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * NewsTopic Model
 * =============
 */

const NewsTopic = new keystone.List('NewsTopic', {
	map: { name: 'name' },
	autokey: { from: 'name', path: 'slug', unique: true },
});

NewsTopic.add({
	name: { type: Types.Text, required: true, initial: true },
	link: { type: Types.Url, required: true, initial: true },
	description: { type: Types.Textarea, initial: true },
	status: { type: Types.Number, default: 1 },
});

NewsTopic.defaultColumns = 'name description status';

NewsTopic.register();
