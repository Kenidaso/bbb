var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * UserSearch Model
 * =============
 */

var UserSearch = new keystone.List('UserSearch', {
	map: { name: 'keyword' },
	autokey: { from: 'keyword', path: 'slug', unique: true },
});

UserSearch.add({
	keyword: { type: Types.Text, required: true, initial: true, index: true },
	count: { type: Types.Number, default: 1 }
});

UserSearch.defaultColumns = 'keyword count';
UserSearch.register();
