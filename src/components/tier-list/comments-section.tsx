import { addComment, deleteComment } from "@/app/lists/social-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type CommentView = {
  id: string;
  body: string;
  username: string;
  isOwn: boolean;
};

export function CommentsSection({
  tierListId,
  comments,
  canComment,
}: {
  tierListId: string;
  comments: CommentView[];
  canComment: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase">
        Comments ({comments.length})
      </h2>

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
          <Button type="submit">Post</Button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start justify-between gap-2 rounded-2xl bg-card p-3"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-medium text-foreground">
                  @{comment.username}
                </p>
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
    </div>
  );
}
