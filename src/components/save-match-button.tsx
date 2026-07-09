import { Heart } from "lucide-react";
import { toggleSavedMatch } from "@/app/(app)/compare/actions";
import { Button } from "@/components/ui/button";

export function SaveMatchButton({
  savedUserId,
  username,
  isSaved,
}: {
  savedUserId: string;
  username: string;
  isSaved: boolean;
}) {
  return (
    <form action={toggleSavedMatch} className="flex-1">
      <input type="hidden" name="savedUserId" value={savedUserId} />
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="isSaved" value={isSaved.toString()} />
      <Button
        type="submit"
        variant={isSaved ? "outline" : "default"}
        className="w-full gap-1.5"
      >
        <Heart className={`size-4 ${isSaved ? "fill-current" : ""}`} />
        {isSaved ? "Match Saved" : "Save Match"}
      </Button>
    </form>
  );
}
