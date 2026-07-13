import { Router } from "express";
import { RecordController } from "../controllers/record.controller";
import { RecordValidation } from "../validations/record.validation";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminOnly, allRoles } from "../middlewares/rbac.middleware";

const router = Router();

/** List all records */
router.get(
  "/",
  authMiddleware ,
  allRoles ,
  validate({ query: RecordValidation.list }),
  RecordController.list
);

/** Query records with body filters */
router.query(
  "/",
  authMiddleware ,
  allRoles ,
  (req: any, _res: any, next: any) => {
    Object.defineProperty(req, "query", { value: { ...req.query, ...req.body }, writable: true, configurable: true });
    next();
  },
  validate({ query: RecordValidation.list }),
  RecordController.list
);

/** Get record by ID */
router.get(
  "/:id",
  authMiddleware ,
  allRoles ,
  validate({ params: RecordValidation.objectId }),
  RecordController.getById
);

/** Create new record */
router.post(
  "/",
  authMiddleware ,
  adminOnly ,
  validate({ body: RecordValidation.create }),
  RecordController.create
);

/** Update record */
router.patch(
  "/:id",
  authMiddleware ,
  adminOnly ,
  validate({ params: RecordValidation.objectId, body: RecordValidation.update }),
  RecordController.update
);

/** Soft delete record */
router.delete(
  "/:id",
  authMiddleware ,
  adminOnly ,
  validate({ params: RecordValidation.objectId }),
  RecordController.delete 
);

export default router;
