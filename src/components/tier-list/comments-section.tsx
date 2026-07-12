import Link from "next/link";
import { Send } from "lucide-react";
import { addComment, deleteComment } from "@/app/(app)/lists/social-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LikeButton } from "./like-button";
import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/lib/format-time";

export type CommentView = {
  id: string;
  body: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  isOwn: boolean;
};

export function CommentsSection({
  tierListId,
  comments,
  canComment,
  likeCount,
  isLiked,
}: {
  tierListId: string;
  comments: CommentView[];
  canComment: boolean;
  likeCount: number;
  isLiked: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          {comments.length} Comments
        </h2>
        <LikeButton
          tierListId={tierListId}
          likeCount={likeCount}
          isLiked={isLiked}
        />
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <Avatar
                src={comment.avatarUrl}
                name={comment.username}
                imageSize={32}
                sizeClassName="size-8"
                textClassName="text-xs"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/u/${comment.username}`}
                    className="text-xs font-medium text-foreground hover:underline"
                  >
                    @{comment.username}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.body}</p>
              </div>
              {comment.isOwn && (
                <form action={deleteComment}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="tierListId" value={tierListId} />
                  <Button type="submit" size="xs" variant="ghost">
                    Delete
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <form action={addComment} className="flex gap-2">
          <input type="hidden" name="tierListId" value={tierListId} />
          <Input
            name="body"
            placeholder="Add a comment..."
            maxLength={1000}
            required
            className="flex-1"
          />
          <Button type="submit" size="icon" aria-label="Post comment">
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
