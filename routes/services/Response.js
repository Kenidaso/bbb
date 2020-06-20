const keystone = require('keystone');
const { Statics } = keystone;

const { HTTP_STATUS_CODE } = Statics.Constant;
const messageCode = Statics.messageCode;
const ERROR_CODE = Statics.errorCode;

const VALUES_ERROR_CODE = Object.values(ERROR_CODE);

let findCodeDebug = (errorCode) => {
  let index = VALUES_ERROR_CODE.findIndex((e) => e === errorCode);
  return index < 0 ? undefined : Object.keys(ERROR_CODE)[index];
}

let handleError_string = (req, res, error, result) => {
  result = result || {};

  if (typeof result === 'number') {
    result = { errorCode: result }
  }

  let message, data, statusCode;
  let errorCode = ERROR_CODE[error];
  let codeDebug = error.startsWith('E') ? error :  undefined;

  data = result;
  if (typeof result === 'object') {
    message = result.message;
    statusCode = result.statusCode;

    if (!statusCode && result.status) {
      let status = Number(result.status);

      if (!Number.isNaN(status) && status >= 400 && status < 500) statusCode = status
    }

    if (result.codeDebug) codeDebug = result.codeDebug;
    data = result.data || result;
  }

  return _Error(req, res, errorCode, codeDebug, data, message, statusCode);
}

let handleError_object = (req, res, error, result) => {
  let { errorCode, message, data, statusCode, codeDebug } = error;

  data = result;
  if (result && typeof result === 'object') {
    if (result.message) message = result.message;
    if (result.statusCode) statusCode = result.statusCode;
    if (result.codeDebug) codeDebug = result.codeDebug;
    data = result.data || result;

    if (!statusCode && result.status) {
      let status = Number(result.status);

      if (!Number.isNaN(status) && status >= 400 && status < 500) statusCode = status
    }
  }

  if (!message && error instanceof Error) {
    message = error.toString();
  }

  return _Error(req, res, errorCode, codeDebug, data, message, statusCode);
}

let handleError_number = (req, res, error, result) => {
  let errorCode = error;
  let message, data, statusCode;
  let codeDebug = findCodeDebug(errorCode);

  data = result;
  if (result && typeof result === 'object') {
    message = result.message;
    statusCode = result.statusCode;
    if (result.codeDebug) codeDebug = result.codeDebug;
    data = result.data || result;

    if (!statusCode && result.status) {
      let status = Number(result.status);

      if (!Number.isNaN(status) && status >= 400 && status < 500) statusCode = status
    }
  }

  return _Error(req, res, errorCode, codeDebug, data, message, statusCode);
}

module.exports = {
  error: (req, res, error, result) => {
    // console.log('Response.error', typeof error, 'error=', error);
    // console.log('Response.error', typeof result, 'result=', result);

    if (typeof error === 'string') { // EDEFAULT
      return handleError_string(req, res, error, result);
    }

    if (typeof error === 'object') {
      return handleError_object(req, res, error, result);
    }

    if (typeof error === 'number') {
      return handleError_number(req, res, error, result);
    }

    return _Error(req, res, undefined, undefined, { error, result });
  },

  success: _Success,

  _objError: (codeDebug, message, statusCode, data) => {
    return { codeDebug, message, statusCode, data };
  }
}

function _Success (req, res, data = {}, message = 'success', statusCode = HTTP_STATUS_CODE.SUCCESS) {
  const response = {
    error   : 0,
    data    : data,
    message : message ? localizeResultMessage(req, res, message) : ''
  };

  return res.status(statusCode).json(response);
}

function _Error (req, res, errorCode = -1, errorCodeDebug = 'EDEFAULT', data = {}, message = '', statusCode = HTTP_STATUS_CODE.BAD_REQUEST) {
  if (message === '') message = messageCode[errorCode] || messageCode[-1];

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
  req.query = req.query || {};
  const locale = req.headers['accept-language'] || req.query.lang || 'vi';

  if (message && res.locals.i18n.getLocales().indexOf(locale) > -1) {
    message = res.locals.__(message);
  }

  return message;
}
