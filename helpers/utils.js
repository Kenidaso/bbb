module.exports = {
  errorObj: (errorCode, codeDebug = 'EUNKNOWN', data = {}, message = '', statusCode = 400) => {
	  return { errorCode, message, data, statusCode, codeDebug }
	}
}
