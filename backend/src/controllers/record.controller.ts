import { Request, Response, NextFunction } from "express";
import { RecordService } from "../services/record.service";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.util";
import { AuthenticatedRequest, parsePagination } from "../types";

export class RecordController {
  private constructor() {}

  static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await RecordService.create(req.body);
      return sendCreated(res, record, "Financial record created successfully");
    } catch (error) {
      next(error);
    }
  };

  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = parsePagination(req.query as any);
      const filters = {
        ...req.query,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      };

      const { records, total } = await RecordService.list(filters as any, pagination);
      return sendPaginated(res, records, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await RecordService.getById(req.params.id as string);
      return sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await RecordService.update(req.params.id as string, req.body);
      return sendSuccess(res, record, "Financial record updated successfully");
    } catch (error) {
      next(error);
    }
  };

  static delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await RecordService.delete(req.params.id as string, (req as AuthenticatedRequest).user.userId);
      return sendSuccess(res, null, "Financial record deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}
