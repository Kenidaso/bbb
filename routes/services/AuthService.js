const keystone = require('keystone');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const Utils = require('./Utils');

let EmployeeModel = keystone.list('Employee').model;

let AuthService = {};
module.exports = AuthService;

const JSONWEBTOKEN_SECRET = process.env.JSONWEBTOKEN_SECRET;



AuthService.sign = (payload) => {
	let token = jwt.sign(payload, JSONWEBTOKEN_SECRET, {
		// algorithm: 'RS256',
		expiresIn: 60 * 60 * 24 * 7 // 7 day
	});

	return token;
}

AuthService.decode = (token) => {
	try {
	  let decoded = jwt.verify(token, JSONWEBTOKEN_SECRET);
	  return decoded;
	} catch(err) {
	  return null;
	}
}

AuthService.verify = (token) => {
	try {
	  let decoded = jwt.verify(token, JSONWEBTOKEN_SECRET);
	  return decoded;
	} catch(err) {
	  return null;
	}
}

AuthService.saleLogin = (params, callback) => {
	let { phone, password } = params;
	let fields = 'slug password phone image position name roles requiredChangePwd requiredFirstChangePwd autoGenPassword';

	if (phone.startsWith('0')) phone = '84' + phone.substr(1);

	EmployeeModel
		.findOne({
			phone
		})
		.select(fields)
		.populate('roles', '-_id title')
		.exec((err, employee) => {
			if (err) return callback('EFINDONEEMPLOYEE', err);
			if (!employee) return callback('EEMPLOYERRNOTFOUND', "Số điện thoại không tồn tại");

			employee._.password.compare(password, (errC, isMatch) => {
				if (errC || !isMatch) return callback('EPWDNOTMATCH', 'Mật khẩu không chính xác');
				let _id = employee._id;
				employee = Utils.cleanModelObj(employee);

				let token = AuthService.sign({
					_id,
					phone: employee.phone
				});

				employee.token = token;
				employee.roles = employee.roles || [];
				employee.roles = employee.roles.map((role) => {
					return role.title;
				});

				employee.name = employee.name.last + employee.name.first;

				if (!employee.requiredFirstChangePwd) delete employee.autoGenPassword;

				return callback(null, employee);
			});
		});
}