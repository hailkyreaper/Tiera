import { MapPin, CalendarDays } from "lucide-react";

export function ProfileBio({
  bio,
  location,
  joinedDate,
  metaInline = false,
  className,
}: {
  bio?: string | null;
  location?: string | null;
  joinedDate: string;
  /** Put location and "Joined X" on the same line instead of stacked. */
  metaInline?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {bio && <p className="text-sm text-foreground">{bio}</p>}
      <div
        className={metaInline ? "flex flex-wrap items-center gap-3" : "contents"}
      >
        {location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {location}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Joined {joinedDate}
        </span>
      </div>
    </div>
  );
}
