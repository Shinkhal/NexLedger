import { Session } from "../models";
import { logger } from "../utils/logger.util";

interface CreateSessionInput {
  userId: string;
  token: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionService {
  private constructor() {}

  static async create(input: CreateSessionInput) {
    const { userId, token, refreshToken, ipAddress, userAgent } = input;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await Session.create({
      userId,
      token,
      refreshToken,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      expiresAt,
    });

    logger.debug(`Session created for user: ${userId}`);
    return session;
  }

  static async findByToken(token: string) {
    return Session.findOne({ token }).populate("userId").lean();
  }

  static async findByRefreshToken(refreshToken: string) {
    return Session.findOne({ refreshToken }).lean();
  }

  static async findById(id: string) {
    return Session.findById(id).lean();
  }

  static async updateToken(sessionId: string, newToken: string) {
    return Session.findByIdAndUpdate(sessionId, { token: newToken }).lean();
  }

  static async revoke(sessionId: string) {
    await Session.findByIdAndDelete(sessionId);
    logger.debug(`Session revoked: ${sessionId}`);
  }

  static async revokeAllForUser(userId: string) {
    const result = await Session.deleteMany({ userId });
    logger.info(`Revoked ${result.deletedCount} sessions for user: ${userId}`);
    return result.deletedCount;
  }

  static async cleanupExpired() {
    const result = await Session.deleteMany({ expiresAt: { $lt: new Date() } });
    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} expired sessions`);
    }
    return result.deletedCount;
  }
}
