module.exports = {
  errorObj: (errorCode, codeDebug = 'EUNKNOWN', data = {}, message = '', statusCode = 400) => {
	  return { errorCode, message, data, statusCode, codeDebug }
	},

	normalizeText: (text = '') => {
		let result = text.replace(/\s\s/g, ' ').trim();
		return result;
	},

	randInt: (min, max) => {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
}
