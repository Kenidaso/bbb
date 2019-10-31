const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * NewsStory Model
 * =============
 */

const NewsStory = new keystone.List('NewsStory', {
	map: { name: 'name' },
	autokey: { from: 'name', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	updatedAt: true,
	},
});

NewsStory.add({
	name: { type: Types.Text, required: true, initial: true },
	link: { type: Types.Url, required: true, initial: true },
	description: { type: Types.Textarea, initial: true },
	topic: { type: Types.Relationship, ref: 'NewsTopic', initial: true },
	status: { type: Types.Number, default: 1 },
});

NewsStory.defaultColumns = 'name description topic status';

NewsStory.register();
