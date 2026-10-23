export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== null && this.details !== undefined ? { details: this.details } : {})
      }
    };
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class AiConfigurationError extends AppError {
  constructor(message = 'AI review service is not configured') {
    super(message, 503, 'AI_NOT_CONFIGURED', null);
  }
}

export class AiProviderError extends AppError {
  constructor(message, statusCode = 502, details = null) {
    super(message, statusCode, 'AI_PROVIDER_ERROR', details);
  }
}

export class AiTimeoutError extends AppError {
  constructor(message = 'AI provider request timed out') {
    super(message, 504, 'AI_TIMEOUT_ERROR', null);
  }
}

export class AiRateLimitError extends AppError {
  constructor(message = 'AI provider rate limit exceeded') {
    super(message, 429, 'AI_RATE_LIMIT_ERROR', null);
  }
}

export default {
  AppError,
  ValidationError,
  AiConfigurationError,
  AiProviderError,
  AiTimeoutError,
  AiRateLimitError
};
