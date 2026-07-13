import { z } from "zod";

/**
 * Audit log validation schemas.
 */
export const AuditValidation = {
  /* ---------- LIST AUDIT ---------- */
  list: z.object({
    userId: z.string().optional(),
    action: z.string().optional(),
    entity: z.string().optional(),
    entityId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    limit: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  }),
};
