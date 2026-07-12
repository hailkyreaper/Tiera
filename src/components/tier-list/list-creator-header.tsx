import Link from "next/link";
import { Avatar } from "@/components/avatar";
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
        <Avatar
          src={avatarUrl}
          name={username}
          imageSize={32}
          sizeClassName="size-8"
          textClassName="text-xs"
        />
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
