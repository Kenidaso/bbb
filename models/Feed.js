const mongoose = require('mongoose');
const { Schema } = mongoose;

const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Feed Model
 * =============
 */

const Media = new Schema({
	src: {
		type: String
	},

	title: {
		type: String
	},

	description: {
		type: String
	}
}, {
	_id: false
});

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
	defaultColumns: 'title content heroImage images',
	defaultSort: '-updatedAt'
});

Feed.add({
	title: { type: String, required: true },
	publishDate: { type: Date },
	link: { type: Types.Url, index: true, unique: true, initial: true },
	description: { type: Types.Textarea }, // short content

	rawHtml: { type: Types.Html, wysiwyg: true },

	category: { type: Types.Relationship, ref: 'Category', initial: true },
	host: { type: Types.Relationship, ref: 'Host', initial: true },
});

Feed.schema.add({ contentOrder: [Schema.Types.Mixed] }); // full content order
Feed.schema.add({ metadata: Schema.Types.Mixed });
Feed.schema.add({ heroImage: Schema.Types.Mixed });
Feed.schema.add({ images: [Schema.Types.Mixed] });
Feed.schema.add({ videos: [Schema.Types.Mixed] });

// Feed.schema.add({ heroImage: Media });
// Feed.schema.add({ images: [Media] });
// Feed.schema.add({ videos: [Media] });

Feed.register();
