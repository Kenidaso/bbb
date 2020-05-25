const keystone = require('keystone');
const async = require('async');
const requireDir = require('require-dir');
const faker = require('faker/locale/vi');

const utils = require('../../helpers/utils');
const Response = require('../services/Response');
const JwtService = require('../services/JwtService');

const { Statics } = keystone;
const ERROR_CODE = Statics.errorCode;

const User = keystone.list('User');
const Device = keystone.list('Device');
const DeviceModel = Device.model;

const {
  EEMAILWASREGISTERED,
  EMISSINGFINGERPRINT,
  EFINDDEVICE,
  EDEVICENOTREGISTERED
} = ERROR_CODE;

const registerByProvider = (params, callback) => {
  async.waterfall([
    // check register provider
    (next) => {
      return next();
    },

    // get device id
    (next) => {
      return next();
    },

    // create user guest
    (next) => {
      return next();
    }
  ], (err, result) => {
    // error number
    return callback(EEMAILWASREGISTERED);
    // return callback(err, { err, result });
  })
}

const registerGuest = (params, callback) => {
  let { fingerprint } = params;

  if (!fingerprint) return callback(EMISSINGFINGERPRINT);

  async.waterfall([
    // get device id
    (next) => {
      DeviceModel.findOne({
        fingerprint
      }, 'fingerprint fingerprintInt', (err, device) => {
        if (err) return next(EFINDDEVICE, err);
        if (!device) return next(EDEVICENOTREGISTERED);

        return next(null, device);
      });
    },

    // create user guest
    (device, next) => {
      User.model.createGuestProfile(device._id, (err, guest) => {
        let profile = {
          // _id: guest._id,
          slug: guest.slug,
          name: guest.name,
          device,
          status: guest.status,
        }

        return next(err, { device, profile });
      })
    },

    ({ device, profile }, next) => {
      let jwtToken = JwtService.sign(profile);
      profile.jwtToken = jwtToken;
      return next(null, { device, profile });
    }
  ], callback);
}

module.exports = {
  registerGuest
}