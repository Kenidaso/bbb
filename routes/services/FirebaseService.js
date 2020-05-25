const keystone = require('keystone');
const admin = require("firebase-admin");
const { google } = require("googleapis");
const request = require('request');

const utils = require('../../helpers/utils');
const serviceAccount = require("../../statics/cky-feed24h-firebase-adminsdk-1ncts-97903f3f32.json");

const { Statics } = keystone;

const ERROR_CODE = Statics.errorCode;

const {
  EVERIFYACCESSTOKEN,
  EACCESSTOKENEXPIRED,
  ENORESPONSEACCESSTOKEN,
  EREFRESHTOKEN,
  EGENERATEACCESSTOKEN
} = ERROR_CODE;

// Define the required scopes.
const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/firebase.database"
];

const API_KEY = process.env.FIREBASE_APIKEY_FEED24H;

// Authenticate a JWT client with the service account.
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  scopes
);

const FirebaseService = {};
module.exports = FirebaseService;

const noop = () => {}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cky-feed24h.firebaseio.com"
});

FirebaseService.verifyAccessToken = async (params, callback) => {
  let { accessToken } = params;

  /* decodedToke =
  {
    "name": "Quyen Le",
    "picture": "https://lh3.googleusercontent.com/a-/AOh14GjSwavn-HK2EthazvH2XSJj-gu56zd4KgmMjwqB0A",
    "iss": "https://securetoken.google.com/cky-feed24h",
    "aud": "cky-feed24h",
    "auth_time": 1589907980,
    "user_id": "VvKRTv3Ky9VmmJFrAxNO3JL19HG2",
    "sub": "VvKRTv3Ky9VmmJFrAxNO3JL19HG2",
    "iat": 1589907980,
    "exp": 1589911580,
    "email": "chickyky@gmail.com",
    "email_verified": true,
    "firebase": {
        "identities": {
            "google.com": [
                "110703536814197843684"
            ],
            "email": [
                "chickyky@gmail.com"
            ]
        },
        "sign_in_provider": "google.com"
    },
    "uid": "VvKRTv3Ky9VmmJFrAxNO3JL19HG2"
  }
  */
  // Verify the ID token while checking if the token is revoked by passing
  // checkRevoked true.
  let checkRevoked = true;
  let [err, decodedToken] = await utils.to(admin.auth().verifyIdToken(accessToken /*, checkRevoked*/));

  if (err) {
    if (err.code && err.code === 'auth/id-token-expired') {
      return callback(EACCESSTOKENEXPIRED, err);
    }

    return callback(EVERIFYACCESSTOKEN, err);
  }

  return callback(null, decodedToken);
}

FirebaseService.generateAccessToken = (callback) => {
  // Use the JWT client to generate an access token.
  jwtClient.authorize((error, tokens) => {
    if (error) {
      const message = `Error making request to generate access token: ${error.toString()}`;
      return callback(error, utils.errorObj(EGENERATEACCESSTOKEN, 'EGENERATEACCESSTOKEN', {}, message));
    }

    if (!tokens || !tokens.access_token) {
      const message = 'Provided service account does not have permission to generate access tokens';
      return callback(ENORESPONSEACCESSTOKEN, utils.errorObj(ENORESPONSEACCESSTOKEN, 'ENORESPONSEACCESSTOKEN', {}, message));
    }

    return callback(null, tokens);
  });
}

FirebaseService.refreshAccessToken = (refreshToken, callback) => {
  request({
    url: `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }
  }, (err, response, body) => {
    if (err) return callback(err, body);

    body = utils.safeParse(body);

    if (!body) return callback(ENORESPONSEBODY)
    if (body.error) {
      return callback(EREFRESHTOKEN, body.error);
    }

    return callback(err, body);
  })
}
