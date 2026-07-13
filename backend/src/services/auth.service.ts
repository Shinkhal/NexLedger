import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, UserRole, UserStatus } from "../models";
import type { IUser } from "../models";
import { getEnv } from "../config/env.config";
import { logger } from "../utils/logger.util";
import { AppError } from "../utils/appError.util";
import { AuthPayload } from "../types";
import { SessionService } from "./session.service";
import { EmailService } from "./email.service";
import crypto from "crypto";

const SALT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  private constructor() {}

  static async register(input: RegisterInput) {
    const { email, password, name, role = UserRole.VIEWER } = input;

    const existing = await User.findOne({ email });
    if (existing) {
      throw AppError.conflict("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({ email, passwordHash, name, role });

    logger.info(`User registered: ${user.email} (${user.role})`);

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  static async login(input: LoginInput) {
    const { email, password, ipAddress, userAgent } = input;

    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      throw AppError.unauthorized("Invalid email or password");
    }
    const user = userDoc as unknown as IUser;

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.forbidden(
        `Account is ${user.status.toLowerCase()}. Contact an administrator.`
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const payload: Omit<AuthPayload, "sessionId"> = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = jwt.sign(payload, getEnv.jwt.accessSecret(), {
      expiresIn: getEnv.jwt.accessExpiresIn() as any,
    });

    const refreshToken = jwt.sign(
      { userId: String(user._id) },
      getEnv.jwt.refreshSecret(),
      { expiresIn: getEnv.jwt.refreshExpiresIn() as any }
    );

    const session = await SessionService.create({
      userId: String(user._id),
      token: accessToken,
      refreshToken,
      ipAddress,
      userAgent,
    });

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
      sessionId: String(session._id),
    };
  }

  static async refreshAccessToken(refreshToken: string) {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(
        refreshToken,
        getEnv.jwt.refreshSecret()
      ) as { userId: string };
    } catch {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    const session = await SessionService.findByRefreshToken(refreshToken);
    if (!session) {
      throw AppError.unauthorized("Session not found or expired");
    }

    const userDoc = await User.findById(decoded.userId);
    if (!userDoc || userDoc.status !== UserStatus.ACTIVE) {
      throw AppError.unauthorized("User not found or inactive");
    }
    const user = userDoc as unknown as IUser;

    const payload: Omit<AuthPayload, "sessionId"> = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const newAccessToken = jwt.sign(payload, getEnv.jwt.accessSecret(), {
      expiresIn: getEnv.jwt.accessExpiresIn() as any,
    });

    await SessionService.updateToken(session._id.toString(), newAccessToken);

    logger.debug(`Token refreshed for user: ${user.email}`);
    return { accessToken: newAccessToken };
  }

  static async logout(sessionId: string) {
    await SessionService.revoke(sessionId);
    logger.info(`Session revoked: ${sessionId}`);
  }

  static verifyAccessToken(token: string): AuthPayload & { iat: number; exp: number } {
    try {
      return jwt.verify(token, getEnv.jwt.accessSecret()) as AuthPayload & {
        iat: number;
        exp: number;
      };
    } catch {
      throw AppError.unauthorized("Invalid or expired access token");
    }
  }

  static async changePassword(input: ChangePasswordInput) {
    const { userId, currentPassword, newPassword } = input;

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User");
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.badRequest("Current password is incorrect");
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await User.findByIdAndUpdate(userId, { passwordHash: newHash });
    await SessionService.revokeAllForUser(userId);

    logger.info(`Password changed for user: ${user.email}`);
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.forbidden("Account is not active");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    await User.findByIdAndUpdate(user._id, {
      resetToken: token,
      resetTokenExpires: expires,
    });

    await EmailService.sendPasswordResetEmail(user.email, user.name, token);
    logger.info(`Password reset token sent to: ${email}`);
  }

  static async resetPassword(input: { token: string; newPassword: string }) {
    const { token, newPassword } = input;

    const userDoc = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!userDoc) {
      throw AppError.badRequest("Invalid or expired reset token");
    }
    const user = userDoc as unknown as IUser;

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    });

    await SessionService.revokeAllForUser(String(user._id));

    logger.info(`Password reset successfully for user: ${user.email}`);
  }
}
