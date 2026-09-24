import { z } from "zod";

export const createOptionSetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Option set name is required.")
    .max(100, "Option set name must be 100 characters or fewer."),

  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional()
    .transform((value) => value || null),

  internalNote: z
    .string()
    .trim()
    .max(1000, "Internal note must be 1000 characters or fewer.")
    .optional()
    .transform((value) => value || null),

  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export type CreateOptionSetInput = z.infer<
  typeof createOptionSetSchema
>;