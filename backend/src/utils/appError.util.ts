/**
 * Custom application error class with HTTP status codes.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>[];

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: Record<string, unknown>[],
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ---------- Factory Methods ----------

  static badRequest(message: string, details?: Record<string, unknown>[]) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(resource = "Resource") {
    return new AppError(`${resource} not found`, 404, "NOT_FOUND");
  }

  static conflict(message: string) {
    return new AppError(message, 409, "CONFLICT");
  }

  static validationError(details: Record<string, unknown>[]) {
    return new AppError("Validation failed", 422, "VALIDATION_ERROR", details);
  }

  static internal(message = "Something went wrong") {
    return new AppError(message, 500, "INTERNAL_ERROR", undefined, false);
  }
}
