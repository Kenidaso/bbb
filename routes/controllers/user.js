const UserService = require('../services/UserService');

let UserCtrl = {};
module.exports = UserCtrl;

UserCtrl.registerGuest = (req, res) => {
  let params = req.body;

  UserService.registerGuest.call(req, params, (err, result) => {
    if (err) return res.error(req, res, err, result);
    return res.success(req, res, result);
  });
}