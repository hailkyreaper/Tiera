import { Avatar } from "@/components/avatar";
import { BookCover } from "@/components/book-cover";
import { formatRelativeTime } from "@/lib/format-time";

const serifStyle = {
  fontFamily:
    '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif',
};

export type ActivityItem = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bookId: string;
  bookTitle: string;
  bookThumbnail: string | null;
  createdAt: string;
};

// design2/offset.png's "Stay in the loop" section — real activity (each
// row is that person's actual most-recently-ranked book, real timestamp)
// rather than the reference's placeholder rows/colors. Used to sit offset
// in the right two-thirds on desktop, paired against MatchingShowcase
// taking the left two-thirds — now that Matching is gone, a one-sided
// offset had nothing to balance against, so this is back to a plain
// centered section like How it works/the final CTA. Desktop-only now
// (rendered inside a `hidden lg:block` wrapper at the call site) — mobile
// covers the same "stay connected" idea via How it works' Connect step.
export function FriendActivity({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) return null;

  return (
    <section className="py-8 lg:py-12">
      <p className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        Stay in the loop
      </p>
      <h2
        className="mb-4 max-w-[22ch] text-[27px] leading-[1.2] font-semibold tracking-tight text-balance lg:text-[34px]"
        style={serifStyle}
      >
        See what your friends are reading.
      </h2>

      <div className="flex flex-col divide-y divide-border rounded-sm bg-card p-5 lg:p-6">
        {activity.map((item) => (
          <div
            key={item.userId}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={item.avatarUrl}
                name={item.username}
                imageSize={40}
                sizeClassName="size-10"
                textClassName="text-sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">
                  <span className="font-semibold">
                    {item.displayName ?? `@${item.username}`}
                  </span>{" "}
                  ranked a new book
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </div>
            <div className="w-10 shrink-0">
              <BookCover src={item.bookThumbnail} alt={item.bookTitle} size={40} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
