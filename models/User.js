const keystone = require('keystone');
const Types = keystone.Field.Types;
const shortId = require('short-id-gen');
const faker = require('faker/locale/vi');

const Counting = keystone.list('Counting');

/**
 * User Model
 * =============
 */

const User = new keystone.List('User', {
	map: { name: 'slug' },
	autokey: { from: 'name', path: 'slug', unique: true },
	track: {
		createdAt: true,
		updatedAt: true,
	},
});

User.add(
	'User Information', {
		slug: { type: String, index: true, default: shortId.generate },
		name: { type: Types.Name, initial: true },
		avatar: { type: Types.CloudinaryImage },
		device: { type: Types.Relationship, ref: 'Device', index: true, sparse: true },
		status: {
			type: Types.Select,
			options: 'GUEST, OTPGENERATING, PENDINGOTP, PASSWORDCHANGING, VERIFIED, REGISTERING, REGISTERED, DELETED',
			default: 'GUEST',
			index: true
		},

		userId: { type: String, required: false, index: true, sparse: true },
		password: { type: Types.Password, initial: true, required: false },

		phone: { type: String, initial: false, required: false },

		providerRegistered: { type: Types.Relationship, ref: 'RegisterProvider', index: true, many: true }
	},

	'System', {
		otp: { type: String, initial: false, required: false , index: false },
		sendOtpAt: { type: Types.Datetime },
		registeredAt: { type: Types.Datetime, index: true, sparse: true },
	}
);

let partialFilter = {
	$exists: true,
	$ne: ""
}

/*User.schema.index({
	email: 1
}, {
	partialFilterExpression: {
		email: partialFilter
	}
})*/

User.schema.static('createGuestProfile', function (deviceId, callback) {
	Counting.model.sequence('guest', (err, sequence) => {
		if (err) return callback(err);

		const guest = new User.model({
			name: {
				last: 'Guest',
				first: sequence,
			},
			device: deviceId
		});

		guest.save(callback);
	})
})

User.register();
