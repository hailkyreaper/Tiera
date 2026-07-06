import { Heart } from "lucide-react";
import { toggleLike } from "@/app/lists/social-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LikeButton({
  tierListId,
  likeCount,
  isLiked,
}: {
  tierListId: string;
  likeCount: number;
  isLiked: boolean;
}) {
  return (
    <form action={toggleLike}>
      <input type="hidden" name="tierListId" value={tierListId} />
      <input type="hidden" name="isLiked" value={isLiked.toString()} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className={cn(isLiked && "text-primary")}
      >
        <Heart className={cn("size-4", isLiked && "fill-current")} />
        {likeCount}
      </Button>
    </form>
  );
}
