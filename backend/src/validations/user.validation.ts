import { z } from "zod";
import { UserRole, UserStatus } from "../models";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const UserValidation = {
  /* ---------- OBJECT ID PARAM ---------- */
  objectId: z.object({
    id: z.string().regex(objectIdRegex, "Invalid user ID"),
  }),

  /* ---------- LIST USERS (Admin) ---------- */
  list: z.object({
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    search: z.string().optional(),
    page: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    limit: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  }),

  /* ---------- CREATE USER (Admin) ---------- */
  create: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.nativeEnum(UserRole).default(UserRole.VIEWER),
    status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
    phoneNumber: z.string().optional(),
    timezone: z.string().optional(),
  }),

  /* ---------- UPDATE USER (Admin) ---------- */
  update: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phoneNumber: z.string().optional(),
    avatar: z.string().url("Invalid avatar URL").optional(),
    timezone: z.string().optional(),
  }).strict(),

  /* ---------- UPDATE ROLE (Admin) ---------- */
  updateRole: z.object({
    role: z.nativeEnum(UserRole),
  }),

  /* ---------- UPDATE STATUS (Admin) ---------- */
  updateStatus: z.object({
    status: z.nativeEnum(UserStatus),
  }),

  /* ---------- UPDATE PROFILE (Self) ---------- */
  updateProfile: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phoneNumber: z.string().optional(),
    avatar: z.string().url("Invalid avatar URL").optional(),
    timezone: z.string().optional(),
  }).strict(),
};
