const moment = require('moment');
const shortId = require('short-id-gen');
const mongoose = require('mongoose');
const keystone = require('keystone');

const Types = keystone.Field.Types;
const { ObjectId } = mongoose;

const CommentSchema = require('../schemas/CommentSchema');
/**
 * CommentBucket Model
 * ==========
 */

const CommentBucket = new keystone.List('CommentBucket', {
});

CommentBucket.add({
	post: { type: Types.Relationship, ref: 'Post', many: false },

    page: { type: Number, initial: true },
    count: { type: Number, initial: true }
});

CommentBucket.schema.add({ parentId: { type: mongoose.ObjectId, index: true }});
CommentBucket.schema.add({ comments: [CommentSchema] });

// indexed
CommentBucket.schema.index({ post: 1, page: 1 }, { unique: true });

CommentBucket.defaultColumns = 'post, parentId, page, count';
CommentBucket.register();
