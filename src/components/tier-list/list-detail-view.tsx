import { TopNav } from "@/components/top-nav";
import { ListCreatorHeader } from "./list-creator-header";
import { ListDescription } from "./list-description";
import { FollowButton } from "@/components/follow-button";
import { MatchBadge } from "@/components/match-badge";
import { ReadOnlyTierBoard, type DetailedColumns } from "./read-only-board";

/**
 * The visitor-facing "viewing someone else's list" experience — creator
 * header (with Follow), title, match % (when applicable), then the
 * read-only board. Like/comment count no longer live up here — same as
 * OwnListView, they now sit together in CommentsSection's own heading
 * (comment count left, like button right — see its likeCount/isLiked
 * props, passed from the page for both views). Deliberately kept as a
 * separate component from OwnListView so owner-only changes never leak
 * into what a visitor sees, and vice versa.
 */
export function ListDetailView({
  title,
  description,
  tags,
  creatorUsername,
  creatorAvatarUrl,
  createdAt,
  targetUserId,
  isFollowing,
  showFollow,
  matchPercentage,
  columns,
}: {
  title: string;
  description: string | null;
  tags: string[] | null;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  createdAt: string;
  targetUserId: string;
  isFollowing: boolean;
  showFollow: boolean;
  matchPercentage: number | null;
  columns: DetailedColumns;
}) {
  return (
    <>
      <TopNav />
      <ListCreatorHeader
        username={creatorUsername}
        avatarUrl={creatorAvatarUrl}
        createdAt={createdAt}
        action={
          showFollow ? (
            <FollowButton
              targetUserId={targetUserId}
              username={creatorUsername}
              isFollowing={isFollowing}
            />
          ) : undefined
        }
      />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <ListDescription description={description} tags={tags} />
      </div>
      {matchPercentage !== null && <MatchBadge percentage={matchPercentage} />}
      <div className="rounded-sm bg-card p-4">
        <ReadOnlyTierBoard columns={columns} />
      </div>
    </>
  );
}
