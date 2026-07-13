import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.util";
import { AppError } from "../utils/appError.util";
import { getEnv } from "../config/env.config";

/**
 * Global error handler middleware.
 * Catches all errors thrown in routes/services and returns a standardized response.
 */
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // If it's our custom AppError, use its properties
  if (err instanceof AppError) {
    logger.error(
      `[${req.method}] ${req.path} >> ${err.statusCode} ${err.code}: ${err.message}`
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        ...(getEnv.app.isDev() && { stack: err.stack }),
      },
    });
    return;
  }

  // Unexpected errors
  logger.error(`[${req.method}] ${req.path} >> Unhandled Error:`, err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
      ...(getEnv.app.isDev() && { stack: err.stack }),
    },
  });
};
