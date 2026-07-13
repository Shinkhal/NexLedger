import { Request, Response, NextFunction } from "express";
import { AuditService } from "../services/audit.service";
import { sendPaginated } from "../utils/response.util";
import { parsePagination } from "../types";

/**
 * Audit log controller for admin oversight.
 */
export class AuditController {
  private constructor() {}

  /* ---------- ADMIN: LIST AUDIT LOGS ---------- */

  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = { ...req.query } as any;
      const pagination = parsePagination(query);
      const { logs, total } = await AuditService.list(query, pagination);
      return sendPaginated(res, logs, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  };
}
