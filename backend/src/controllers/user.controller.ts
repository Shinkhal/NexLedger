import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.util";
import { AuthenticatedRequest, parsePagination } from "../types";

export class UserController {
  private constructor() {}

  static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.create(req.body);
      return sendCreated(res, user, "User created successfully");
    } catch (error) {
      next(error);
    }
  };

  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = { ...req.query } as any;
      const pagination = parsePagination(query);
      const { users, total } = await UserService.list(query, pagination);
      return sendPaginated(res, users, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.getById(req.params.id as string);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.update(req.params.id as string, req.body);
      return sendSuccess(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  };

  static updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.updateRole(req.params.id as string, req.body.role);
      return sendSuccess(res, user, "User role updated successfully");
    } catch (error) {
      next(error);
    }
  };

  static updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.updateStatus(req.params.id as string, req.body.status);
      return sendSuccess(res, user, "User status updated successfully");
    } catch (error) {
      next(error);
    }
  };

  static delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await UserService.delete(req.params.id as string);
      return sendSuccess(res, null, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  static getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await UserService.getProfile((req as AuthenticatedRequest).user.userId);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  };

  static updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await UserService.updateProfile((req as AuthenticatedRequest).user.userId, req.body);
      return sendSuccess(res, profile, "Profile updated successfully");
    } catch (error) {
      next(error);
    }
  };
}
