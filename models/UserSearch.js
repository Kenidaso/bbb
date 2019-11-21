var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * UserSearch Model
 * =============
 */

var UserSearch = new keystone.List('UserSearch', {
	map: { name: 'searchContent' },
	autokey: { from: 'searchContent', path: 'slug', unique: true },
	track: {
		createdAt: true,
  	updatedAt: true,
	},
});

UserSearch.add({
	searchContent: { type: Types.Text, required: true, initial: true, index: true },
	count: { type: Types.Number, default: 1 },
});

UserSearch.schema.methods.incCount = function (callback) {
	this.count += 1;
	this.save(callback)
}

UserSearch.schema.methods.track = function (keyword, callback) {
	this.findOne({ keyword }, (err, result) => {
		if (result) return result.incCount(callback);
		return callback(err);
	})
}

UserSearch.defaultColumns = 'keyword count';
UserSearch.register();
