const AuthService = require('../services/AuthService');
const Response = require('../services/Response');

let auth = {};
module.exports = auth;

/**
 @api {post} /api/auth/sale-login salesman login in sale-office
 @apiVersion 1.0.0
 @apiName Sale Login
 @apiGroup Authenticate
 @apiPermission none

 @apiDescription salesman login, return token if success

	@apiParam {String} phone Salesman's phone
	@apiParam {String} password Salesman's password

 @apiSuccess {Number}   error         0 is no error
 @apiSuccess {String}   message    		Message
 @apiSuccess {Object}   data       		result is Array or Object

 @apiSuccessExample Response Success (example):
 {
     "error": 0,
     "message": "success",
     "data": {
         "slug": "sale-1",
         "phone": "84778615395",
         "roles": [
             "editor"
         ],
         "image": {
             "url": "http://res.cloudinary.com/chickyky/image/upload/v1567786058/dz1m5h1metxltscxqjxv.jpg",
             "secure_url": "https://res.cloudinary.com/chickyky/image/upload/v1567786058/dz1m5h1metxltscxqjxv.jpg"
         },
         "position": "SALES_EXECUTIVE",
         "name": "Sale 1",
         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDcyODNiNDVhZDg0OTA4MDU1YjAzMWMiLCJwaG9uZSI6Ijg0Nzc4NjE1Mzk1IiwiaWF0IjoxNTY4MjEzMjAzLCJleHAiOjE1Njg4MTgwMDN9.d23AlCnDCbcssgid82r263DIn0v6lBth5fpJE7hUjlQ"
     }
 }

 @apiErrorExample Response Error (example):
      HTTP/1.1 400
	{
		"error": -1,
		"message": "error",
	}
 */
auth['sale-login'] = (req, res) => {
	let { phone, password } = req.body;

	if (!phone) return Response.error(res, 'Invalid phone', 'EINVALIDPHONE');
	if (!password) return Response.error(res, 'Invalid password', 'EINVALIDPWD');

	AuthService.saleLogin({
		phone,
		password
	}, (err, result) => {
		if (err) return Response.error(req, res, err, result);

		return Response.success(req, res, result);
	});
}

/**
 @api {get} /api/auth/verify/:token verify token
 @apiVersion 1.0.0
 @apiName Verify Token
 @apiGroup Authenticate
 @apiPermission none

	@apiParam {String} token Salesman's token

 @apiDescription verify token, if success return object, other return null

 @apiSuccess {Number}   error         0 is no error
 @apiSuccess {String}   message    		Message
 @apiSuccess {Object}   data       		result is Array or Object

 @apiSuccessExample Response Success (example):
 {
    "error": 0,
    "message": "success",
    "data": {
        "_id": "5d7283b45ad84908055b031c",
        "phone": "0778615395",
        "iat": 1567960326,
        "exp": 1568565126
    }
}

 @apiErrorExample Response Error (example):
      HTTP/1.1 400 Verify error
	{
    "error": 0,
    "message": "success",
    "data": null
	}
 */
auth.verify = (req, res) => {
	let token = req.params.id;

	let decoded = AuthService.verify(token);
	return Response.success(req, res, decoded);
}


