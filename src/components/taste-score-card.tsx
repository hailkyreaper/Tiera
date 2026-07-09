import { InfoPopover } from "@/components/info-popover";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TasteScoreCard({
  bestMatchPercentage,
  matchedUserPercentage,
}: {
  bestMatchPercentage: number;
  matchedUserPercentage: number;
}) {
  const offset = CIRCUMFERENCE * (1 - bestMatchPercentage / 100);

  return (
    <div className="flex flex-col gap-3 rounded-sm bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Your taste score
        </span>
        <InfoPopover>
          <p className="font-medium text-foreground">{bestMatchPercentage}%</p>
          <p className="mt-1">
            Your single highest taste match with anyone on Tiera — how well
            your top match&apos;s book ratings line up with yours.
          </p>
          <p className="mt-2 font-medium text-foreground">
            {matchedUserPercentage}% of users
          </p>
          <p className="mt-1">
            How many people on Tiera share enough ranked books with you (3+)
            to even calculate a match percentage for.
          </p>
        </InfoPopover>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex size-24 shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="8"
              className="stroke-muted"
            />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="stroke-primary"
            />
          </svg>
          <span className="absolute text-xl font-bold text-foreground">
            {bestMatchPercentage}%
          </span>
        </div>
        <p className="text-sm text-foreground">
          Great taste! You match with {matchedUserPercentage}% of users on
          Tiera.
        </p>
      </div>
    </div>
  );
}
