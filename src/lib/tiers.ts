export const TIERS = ["S", "A", "B", "C", "D", "F", "unranked"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_BADGE_COLORS: Record<Exclude<Tier, "unranked">, string> = {
  S: "bg-red-600",
  A: "bg-orange-600",
  B: "bg-amber-600",
  C: "bg-emerald-600",
  D: "bg-blue-600",
  F: "bg-slate-600",
};
