/**
 * Zod schemas for runtime validation
 */

import { z } from "zod";
import type { EditFormat } from "../constants/edit-formats";

export const EditFormatSchema = z.enum([
  "str_replace",
  "str_replace_fuzzy",
  "apply_patch",
  "hashline",
  "editblock",
]);

export const RouteConfigSchema = z.object({
  patterns: z.array(z.string()),
  confidenceThreshold: z.number().min(0).max(1),
  skill: z.string().optional(),
  skillChain: z.array(z.string()).optional(),
  strategy: z.enum(["direct", "single_skill", "skill_chain", "rlm"]),
});

export const IntentRoutesSchema = z.object({
  routes: z.array(RouteConfigSchema).optional(),
});

export const FormatConfigSchema = z.object({
  formats: z.record(z.string(), EditFormatSchema),
});

export type ValidatedRouteConfig = z.infer<typeof RouteConfigSchema>;
export type ValidatedIntentRoutes = z.infer<typeof IntentRoutesSchema>;
export type ValidatedFormatConfig = z.infer<typeof FormatConfigSchema>;
