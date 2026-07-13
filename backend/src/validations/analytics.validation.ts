import { z } from "zod";

/**
 * Analytics validation schemas.
 */
export const AnalyticsValidation = {
  /* ---------- COMMON FILTERS ---------- */
  filters: z.object({
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
};
