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

		let regisDevice = null;

		if (device) {
			regisDevice = Object.assign(device, params);
		} else {
			regisDevice = new DeviceModel(params);
		}

		regisDevice.save((err) => {
			if (err) return callback('EREGISDEVICE', err);
			return callback(null, regisDevice);
		})
	})
}

module.exports = {
	register
}