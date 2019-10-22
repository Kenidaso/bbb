const keystone = require('keystone');
const Types = keystone.Field.Types;

const debug = require('debug')('Model');
const fatal = require('debug')('FATAL');
const log = debug.extend('KsUser');

/**
 * KsUser Model
 * ==========
 */
const KsUser = new keystone.List('KsUser');

KsUser.add({
	name: { type: Types.Name, required: true, index: true },
	email: { type: Types.Email, initial: true, required: true, unique: true, index: true },
	password: { type: Types.Password, initial: true, required: true },
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true },
});

// Provide access to Keystone
KsUser.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});


/**
 * Relationships
 */
KsUser.relationship({ ref: 'Post', path: 'posts', refPath: 'author' });

KsUser.schema.methods.create = function (callback) {
  this.model('KsUser').findOne({ email: this.email }, function (err, user) {
  	if (err) {
  		fatal('KsUser findOne err=', err);
  		return callback(err);
  	}

  	if (user) {
      log('user is exists ...');
      return callback(null, user);
    }

    this.model('KsUser').save(callback);
  });
};

/**
 * Registration
 */
KsUser.defaultColumns = 'name, email, isAdmin';
KsUser.register();
