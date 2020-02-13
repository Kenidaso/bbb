const keystone = require('keystone');
const { Statics } = keystone;
const { HTTP_STATUS_CODE } = Statics.Constant;
const messageCode = Statics.messageCode;

module.exports = {
  error: (req, res, error, result) => {
    // console.log('Response.error', typeof error, 'error=', error);
    // console.log('Response.error', typeof result, 'result=', result);

    if (typeof error == 'string') { // EDEFAULT
      result = result || {};

      if (typeof result === 'number') {
        result = { errorCode: result }
      }

      if (typeof result === 'object') {
        let { errorCode, message, data, statusCode, codeDebug } = result;
        codeDebug = error.startsWith('E') ? error :  codeDebug;

        data = data || result;

        return Error(req, res, errorCode, codeDebug, data, message, statusCode);
      }

      let codeDebug = error.startsWith('E') ? error :  undefined;

      return Error(req, res, undefined, codeDebug, undefined, result, undefined);
    }

    if (typeof error == 'object') {
      let { errorCode, message, data, statusCode, codeDebug } = error;
      return Error(req, res, errorCode, codeDebug, data, message, statusCode);
    }

    return Error(req, res);
  },

  success: Success
}

function Success (req, res, data = {}, message = 'success', statusCode = HTTP_STATUS_CODE.SUCCESS) {
  const response = {
    error   : 0,
    data    : data,
    message : message ? localizeResultMessage(req, res, message) : ''
  };

  return res.status(statusCode).json(response);
}

function Error (req, res, errorCode = -1, errorCodeDebug = 'EDEFAULT', data = {}, message = '', statusCode = HTTP_STATUS_CODE.BAD_REQUEST) {
  if (message === '') message = messageCode[errorCode];

  const response = {
    error   : errorCode,
    codeDebug: errorCodeDebug,
    data    : data,
    message : message ? localizeResultMessage(req, res, message) : messageCode[errorCode]
  };

  return res.status(statusCode).json(response);
}

/**
 * Localization response message via [accept-language] header
 * @param  {Object} req - request object
 * @param  {String} message - response message
 * @return {String} localized message
 */
function localizeResultMessage(req, res, message) {
  const locale = req.header['accept-language'] || req.query.lang || 'vi';

  if (message && res.locals.i18n.getLocales().indexOf(locale) > -1) {
    message = res.locals.__(message);
  }

  return message;
}
