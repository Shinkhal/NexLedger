import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../utils/appError.util";
import { UserRole } from "../types";

export const rbac = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw AppError.unauthorized("Authentication required");
      }

      if (!allowedRoles.includes(authReq.user.role)) {
        throw AppError.forbidden(
          `Role '${authReq.user.role}' is not authorized for this action. Required: ${allowedRoles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const adminOnly = rbac(UserRole.ADMIN);

export const analystAndAbove = rbac(UserRole.ANALYST, UserRole.ADMIN);

export const allRoles = rbac(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN);
