/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

// exports.create = {
// 	KsUser: [
// 		{ 'name.first': 'Admin', 'name.last': 'User', 'email': 'admin@vinhanland.vn', 'password': '123456', 'isAdmin': true },
// 	],
// };



// This is the long-hand version of the functionality above:

const keystone = require('keystone');
const async = require('async');
const User = keystone.list('KsUser');

const admins = [
	{ 'name.first': 'Admin', 'name.last': 'User', 'email': 'admin@vinhanland.vn', 'password': '123456', 'isAdmin': true },
	{ 'name.first': 'An', 'name.last': 'Nguyen', 'email': 'nvan@vinhanland.vn', 'password': '123456', 'isAdmin': true },
	{ 'name.first': 'Quyen', 'name.last': 'Le', 'email': 'quyen@vinhanland.vn', 'password': '123456', 'isAdmin': true },
	{ 'name.first': 'Linh', 'name.last': 'Le', 'email': 'linh@vinhanland.vn', 'password': '123456', 'isAdmin': true },
	{ 'name.first': 'Thiet', 'name.last': 'Nguyen', 'email': 'thiet@vinhanland.vn', 'password': '123456', 'isAdmin': true },
];

function createAdmin (admin, done) {
	const newAdmin = new User.model(admin);

	newAdmin.isAdmin = true;
	newAdmin.save(function (err) {
		if (err) {
			console.error('Error adding admin ' + admin.email + ' to the database:');
			console.error(err);
		} else {
			console.log('Added admin ' + admin.email + ' to the database.');
		}

		done(err);
	});

}

exports = module.exports = function (done) {
	async.forEach(admins, createAdmin, done);
};
