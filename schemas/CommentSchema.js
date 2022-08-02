const mongoose = require('mongoose');
const shortId = require('short-id-gen');
const { Schema } = mongoose;
// const { Types } = Schema;

const commentSchema = new Schema({
    parentId: { type: mongoose.ObjectId },

	slug: { type: String, index: true, unique: true, default: shortId.generate },
	fullSlug: { type: String, index: true },

	publishedDate: { type: Date, index: true, default: Date.now },
	author: { type: mongoose.ObjectId, index: true },

	text: { type: String },

    updatedAt: Date,
	createdAt: Date
});

module.exports = commentSchema;
