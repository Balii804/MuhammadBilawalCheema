export class DomainError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, httpStatus = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientQuotaError extends DomainError {
  constructor(message?: string, details?: unknown) {
    super(
      'INSUFFICIENT_QUOTA',
      message || 'User has exceeded available message quota.',
      402,
      details
    );
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, details?: unknown) {
    super('NOT_FOUND', `${entity} not found.`, 404, details);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 422, details);
  }
}

