import { CheckCircle2, ChevronDown, FileWarning, Sparkles } from "lucide-react";

export function CompareStatsRow({
  sharedFavoritesCount,
  sharedDislikesCount,
  disagreementsCount,
  topSharedGenre,
}: {
  sharedFavoritesCount: number;
  sharedDislikesCount: number;
  disagreementsCount: number;
  // Text-only stat (no count) — design2/04's 4th tile. Omitted entirely
  // rather than showing a fabricated genre when there's no real category
  // data to tally (see taste-match.ts's tallyTopGenre — only ever computed
  // from real bothLove books now, no more all-shared-books fallback).
  topSharedGenre: string | null;
}) {
  const stats = [
    {
      icon: CheckCircle2,
      value: sharedFavoritesCount,
      label: "Shared Favorites",
      caption: "Books you both love",
      color: "text-emerald-500",
    },
    {
      icon: ChevronDown,
      value: sharedDislikesCount,
      label: "Shared Dislikes",
      caption: "Books you both didn't enjoy",
      color: "text-orange-500",
    },
    {
      icon: FileWarning,
      value: disagreementsCount,
      label: "Biggest Disagreements",
      caption: "Books you rated very differently",
      color: "text-primary",
    },
  ];

  return (
    <div
      className={`grid gap-2 ${topSharedGenre ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"}`}
    >
      {stats.map(({ icon: Icon, value, label, caption, color }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 rounded-sm bg-card p-3 text-center ring-1 ring-foreground/10"
        >
          <Icon className={`size-5 ${color}`} />
          <span className="text-xl font-semibold text-foreground">
            {value}
          </span>
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className="text-[0.65rem] text-muted-foreground">
            {caption}
          </span>
        </div>
      ))}

      {topSharedGenre && (
        <div className="flex flex-col items-center gap-1 rounded-sm bg-card p-3 text-center ring-1 ring-foreground/10">
          <Sparkles className="size-5 text-pink-500" />
          <span className="text-xl font-semibold text-foreground">
            {topSharedGenre}
          </span>
          <span className="text-xs font-medium text-foreground">
            Top Shared Genre
          </span>
          <span className="text-[0.65rem] text-muted-foreground">
            You both love this genre
          </span>
        </div>
      )}
    </div>
  );
}
