import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { TIERS, type Tier } from "@/lib/tiers";

type PreviewBook = { id: string; title: string; thumbnail: string | null };

export function ExploreListCard({
  id,
  title,
  username,
  likeCount,
  commentCount,
  preview,
}: {
  id: string;
  title: string;
  username: string;
  likeCount: number;
  commentCount: number;
  preview: Record<Tier, PreviewBook[]>;
}) {
  const rankedTiers = TIERS.filter((tier) => tier !== "unranked");

  return (
    <Link
      href={`/lists/${id}`}
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">@{username}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {rankedTiers.map((tier) => {
          const books = preview[tier];
          if (books.length === 0) return null;

          return (
            <div key={tier} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                {tier}
              </span>
              <div className="flex gap-1">
                {books.slice(0, 6).map((book) => (
                  <div key={book.id} className="w-8">
                    <BookCover src={book.thumbnail} alt={book.title} size={32} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="size-3.5" /> {likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="size-3.5" /> {commentCount}
        </span>
      </div>
    </Link>
  );
}
