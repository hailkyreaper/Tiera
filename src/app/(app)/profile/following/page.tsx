import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/top-nav";
import { FollowButton } from "@/components/follow-button";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default async function FollowingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((row) => row.following_id);

  const { data: profiles } =
    followingIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", followingIds)
          .returns<ProfileRow[]>()
      : { data: [] as ProfileRow[] };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
      <TopNav title="Following" />

      {profiles && profiles.length > 0 ? (
        <div className="flex flex-col divide-y divide-border">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between gap-2 py-3"
            >
              <Link
                href={`/u/${profile.username}`}
                className="flex min-w-0 items-center gap-2"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username}
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {profile.username[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex min-w-0 flex-col">
                  {profile.display_name && (
                    <span className="truncate text-sm font-medium text-foreground">
                      {profile.display_name}
                    </span>
                  )}
                  <span className="truncate text-xs text-muted-foreground">
                    @{profile.username}
                  </span>
                </div>
              </Link>
              <FollowButton
                targetUserId={profile.id}
                username={profile.username}
                isFollowing
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You&apos;re not following anyone yet.
        </p>
      )}
    </div>
  );
}
