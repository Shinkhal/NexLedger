import { Router, Request, Response, NextFunction } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { AnalyticsValidation } from "../validations/analytics.validation";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { analystAndAbove } from "../middlewares/rbac.middleware";

const router = Router();

/* =====================================
   ALL ANALYTICS (Analyst + Admin)
===================================== */

router.use(authMiddleware );
router.use(analystAndAbove );

const mergeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    Object.defineProperty(req, "query", {
      value: { ...(req.query ), ...req.body },
      writable: true, configurable: true,
    });
  }
  next();
};

/** Summary */
router.get("/summary", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getSummary);
router.query("/summary", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getSummary);

/** Category breakdown */
router.get("/categories", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getCategoryBreakdown);
router.query("/categories", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getCategoryBreakdown);

/** Monthly trends */
router.get("/trends/monthly", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getMonthlyTrends);
router.query("/trends/monthly", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getMonthlyTrends);

/** Weekly trends */
router.get("/trends/weekly", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getWeeklyTrends);
router.query("/trends/weekly", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getWeeklyTrends);

/** Recent records */
router.get("/recent", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getRecentActivity);
router.query("/recent", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getRecentActivity);

/** Total income */
router.get("/income", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getIncome);
router.query("/income", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getIncome);

/** Total expenses */
router.get("/expenses", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getExpenses);
router.query("/expenses", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getExpenses);

/** Net balance */
router.get("/balance", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getBalance);
router.query("/balance", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getBalance);

/** Income/Expense ratio */
router.get("/ratio", validate({ query: AnalyticsValidation.filters }), AnalyticsController.getRatio);
router.query("/ratio", mergeBody, validate({ query: AnalyticsValidation.filters }), AnalyticsController.getRatio);

export default router;
