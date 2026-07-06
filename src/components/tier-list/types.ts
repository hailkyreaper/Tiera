import type { Tier } from "@/lib/tiers";

export type Card = {
  bookId: string;
  itemId: string | null;
  title: string;
  thumbnail: string | null;
};

export type ContainerId = Tier | "library";

export type Columns = Record<ContainerId, Card[]>;
