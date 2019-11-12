const mongoose = require('mongoose');
const { Schema } = mongoose;

const keystone = require('keystone');
const Types = keystone.Field.Types;

const RedisService = require('../routes/services/RedisService');

/**
 * Feed Model
 * =============
 */

const Media = new Schema({
	src: {
		type: String,
	},

	title: {
		type: String,
	},

	description: {
		type: String,
	},
},
	{
		_id: false,
	});

const Feed = new keystone.List('Feed', {
	map: { name: 'title' },
	autokey: { from: 'title', path: 'slug', unique: true },
	track: {
		createdAt: true,
		createdBy: true,
		updatedAt: true,
		updatedBy: true,
	},
	perPage: 20,
	defaultColumns: 'title publishDate category host',
	defaultSort: '-updatedAt',
});

Feed.add({
	title: { type: String, required: true },
	publishDate: { type: Date, index: true },
	link: { type: Types.Url, index: true, unique: true, initial: true },
	linkBaoMoi: { type: Types.Url, index: true, unique: true, initial: true, sparse: true },
	description: { type: Types.Textarea }, // short content

	rawHtml: { type: Types.Html, wysiwyg: true },

	category: { type: Types.Relationship, ref: 'Category', initial: true, many: true },
	host: { type: Types.Relationship, ref: 'Host', initial: true },

	story: { type: Types.Relationship, ref: 'NewsStory', initial: true, many: true },
	topic: { type: Types.Relationship, ref: 'NewsTopic', initial: true, many: true, index: true },

	view: { type: Types.Number, default: 0 },
});

Feed.schema.add({ contentOrder: [Schema.Types.Mixed] }); // full content order
Feed.schema.add({ metadata: Schema.Types.Mixed });
Feed.schema.add({ heroImage: Schema.Types.Mixed });
Feed.schema.add({ images: [Schema.Types.Mixed] });
Feed.schema.add({ videos: [Schema.Types.Mixed] });

Feed.schema.pre('save', function (next) {
	this.createdAt = this.createdAt || new Date();
	this.updatedAt = this.updatedAt || new Date();

	if (this.link) {
		let keyContentFeed = `rawHtml:${this.link}`;
		console.log('trigger delete key redis:', keyContentFeed);
		RedisService.del(keyContentFeed);
	}

	return next();
});

Feed.register();
