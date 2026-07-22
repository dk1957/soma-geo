import { z } from "zod";

export const dashboardHeroStepSchema = z.enum([
  "domain",
  "mcp",
  "aeo",
  "gsc",
  "competitor",
]);
export type DashboardHeroStep = z.infer<typeof dashboardHeroStepSchema>;

export const dashboardProjectInputSchema = z.object({
  projectId: z.string().min(1),
});

/**
 * Compact summary of a project's AI answer-engine visibility for the dashboard
 * card. This is a *read-only peek* at the last cached Brand Lookup result for
 * the project domain — it never triggers a paid DataForSEO call. `status` is
 * "cached" when a fresh lookup exists to summarize, otherwise "empty" (the
 * card then shows a CTA to run a lookup).
 */
export const dashboardAiVisibilityPlatformSchema = z.object({
  platform: z.enum(["chat_gpt", "google"]),
  mentions: z.number().int().nonnegative().nullable(),
  aiSearchVolume: z.number().int().nonnegative().nullable(),
});

export const dashboardAiVisibilitySchema = z.object({
  status: z.enum(["cached", "empty"]),
  resolvedTarget: z.string().nullable(),
  fetchedAt: z.string().nullable(),
  totalMentions: z.number().int().nonnegative().nullable(),
  totalAiSearchVolume: z.number().int().nonnegative().nullable(),
  perPlatform: z.array(dashboardAiVisibilityPlatformSchema),
  // A few example prompts the brand surfaced for, to make the card concrete.
  sampleQueries: z.array(z.string()).max(3),
});
export type DashboardAiVisibility = z.infer<typeof dashboardAiVisibilitySchema>;
