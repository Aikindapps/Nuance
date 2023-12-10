export enum ErrorType {
  SessionTimeOut,
  User,
}

// inspects error message and attempt to classify the error type
// so it can be handled properly
export const getErrorType = (err: any): ErrorType => {
  if (err.message.includes('sender delegation has expired')) {
    return ErrorType.SessionTimeOut;
  }
  return ErrorType.User;
};
