function errorHandlerResponse(errorMsg, errorCode) {
  console.log('errorMsg', errorMsg);
  const error = new Error('errorMsg');
  error.code = errorCode;

  return error;
}

module.exports = errorHandlerResponse;
