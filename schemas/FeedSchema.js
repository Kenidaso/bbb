const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Types } = Schema;

const feedSchema = new Schema({
	slug: { type: String, index: true, unique: true },
	title: { type: String },
	publishDate: { type: Date, index: true },
	link: { type: String, index: true, unique: true },
	linkBaoMoi: { type: String, index: true, unique: true, sparse: true },
	description: { type: String }, // short content

	topic: Types.Mixed,
	category: Types.Mixed,
	view: Number,
	images: Types.Mixed,
	heroImage: Types.Mixed,
	updatedAt: Date,
	createdAt: Date
});

module.exports = feedSchema;