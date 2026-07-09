import { toggleFollow } from "@/app/(app)/u/actions";
import { Button } from "@/components/ui/button";

export function FollowButton({
  targetUserId,
  username,
  isFollowing,
}: {
  targetUserId: string;
  username: string;
  isFollowing: boolean;
}) {
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="isFollowing" value={isFollowing.toString()} />
      <Button type="submit" variant={isFollowing ? "outline" : "default"} size="sm">
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </form>
  );
}
