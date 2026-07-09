import Image from "next/image";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format-time";

export function ListCreatorHeader({
  username,
  avatarUrl,
  createdAt,
  action,
}: {
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={username}
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {username[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex flex-col">
          <Link
            href={`/u/${username}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            @{username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
      {action}
    </div>
  );
}
