const Response = require('../services/Response');
const UserService = require('../services/UserService');

let UserCtrl = {};
module.exports = UserCtrl;

UserCtrl.registerGuest = (req, res) => {
  let params = req.body;

  UserService.registerGuest(params, (err, result) => {
    if (err) return Response.error(req, res, err, result);
    return Response.success(req, res, result);
  });
}