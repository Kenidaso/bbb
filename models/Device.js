const mongoose = require('mongoose');
const { Schema } = mongoose;

const keystone = require('keystone');
const Types = keystone.Field.Types;

/**
 * Device Model
 * =============
 */

const Device = new keystone.List('Device', {
	map: { name: 'fingerprint' },
	track: {
		createdAt: true,
  	updatedAt: true,
	},
});

Device.add({
	fingerprint: { type: Types.Text, required: true, initial: true, index: true, noedit: true }, // from fingerprint2
	prevFingerprint: { type: Types.Text, noedit: true },
	fingerprintInt: { type: Types.Number, noedit: true }, // from clientjs
	userAgent: { type: Types.Text, noedit: true },
	browser: { type: Types.Text, noedit: true },
	browserVersion: { type: Types.Text, noedit: true },
	engine: { type: Types.Text, noedit: true },
	engineVersion: { type: Types.Text, noedit: true },
	OS: { type: Types.Text, noedit: true },
	osVersion: { type: Types.Text, noedit: true },
	device: { type: Types.Text, noedit: true },
	deviceType: { type: Types.Text, noedit: true },
	deviceVendor: { type: Types.Text, noedit: true },
	timeZone: { type: Types.Text, noedit: true },
	screenPrint: { type: Types.Text, noedit: true },

	specifications: { type: Types.TextArray, noedit: true },
	headers: { type: Types.TextArray, noedit: true },

	ip: { type: Types.Text, noedit: true },
	location: { type: Types.GeoPoint,  },
});

// Device.schema.add({ specifications: Schema.Types.Mixed });

Device.schema.pre('validate', function (next) {
	this.createdAt = this.createdAt || new Date();
	this.updatedAt = new Date();
	return next();
})

Device.schema.pre('save', function (next) {
	this.createdAt = this.createdAt || new Date();
	this.updatedAt = new Date();

	return next();
})

Device.defaultColumns = 'browser OS timeZone';
Device.register();
