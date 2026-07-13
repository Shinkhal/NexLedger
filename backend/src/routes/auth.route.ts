import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthValidation } from "../validations/auth.validation";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimiter.middleware";
import { UserController } from "../controllers/user.controller";

const router = Router();

/* =====================================
   PUBLIC ROUTES (rate limited)
===================================== */

router.use(authLimiter);

/** Register new user */
router.post(
  "/register",
  validate({ body: AuthValidation.register }),
  AuthController.register
);

/** Login with credentials */
router.post(
  "/login",
  validate({ body: AuthValidation.login }),
  AuthController.login
);

/** Refresh access token */
router.post(
  "/refresh",
  validate({ body: AuthValidation.refreshToken }),
  AuthController.refresh
);

/** Forgot password - send email */
router.post(
  "/forgot-password",
  validate({ body: AuthValidation.forgotPassword }),
  AuthController.forgotPassword
);

/** Reset password - use token */
router.post(
  "/reset-password",
  validate({ body: AuthValidation.resetPassword }),
  AuthController.resetPassword
);

/* =====================================
   AUTH REQUIRED ROUTES
===================================== */

/** Get current user profile */
router.get(
  "/me",
  authMiddleware,
  UserController.getProfile
);

/** Logout current session */
router.post(
  "/logout",
  authMiddleware,
  AuthController.logout
);

/** Change password */
router.post(
  "/change-password",
  authMiddleware,
  validate({ body: AuthValidation.changePassword }),
  AuthController.changePassword
);

export default router;
