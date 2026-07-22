import { G as object, H as string, a2 as _enum, Y as number, a3 as array } from "./index-CSpjggkr.js";
_enum([
  "domain",
  "mcp",
  "aeo",
  "gsc",
  "competitor"
]);
const dashboardProjectInputSchema = object({
  projectId: string().min(1)
});
const dashboardAiVisibilityPlatformSchema = object({
  platform: _enum(["chat_gpt", "google"]),
  mentions: number().int().nonnegative().nullable(),
  aiSearchVolume: number().int().nonnegative().nullable()
});
object({
  status: _enum(["cached", "empty"]),
  resolvedTarget: string().nullable(),
  fetchedAt: string().nullable(),
  totalMentions: number().int().nonnegative().nullable(),
  totalAiSearchVolume: number().int().nonnegative().nullable(),
  perPlatform: array(dashboardAiVisibilityPlatformSchema),
  // A few example prompts the brand surfaced for, to make the card concrete.
  sampleQueries: array(string()).max(3)
});
export {
  dashboardProjectInputSchema as d
};
