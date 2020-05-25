const mongoose = require('mongoose');
const { Schema } = mongoose;

const keystone = require('keystone');
const Types = keystone.Field.Types;
const shortId = require('short-id-gen');

/**
 * User Model
 * =============
 */

const RegisterProvider = new keystone.List('RegisterProvider', {
  map: { name: 'mapModel' },
  // autokey: { from: 'name', path: 'slug', unique: true },
  track: {
    createdAt: true,
    updatedAt: true,
  },
});

RegisterProvider.add(
  'Register Provider', {
    strategy: {
      type: Types.Select,
      options: 'EMAIL, GOOGLE, FACEBOOK',
      index: true,
      initial: true
    },

    mapModel: { type: Types.Text, noedit: true }, // user for map in back-office

    uid: { // uid user in provider
      type: String,
      index: true
    },

    email: {
      type: Types.Email,
      index: true
    },

    JSON_viewer: { type: Types.Textarea, noedit: true, height: 600 }
  }
);

/*
profile: {
  uid: String,
  emailVerified: Boolean,
  email: String,
  displayName: String,
  given_name: String,
  family_name: String,

  photoURL: String,
  isNewUser: Boolean,
  locale: String,
  lastLoginAt: { type: Types.Number },
  createdAt: { type: Types.Number },
}
*/
RegisterProvider.schema.add({ profile: Schema.Types.Mixed });

/*
stsTokenManager: {
  apiKey
  refreshToken
  accessToken
  expirationTime
}
*/
RegisterProvider.schema.add({ stsTokenManager: Schema.Types.Mixed });

/*
credential: {
  providerId
  signInMethod
  oauthIdToken
  oauthAccessToken
}
*/
RegisterProvider.schema.add({ credential: Schema.Types.Mixed });

RegisterProvider.schema.add({ metadata: Schema.Types.Mixed });

const normalizeModel = function (model) {
  model.createdAt = model.createdAt || new Date();
  model.updatedAt = new Date();

  model.mapModel = `${model.strategy}:${model.email}:${model.uid}`;
  if (model.email) model.email = model.email.toLowerCase();

  let JSON_viewer = {
    profile: {
      ...model.profile,
    },
    stsTokenManager: {
      ...model.stsTokenManager,
    },
    credential: {
      ...model.credential,
    },
    metadata: {
      ...model.metadata,
    },
  }

  model.JSON_viewer = JSON.stringify(JSON_viewer, null, '\t');
}

RegisterProvider.schema.pre('validate', function (next) {
  normalizeModel(this);

  return next();
})

RegisterProvider.schema.pre('save', function (next) {
  normalizeModel(this);

  return next();
})

// create indexes
RegisterProvider.schema.index({
  strategy: 1,
  email: 1,
  uid: 1
},  { unique: true })

RegisterProvider.register();
