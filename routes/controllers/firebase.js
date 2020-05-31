const FirebaseService = require('../services/FirebaseService');

let FirebaseCtrl = {};
module.exports = FirebaseCtrl;

FirebaseCtrl.verifyAccessToken = (req, res) => {
  let params = req.body;

  FirebaseService.verifyAccessToken(params, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  })
}

FirebaseCtrl.generateAccessToken = (req, res) => {
  FirebaseService.generateAccessToken((err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}

FirebaseCtrl.refreshAccessToken = (req, res) => {
  let { refreshToken } = req.body;

  FirebaseService.refreshAccessToken(refreshToken, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}
