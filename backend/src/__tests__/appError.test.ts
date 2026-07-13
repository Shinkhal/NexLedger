import { describe, expect, test } from "bun:test";
import { AppError } from "../utils/appError.util";

describe("AppError", () => {
  test("creates error with default values", () => {
    const err = new AppError("test error");
    expect(err.message).toBe("test error");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err.details).toBeUndefined();
  });

  test("creates error with custom values", () => {
    const err = new AppError("custom", 400, "CUSTOM_CODE", [{ field: "test" }], false);
    expect(err.message).toBe("custom");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("CUSTOM_CODE");
    expect(err.details).toEqual([{ field: "test" }]);
    expect(err.isOperational).toBe(false);
  });

  test("badRequest factory", () => {
    const err = AppError.badRequest("bad input");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
  });

  test("badRequest factory with details", () => {
    const err = AppError.badRequest("bad input", [{ field: "email", message: "invalid" }]);
    expect(err.details).toEqual([{ field: "email", message: "invalid" }]);
  });

  test("unauthorized factory", () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Authentication required");
  });

  test("unauthorized factory with custom message", () => {
    const err = AppError.unauthorized("Custom auth error");
    expect(err.message).toBe("Custom auth error");
  });

  test("forbidden factory", () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  test("notFound factory", () => {
    const err = AppError.notFound("User");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("User not found");
  });

  test("notFound factory default", () => {
    const err = AppError.notFound();
    expect(err.message).toBe("Resource not found");
  });

  test("conflict factory", () => {
    const err = AppError.conflict("email exists");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
    expect(err.message).toBe("email exists");
  });

  test("validationError factory", () => {
    const details = [{ field: "amount", message: "must be positive", code: "invalid_number" }];
    const err = AppError.validationError(details);
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Validation failed");
    expect(err.details).toEqual(details);
  });

  test("internal factory", () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.isOperational).toBe(false);
  });

  test("is instanceof Error", () => {
    const err = AppError.badRequest("test");
    expect(err instanceof Error).toBe(true);
  });
});
