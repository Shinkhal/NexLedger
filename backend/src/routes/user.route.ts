import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/user.controller";
import { UserValidation } from "../validations/user.validation";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/rbac.middleware";

const router = Router();

/* =====================================
   SELF ROUTES (Profile)
===================================== */

/** Get current user profile */
router.get(
  "/me",
  authMiddleware ,
  UserController.getProfile 
);

/** Update current user profile */
router.patch(
  "/me",
  authMiddleware ,
  validate({ body: UserValidation.updateProfile }),
  UserController.updateProfile 
);

/* =====================================
   ADMIN ROUTES (User management)
===================================== */

const mergeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    Object.defineProperty(req, "query", {
      value: { ...(req.query ), ...req.body },
      writable: true, configurable: true,
    });
  }
  next();
};

/** Create user */
router.post(
  "/",
  authMiddleware ,
  adminOnly ,
  validate({ body: UserValidation.create }),
  UserController.create
);

/** List all users */
router.get(
  "/",
  authMiddleware ,
  adminOnly ,
  validate({ query: UserValidation.list }),
  UserController.list
);

router.query(
  "/",
  authMiddleware ,
  adminOnly ,
  mergeBody ,
  validate({ query: UserValidation.list }),
  UserController.list
);

/** Get user by ID */
router.get(
  "/:id",
  authMiddleware ,
  adminOnly ,
  validate({ params: UserValidation.objectId }),
  UserController.getById
);

/** Update user details */
router.patch(
  "/:id",
  authMiddleware ,
  adminOnly ,
  validate({ params: UserValidation.objectId, body: UserValidation.update }),
  UserController.update
);

/** Change user role */
router.patch(
  "/:id/role",
  authMiddleware ,
  adminOnly ,
  validate({ params: UserValidation.objectId, body: UserValidation.updateRole }),
  UserController.updateRole
);

/** Change user status */
router.patch(
  "/:id/status",
  authMiddleware ,
  adminOnly ,
  validate({ params: UserValidation.objectId, body: UserValidation.updateStatus }),
  UserController.updateStatus
);

/** Delete user */
router.delete(
  "/:id",
  authMiddleware ,
  adminOnly ,
  validate({ params: UserValidation.objectId }),
  UserController.delete
);

export default router;
