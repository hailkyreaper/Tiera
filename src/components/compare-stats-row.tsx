import { CheckCircle2, ChevronDown, FileWarning } from "lucide-react";

export function CompareStatsRow({
  sharedFavoritesCount,
  sharedDislikesCount,
  disagreementsCount,
}: {
  sharedFavoritesCount: number;
  sharedDislikesCount: number;
  disagreementsCount: number;
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
    <div className="grid grid-cols-3 gap-2">
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
    </div>
  );
}
