const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chickyky:jwt-secret-key';
let JWT_TTL = process.env.JWT_TTL || 60 * 60 * 24 * 30; // 1 month
JWT_TTL = Number(JWT_TTL);

if (process.env.NODE_ENV !== 'production') {
  JWT_TTL = 60 * 5;
}

let JwtService = {};
module.exports = JwtService;

JwtService.JWT_SECRET = JWT_SECRET;

JwtService.sign = (payload = {}) => {
  let token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL });
  return token;
}

JwtService.verify = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    console.log(`JwtService verify token error= ${err}`);
    return null;
  }
}
