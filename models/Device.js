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
	fingerprint: { type: Types.Text, required: true, initial: true, index: true }, // from fingerprint2
	fingerprintInt: { type: Types.Number }, // from clientjs
	userAgent: { type: Types.Text },
	browser: { type: Types.Text },
	browserVersion: { type: Types.Text },
	engine: { type: Types.Text },
	engineVersion: { type: Types.Text },
	OS: { type: Types.Text },
	osVersion: { type: Types.Text },
	device: { type: Types.Text },
	deviceType: { type: Types.Text },
	deviceVendor: { type: Types.Text },
	isIE: { type: Types.Boolean },
	isChrome: { type: Types.Boolean },
	isFirefox: { type: Types.Boolean },
	isSafari: { type: Types.Boolean },
	isOpera: { type: Types.Boolean },
	isMobileSafari: { type: Types.Boolean },
	isMobile: { type: Types.Boolean },
	isMobileAndroid: { type: Types.Boolean },
	isMobileOpera: { type: Types.Boolean },
	isMobileWindows: { type: Types.Boolean },
	isMobileBlackBerry: { type: Types.Boolean },
	isMobileIOS: { type: Types.Boolean },
	isIphone: { type: Types.Boolean },
	isIpad: { type: Types.Boolean },
	isIpod: { type: Types.Boolean },
	isWindows: { type: Types.Boolean },
	isMac: { type: Types.Boolean },
	isLinux: { type: Types.Boolean },
	isUbuntu: { type: Types.Boolean },
	isSolaris: { type: Types.Boolean },
	timeZone: { type: Types.Text },
	screenPrint: { type: Types.Text },
});

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
