import { Router, Request, Response, NextFunction } from "express";
import { AuditController } from "../controllers/audit.controller";
import { AuditValidation } from "../validations/audit.validation";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/rbac.middleware";

const router = Router();

const mergeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    Object.defineProperty(req, "query", {
      value: { ...(req.query ), ...req.body },
      writable: true, configurable: true,
    });
  }
  next();
};

/** Admin-only list audit logs */
router.get(
  "/",
  authMiddleware ,
  adminOnly ,
  validate({ query: AuditValidation.list }),
  AuditController.list
);

router.query(
  "/",
  authMiddleware ,
  adminOnly ,
  mergeBody ,
  validate({ query: AuditValidation.list }),
  AuditController.list
);

export default router;
