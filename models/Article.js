const mongoose = require('mongoose');
const { Schema } = mongoose;

const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Article Model
 * =============
 */

const Article = new keystone.List('Article', {
	map: { name: 'title' },
	autokey: { from: 'title', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	createdBy: true,
  	updatedAt: true,
  	updatedBy: true
	},
	perPage: 20,
	defaultColumns: 'title publishDate category host',
	defaultSort: '-updatedAt'
});

Article.add({
	title: { type: String, required: true },
	publishDate: { type: Date },
	sectionTitle: { type: Types.Text },
	link: { type: Types.Url, index: true, unique: true, initial: true }, // origin Link

	description: { type: Types.Textarea }, // short content

	category: { type: Types.Relationship, ref: 'Category', initial: true, many: true },
	story: { type: Types.Relationship, ref: 'NewsStory', initial: true, many: true },
	storyLink: { type: Types.Text },

	topic: { type: Types.Relationship, ref: 'NewsTopic', initial: true, many: true },

	paperName: { type: Types.Text },
	paperImg: { type: Types.Text },

	view: { type: Types.Number, default: 0 },
});

Article.schema.add({ metadata: Schema.Types.Mixed });
Article.schema.add({ heroImage: Schema.Types.Mixed });

Article.register();
