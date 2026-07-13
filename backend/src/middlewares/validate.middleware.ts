import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/appError.util";
import { ParamsDictionary } from "express-serve-static-core";

/**
 * Validation middleware factory using Zod schemas.
 *
 * Validates request body, query, and/or params against provided schemas.
 *
 * Usage:
 *   router.post("/records", validate({ body: createRecordSchema }), controller);
 *   router.get("/records", validate({ query: listRecordsQuerySchema }), controller);
 */

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        const parsed = schemas.query.parse(req.query) as typeof req.query;
        Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true });
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as ParamsDictionary;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue: any) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        }));

        next(AppError.validationError(details));
        return;
      }

      next(error);
    }
  };
};
