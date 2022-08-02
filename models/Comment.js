const moment = require('moment');
const shortId = require('short-id-gen');
const mongoose = require('mongoose');
const keystone = require('keystone');

const Types = keystone.Field.Types;

/**
 * Comment Model
 * ==========
 */

const Comment = new keystone.List('Comment', {
	map: { name: 'slug' },
	// autokey: { path: 'slug', from: 'title', unique: true },
});

Comment.add({
	post: { type: Types.Relationship, ref: 'Post', many: false, initial: true, noedit: true },

    slug: { type: String, index: true, default: shortId.generate, noedit: true },
    fullSlug: { type: String, index: true, noedit: true },

	author: { type: Types.Relationship, ref: 'User', index: true, initial: true },
	publishedDate: { type: Types.Date, index: true, default: Date.now },
	image: { type: Types.CloudinaryImage },
	text: { type: String, initial: true }
});

Comment.schema.add({ parentId: { type: mongoose.ObjectId, index: true }});

Comment.defaultColumns = 'title, state|20%, author|20%, publishedDate|20%';
Comment.register();
