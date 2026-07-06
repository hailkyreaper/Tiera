export const TIERS = ["S", "A", "B", "C", "D", "F", "unranked"] as const;
export type Tier = (typeof TIERS)[number];
