import { z } from "zod";
import { RecordType, RecordCategory } from "../models";

/**
 * Financial Record validation schemas.
 */
const objectIdRegex = /^[a-f\d]{24}$/i;

export const RecordValidation = {
  /* ---------- OBJECT ID PARAM ---------- */
  objectId: z.object({
    id: z.string().regex(objectIdRegex, "Invalid record ID"),
  }),

  /* ---------- LIST RECORDS ---------- */
  list: z.object({
    userId: z.string().optional(),
    type: z.nativeEnum(RecordType).optional(),
    category: z.nativeEnum(RecordCategory).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    minAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    maxAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    page: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    limit: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  }),

  /* ---------- CREATE RECORD (Admin) ---------- */
  create: z.object({
    userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
    amount: z.number().positive("Amount must be greater than 0"),
    type: z.nativeEnum(RecordType),
    category: z.nativeEnum(RecordCategory),
    date: z.string().datetime("Invalid date format (ISO 8601 required)"),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    attachments: z.array(z.string().url()).optional(),
  }),

  /* ---------- UPDATE RECORD (Admin) ---------- */
  update: z.object({
    amount: z.number().positive("Amount must be greater than 0").optional(),
    type: z.nativeEnum(RecordType).optional(),
    category: z.nativeEnum(RecordCategory).optional(),
    date: z.string().datetime("Invalid date format (ISO 8601 required)").optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    attachments: z.array(z.string().url()).optional(),
  }).strict(),
};
