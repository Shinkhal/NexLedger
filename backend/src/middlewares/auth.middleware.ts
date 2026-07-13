import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AuthService } from "../services/auth.service";
import { AppError } from "../utils/appError.util";
import { SessionService } from "../services/session.service";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Missing or malformed authorization header");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw AppError.unauthorized("Token not provided");
    }

    const decoded = AuthService.verifyAccessToken(token);

    const session = await SessionService.findByToken(token);
    if (!session) {
      throw AppError.unauthorized("Session expired or revoked");
    }

    if (session.expiresAt < new Date()) {
      throw AppError.unauthorized("Session has expired");
    }

    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status,
      sessionId: session._id.toString(),
    };

    next();
  } catch (error) {
    next(error);
  }
};
