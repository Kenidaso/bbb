// node test_in_keystone upsertsafe
// node test_in_keystone upsertsafe_v2

require('dotenv').config();

process.env.PORT = 1234;

const fs = require('fs');
const path = require('path');
const keystone = require('keystone');
const shortId = require('short-id-gen');
const async = require('async');

const mongoose = require('mongoose');
// const ObjectId = mongoose.Schema.Types.ObjectId;
const Schema = mongoose.Schema;
// const ObjectId = Schema.ObjectId;
const  ObjectId = mongoose.Types.ObjectId;

const myArgs = process.argv.slice(2);

if (myArgs.length == 0) return console.log("please insert task to test ...");

const task = myArgs[0].toLowerCase();

keystone.init({
	headless: true,
	'user model': 'KsUser',
	'auto update': false,
	'cookie secret': shortId.generate(16)
});

keystone.import('./models');

const Article = keystone.list('Article');
const Feed = keystone.list('Feed');
const NewsTopic = keystone.list('NewsTopic');

const noop = () => {};

let _done = (err, result) => {
	console.log('done err=', err);
	console.log('done result=', JSON.stringify(result));

	keystone.closeDatabaseConnection((err, result) => {
		console.log('stop done');
		setTimeout(process.exit, 500, 0);
	});
}


const utils = require('./helpers/utils');

keystone.start( x => {
	console.clear();

	console.log('start done ...');
	console.log('begin ...');

	switch (task) {
		case 'upsertsafe': return test_upsertSafe(_done);
		case 'upsertsafe_v2': return test_upsertSafe_v2(_done);
		default:
			console.log('Task not exists');
			return _done();
	}
});

const test_upsertSafe = (callback) => {
	async.waterfall([
		(next) => {
			return next(null, {});

			NewsTopic.model.findOne({
				_id: '5dc0704f8e2a6a0004a3a963' // doanh nghiep
			}, next);
		},
		(topic, next) => {
			console.log('topic=', topic);

			let find = {
				link: 'https:/abc.com'
			}

			let update = {
				link: 'https:/abc.com',
				title: 'test',
				publishDate: new Date(),
				topic: [ '5dc070998e2a6a0004a3a965', '5dc070e68e2a6a0004a3a967' ], // giai tri
				// topic: [ '5dc070b78e2a6a0004a3a966' ], // the thao

				// 'metadata.raw': 'abc',
				// 'metadata.html': 'xyz',

				metadata: {
					chickyky: 'pro va dep trai'
				}

				// topic: [ '5db844173cff191fd6ed7598', '5db844173cff191fd6ed7598', '5dbe95f2a3c49a09c70c83d5', '5dbe9734a3c49a09c70c83d6' ],
				// story: [ new ObjectId('5db844173cff191fd6ed7598'), new ObjectId('5dbe95f2a3c49a09c70c83d5') ]
				// story: new ObjectId('5dbe95f2a3c49a09c70c83d5')
			}

			// Article.model.findOneAndUpdate(find, {
			// 	$set: update
			// }, { new: true }, next)

			utils.upsertSafe(Feed, find, update, callback);
		}
	], callback);
}

const test_upsertSafe_v2 = (callback) => {
	async.waterfall([
		(next) => {
			NewsTopic.model.findOne({
				_id: '5dc0704f8e2a6a0004a3a963' // doanh nghiep
			}, next);
		},
		(topic, next) => {
			console.log('topic=', topic);

			let find = {
				link: 'https:/abc.com'
			}

			let update = {
				$set: {
					link: 'https:/abc.com',
					title: 'test',
					publishDate: new Date(),

					metadata: {
						chickyky: 'pro va dep trai'
					}

					// topic: [ '5db844173cff191fd6ed7598', '5db844173cff191fd6ed7598', '5dbe95f2a3c49a09c70c83d5', '5dbe9734a3c49a09c70c83d6' ],
					// story: [ new ObjectId('5db844173cff191fd6ed7598'), new ObjectId('5dbe95f2a3c49a09c70c83d5') ]
					// story: new ObjectId('5dbe95f2a3c49a09c70c83d5')
				},

				$addToSet: {
					topic: {
						$each: [ topic._id ]
					},
					category: {
						$each: topic.category
					},
				}
			}

			utils.upsertSafe_v2(Feed, find, update, callback);
		}
	], callback);
}

