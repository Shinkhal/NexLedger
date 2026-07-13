import { AuditLog } from "../models";
import { logger } from "../utils/logger.util";
import { PaginationParams } from "../types";

interface LogActionInput {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogFilters {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

export class AuditService {
  private constructor() {}

  static async log(input: LogActionInput) {
    try {
      await AuditLog.create({
        userId: input.userId || undefined,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || undefined,
        oldValues: input.oldValues || undefined,
        newValues: input.newValues || undefined,
        ipAddress: input.ipAddress || undefined,
        userAgent: input.userAgent || undefined,
      });
    } catch (error) {
      logger.error("Failed to create audit log", { error, input });
    }
  }

  static async list(filters: AuditLogFilters, pagination: PaginationParams) {
    const query: Record<string, unknown> = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.entity) query.entity = filters.entity;
    if (filters.entityId) query.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = new Date(filters.startDate);
      if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("userId", ["_id", "name", "email"])
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total };
  }
}
