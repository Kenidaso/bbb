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
		updatedAt: true,
	},
	perPage: 20,
	defaultColumns: 'title publishDate category host',
	defaultSort: '-updatedAt',
});

Feed.add({
	title: { type: String, required: true },
	slug: { type: String, index: true, unique: true },

	publishDate: { type: Date, index: true },
	link: { type: Types.Url, index: true, unique: true, initial: true },
	linkBaoMoi: { type: Types.Url, index: true, initial: true, sparse: true },
	description: { type: Types.Textarea }, // short content

	rawHtml: { type: Types.Html, wysiwyg: true },

	category: { type: Types.Relationship, ref: 'Category', initial: true, many: true, index: true },
	host: { type: Types.Relationship, ref: 'Host', initial: true },

	story: { type: Types.Relationship, ref: 'NewsStory', initial: true, many: true },
	topic: { type: Types.Relationship, ref: 'NewsTopic', initial: true, many: true, index: true },

	view: { type: Types.Number, default: 0 },

	/*
	{
		"public_id" : "rdrwfwzzbenze4hzlogk",
		"version" : 1567263420,
		"signature" : "0132e60eed466f644e3442bd101db2157f6843f5",
		"width" : 749,
		"height" : 500,
		"format" : "jpg",
		"resource_type" : "image",
		"url" : "http://res.cloudinary.com/chickyky/image/upload/v1567263420/rdrwfwzzbenze4hzlogk.jpg",
		"secure_url" : "https://res.cloudinary.com/chickyky/image/upload/v1567263420/rdrwfwzzbenze4hzlogk.jpg",
		"_id" : ObjectId("5d6a8abc166fea081d4811d4")
	}
	*/
	heroImage: { type: Types.CloudinaryImage },
});

Feed.schema.add({ contentOrder: [Schema.Types.Mixed] }); // full content order
Feed.schema.add({ metadata: Schema.Types.Mixed });
// Feed.schema.add({ heroImage: Schema.Types.Mixed });
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

	if (this.linkBaoMoi && (this.linkBaoMoi.length == 0 || this.linkBaoMoi === '')) {
		this.linkBaoMoi = null;
	}

	return next();
});

Feed.register();
