import { Request, Response, NextFunction } from "express";
import { HealthService } from "../services/health.service";
import { sendSuccess } from "../utils/response.util";

export const getHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const health = await HealthService.getStatus();
    return sendSuccess(res, health, "System health status");
  } catch (error) {
    next(error);
  }
};
