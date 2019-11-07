require('dotenv').config();

const keystone = require('keystone');
const shortId = require('short-id-gen');
const async = require('async');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');

keystone.init({
	headless: true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16)
});

keystone.import('../models');

const NewsTopic = keystone.list('NewsTopic');
const NewsStory = keystone.list('NewsStory');
const Article = keystone.list('Article');
const Feed = keystone.list('Feed');

const utils = require('../helpers/utils');

const runProcess = () => {
	let articles = [];

	async.series({
		get_articles: (next) => {
			Article.model.find({}, 'link publishDate title story category topic metadata', (err, docs) => {
				if (err) return next(err);
				articles = docs;
				return next(null);
			})
		},
		move: (next) => {
			console.log('length=', articles.length);

			async.eachLimit(articles, 10, (article, cbEach) => {
				let find = { link: article.link };

				let update = {
					title: article.title,
					publishDate: article.publishDate,
					link: article.link,
					story: article.story,
					category: article.category,
					topic: article.topic,
					// heroImage: article.heroImage,

					metadata: {
						sectionTitle: article.sectionTitle,
						linkArticle: article.metadata && article.metadata.linkArticle ? article.metadata.linkArticle : null,
					}
				}

				utils.upsertSafe(Feed, find, update, (err, doc) => {
					// if (err) return cbEach();

					Article.model.remove(find, cbEach);
				})
			}, next);
		}
	}, (err, result) => {
		console.log('done err=', err);
		console.log('done result=', result);
	});
}


keystone.start( x => {
	console.log('start done ...');

	runProcess();
});