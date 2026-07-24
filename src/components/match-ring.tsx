import { cn } from "@/lib/utils";

// Shared "orbit ring" — a thin circular progress arc whose sweep reflects a
// match percentage, wrapping whatever's passed as children (an avatar, an
// icon, a percentage label). Used at 3 scales across Compare: the taste-
// score hero card, each row in the Top Matches list, and the detail page's
// avatar + match-score ring — one consistent match-visualization idiom
// instead of a different meter shape in each spot.
export function MatchRing({
  percentage,
  size,
  strokeWidth = 3,
  className,
  children,
}: {
  percentage: number;
  size: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary"
        />
      </svg>
      {children}
    </div>
  );
}
