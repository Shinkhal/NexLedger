import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { sendSuccess, sendCreated } from "../utils/response.util";
import { AuthenticatedRequest } from "../types";

export class AuthController {
  private constructor() {}

  static register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await AuthService.register(req.body);
      return sendCreated(res, user, "User registered successfully");
    } catch (error) {
      next(error);
    }
  };

  static login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.login({
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return sendSuccess(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  };

  static refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.refreshAccessToken(req.body.refreshToken);
      return sendSuccess(res, result, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  };

  static logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.logout((req as AuthenticatedRequest).user.sessionId);
      return sendSuccess(res, null, "Logout successful");
    } catch (error) {
      next(error);
    }
  };

  static changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await AuthService.changePassword({
        userId: (req as AuthenticatedRequest).user.userId,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
      });
      return sendSuccess(res, null, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  };

  static forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.forgotPassword(req.body.email);
      return sendSuccess(res, null, "Password reset email sent if account exists");
    } catch (error) {
      next(error);
    }
  };

  static resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.resetPassword(req.body);
      return sendSuccess(res, null, "Password reset successfully");
    } catch (error) {
      next(error);
    }
  };
}
