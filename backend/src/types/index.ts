import { Request } from "express";

export enum UserRole {
  VIEWER = "VIEWER",
  ANALYST = "ANALYST",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  query: PaginationQuery,
  maxLimit = 100
): PaginationParams {
  const parsedPage = parseInt(query.page || "1", 10);
  const page = Math.max(1, isNaN(parsedPage) ? 1 : parsedPage);
  const parsedLimit = parseInt(query.limit || "20", 10);
  const limit = Math.min(maxLimit, Math.max(1, isNaN(parsedLimit) ? 20 : parsedLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
