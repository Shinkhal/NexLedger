import { z } from "zod";
import { UserRole } from "../models";

/**
 * Auth validation schemas.
 */
export const AuthValidation = {
  /* ---------- REGISTER ---------- */
  register: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.nativeEnum(UserRole).optional(),
  }),

  /* ---------- LOGIN ---------- */
  login: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string(),
  }),

  /* ---------- REFRESH TOKEN ---------- */
  refreshToken: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),

  /* ---------- CHANGE PASSWORD ---------- */
  changePassword: z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  }),

  /* ---------- FORGOT PASSWORD ---------- */
  forgotPassword: z.object({
    email: z.string().email("Invalid email address"),
  }),

  /* ---------- RESET PASSWORD ---------- */
  resetPassword: z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  }),
};
