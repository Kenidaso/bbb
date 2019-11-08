const NODE_ENV = process.env.NODE_ENV || 'development';

const keystone = require('keystone');

const RedisService = require('./RedisService');
const utils = require('../../helpers/utils');

const Device = keystone.list('Device');
const DeviceModel = Device.model;

let TTL = 60 * 15; // time to live key redis: 900 second = 15 minute
if (NODE_ENV === 'development') TTL = 60 * 60;

const register = (params, callback) => {
	if (!params.fingerprint) return callback('EMISSFINGERPRINT');

	DeviceModel.findOne({
		fingerprint: params.fingerprint
	}, (err, device) => {
		if (err) return callback('EFINDDEVICE', err);

		if (device) {
			device = Object.assign(device, params);
			let specifications = [];
			for (let key in params) {
				if (key.startsWith('is') && params[key]) specifications.push(key);
			}

			device.specifications = specifications;
			device.headers = [];
			device.headers.push(`app-timezone-offset:${params._headers['app-timezone-offset']}`);
			device.headers.push(`app-build-key:${params._headers['app-build-key']}`);
			device.headers.push(`app-version:${params._headers['app-version']}`);

			return device.save((err) => {
				if (err) return callback('EREGISDEVICE', err);
				return callback(null, { fingerprint: device.fingerprint });
			})
		}

		let newDevice = Object.assign({}, params);

		let specifications = [];
		for (let key in newDevice) {
			if (key.startsWith('is') && newDevice[key]) specifications.push(key);
		}

		newDevice.specifications = specifications;
		newDevice.headers = [];
		newDevice.headers.push(`app-timezone-offset:${params._headers['app-timezone-offset']}`);
		newDevice.headers.push(`app-build-key:${params._headers['app-build-key']}`);
		newDevice.headers.push(`app-version:${params._headers['app-version']}`);

		let regisDevice = new DeviceModel(newDevice);

		regisDevice.save((err) => {
			if (err) return callback('EREGISDEVICE', err);
			return callback(null, { fingerprint: regisDevice.fingerprint });
		})
	})
}

module.exports = {
	register
}