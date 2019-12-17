const keystone = require('keystone');
const Types = keystone.Field.Types;
const shortId = require('short-id-gen');

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
		password: { type: Types.Password, initial: true, required: false },

		email: { type: Types.Email, required: false, index: true, sparse: true },
		phone: { type: String, initial: false, required: false },
	},

	'Facebook', {
		fb_id: { type: String, initial: false, required: false , index: true, sparse: true },
		fb_token: { type: String, initial: false, required: false },
	},

	'Google', {
		gg_id: { type: String, initial: false, required: false , index: true, sparse: true },
		gg_token: { type: String, initial: false, required: false },
	},

	'Twitter', {
		twitter_id: { type: String, initial: false, required: false , index: true, sparse: true },
		twitter_token: { type: String, initial: false, required: false },
	},

	'Skype', {
		skype_id: { type: String, initial: false, required: false , index: true, sparse: true },
		skype_token: { type: String, initial: false, required: false },
	},

	'Apple', {
		apple_id: { type: String, initial: false, required: false , index: true, sparse: true },
		apple_token: { type: String, initial: false, required: false },
	},

	'Zalo', {
		zalo: { type: String, initial: false, required: false , index: true, sparse: true },
	},

	'Momo', {
		momo: { type: String, initial: false, required: false , index: true, sparse: true },
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

User.schema.index({
	email: 1
}, {
	partialFilterExpression: {
		email: partialFilter
	}
})

User.schema.index({ fb_id: 1 }, { partialFilterExpression: { fb_id: partialFilter }});
User.schema.index({ gg_id: 1 }, { partialFilterExpression: { gg_id: partialFilter }});
User.schema.index({ twitter_id: 1 }, { partialFilterExpression: { twitter_id: partialFilter }});
User.schema.index({ skype_id: 1 }, { partialFilterExpression: { skype_id: partialFilter }});
User.schema.index({ apple_id: 1 }, { partialFilterExpression: { apple_id: partialFilter }});
User.schema.index({ zalo: 1 }, { partialFilterExpression: { zalo: partialFilter }});
User.schema.index({ momo: 1 }, { partialFilterExpression: { momo: partialFilter }});

User.register();
