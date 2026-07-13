import { Router, Request, Response, NextFunction } from "express";
import healthRouter from "./health.route";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import recordRouter from "./record.route";
import analyticsRouter from "./analytics.route";
import auditRouter from "./audit.route";
import { authMiddleware } from "../middlewares/auth.middleware";
import { UserController } from "../controllers/user.controller";

const router = Router();

/* =====================================
   CORE ROUTES
===================================== */

/** System Health */
router.use("/health", healthRouter);

/** Authentication (Register, Login, Refresh) */
router.use("/auth", authRouter);

/** Current user profile */
router.get(
  "/me",
  authMiddleware ,
  UserController.getProfile 
);

/** Users & Profiles */
router.use("/users", userRouter);

/** Financial Records */
router.use("/records", recordRouter);

/** Dashboard Analytics */
router.use("/analytics", analyticsRouter);

/** System Audit Logs */
router.use("/audit", auditRouter);

export default router;
