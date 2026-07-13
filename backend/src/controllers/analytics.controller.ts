import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { sendSuccess } from "../utils/response.util";

/**
 * Analytics controller for dashboard summaries and trends.
 */
export class AnalyticsController {
  private constructor() {}

  /* ---------- GET SUMMARY ---------- */

  static getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await AnalyticsService.getSummary({ ...req.query } as any);
      return sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET CATEGORY BREAKDOWN ---------- */

  static getCategoryBreakdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const breakdown = await AnalyticsService.getCategoryBreakdown({ ...req.query } as any);
      return sendSuccess(res, breakdown);
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET MONTHLY TRENDS ---------- */

  static getMonthlyTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trends = await AnalyticsService.getMonthlyTrends({ ...req.query } as any);
      return sendSuccess(res, trends);
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET WEEKLY TRENDS ---------- */

  static getWeeklyTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trends = await AnalyticsService.getWeeklyTrends({ ...req.query } as any);
      return sendSuccess(res, trends);
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET RECENT ACTIVITY ---------- */

  static getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const activity = await AnalyticsService.getRecentActivity({ ...req.query } as any, limit);
      return sendSuccess(res, activity);
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET INCOME ---------- */

  static getIncome = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await AnalyticsService.getSummary({ ...req.query } as any);
      return sendSuccess(res, { totalIncome: summary.totalIncome });
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET EXPENSES ---------- */

  static getExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await AnalyticsService.getSummary({ ...req.query } as any);
      return sendSuccess(res, { totalExpenses: summary.totalExpenses });
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET BALANCE ---------- */

  static getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await AnalyticsService.getSummary({ ...req.query } as any);
      return sendSuccess(res, { netBalance: summary.netBalance });
    } catch (error) {
      next(error);
    }
  };

  /* ---------- GET RATIO ---------- */

  static getRatio = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ratio = await AnalyticsService.getIncomeExpenseRatio({ ...req.query } as any);
      return sendSuccess(res, ratio);
    } catch (error) {
      next(error);
    }
  };
}
