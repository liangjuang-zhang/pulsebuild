/**
 * Authentication error types and codes
 */
export enum AuthErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_CODE = 'INVALID_CODE',
  CODE_EXPIRED = 'CODE_EXPIRED',
  MAX_ATTEMPTS_EXCEEDED = 'MAX_ATTEMPTS_EXCEEDED',
  USER_STATE_DETECTION_FAILED = 'USER_STATE_DETECTION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for authentication failures
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly retryable: boolean;

  constructor(message: string, code: AuthErrorCode, retryable: boolean = false) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.retryable = retryable;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}