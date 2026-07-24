import { Scale, Tags, ThumbsDown, type LucideIcon } from "lucide-react";
import { InfoPopover } from "@/components/info-popover";

type Row = { icon: LucideIcon; label: string; value: number };

// Adapted from design2's 4-metric version: "Reading volume" dropped per
// feedback, and the remaining 3 are real ratios derived from
// getComparisonSummary's already-computed counts rather than invented
// sub-percentages. Genre alignment is omitted entirely (not just zeroed)
// when there's no real Top Shared Genre to measure against — same honesty
// rule topSharedGenre itself already follows.
//
// "Top tier agreement" (bothLove.length / sharedBookCount, i.e. only
// counting pairs where BOTH rated A-tier+) was tried and replaced with
// "Tier Alignment" — confirmed live that the narrower version reads as
// misleadingly low for a pair who agree closely but don't often both reach
// A/S specifically (a 95%-match pair with zero real disagreements across 12
// shared books still showed "50%," since half their agreed books were only
// B/B or C/C). Tier Alignment instead measures the real thing people expect
// from that label: the share of shared books that AREN'T a real
// disagreement, computed by the caller as
// (sharedBookCount - disagreeOn.length) / sharedBookCount.
export function AgreementBreakdown({
  tierAlignment,
  genreAlignment,
  lowTierAgreement,
}: {
  tierAlignment: number;
  genreAlignment: number | null;
  lowTierAgreement: number;
}) {
  const rows: Row[] = [
    { icon: Scale, label: "Tier Alignment", value: tierAlignment },
    ...(genreAlignment !== null
      ? [{ icon: Tags, label: "Genre alignment", value: genreAlignment }]
      : []),
    // ThumbsDown, not TrendingDown — a high % here is a form of agreement
    // (you both disliked the same books), not a negative trend, so an
    // icon implying decline read as the wrong sentiment.
    { icon: ThumbsDown, label: "Low tier agreement", value: lowTierAgreement },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-sm bg-card p-4">
      <div className="flex items-center gap-1">
        <h2 className="text-sm font-semibold text-foreground">
          Agreement breakdown
        </h2>
        <InfoPopover>
          <p>
            <span className="font-medium text-foreground">
              Tier Alignment
            </span>{" "}
            — how many of your shared books you&apos;re NOT in real
            disagreement on (within 1 tier of each other).
          </p>
          <p className="mt-2">
            <span className="font-medium text-foreground">
              Genre alignment
            </span>{" "}
            — how many of your shared books fall in your Top Shared Genre.
          </p>
          <p className="mt-2">
            <span className="font-medium text-foreground">
              Low tier agreement
            </span>{" "}
            — how many of your shared books you both rated C-tier or lower.
          </p>
        </InfoPopover>
      </div>
      <div className="flex flex-col gap-3.5">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Icon className="size-3.5 text-primary" />
                {label}
              </span>
              <span className="font-semibold text-foreground">{value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
