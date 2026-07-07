import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getComparisonSummary, getTopRecommendation } from "@/lib/db/taste-match";
import { CompareBookRow } from "@/components/compare-book-row";
import { TopRecommendationCard } from "@/components/top-recommendation-card";

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

function Avatar({ profile }: { profile: ProfileRow }) {
  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={profile.username}
        width={80}
        height={80}
        className="size-20 rounded-full object-cover ring-4 ring-primary"
      />
    );
  }
  return (
    <div className="flex size-20 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground ring-4 ring-primary">
      {profile.username[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export default async function CompareWithUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const { data: them } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .ilike("username", username)
    .maybeSingle<ProfileRow>();

  if (!me || !them) {
    notFound();
  }

  if (them.id === me.id) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Compare</h1>
        <p className="text-muted-foreground">
          That&apos;s you! Search for someone else to compare with.
        </p>
      </div>
    );
  }

  const [{ match, bothLove, disagreeOn }, recommendation] = await Promise.all([
    getComparisonSummary(supabase, me.id, them.id),
    getTopRecommendation(supabase, me.id, them.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
      <div className="grid grid-cols-3 items-center">
        <Link
          href="/compare"
          className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-center text-lg font-semibold text-foreground">
          Compare
        </h1>
      </div>

      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex w-full items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar profile={me} />
            <span className="text-sm text-foreground">@{me.username}</span>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            VS
          </span>
          <div className="flex flex-col items-center gap-2">
            <Avatar profile={them} />
            <span className="text-sm text-foreground">@{them.username}</span>
          </div>
        </div>

        {match.percentage === null ? (
          <p className="text-muted-foreground">
            Not enough shared books yet ({match.sharedBookCount}/3) — rank
            more of the same books to see a taste match here.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-foreground">
              {match.percentage}%
            </span>
            <span className="text-sm text-muted-foreground">
              Taste Match ({match.sharedBookCount} shared books)
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 text-left">
        <h2 className="text-lg font-semibold text-foreground">Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <CompareBookRow title="You Both Love" books={bothLove} />
          <CompareBookRow title="You Disagree On" books={disagreeOn} />
        </div>
      </div>

      {recommendation && (
        <TopRecommendationCard
          recommendation={recommendation}
          theirUsername={them.username}
          path={`/compare/${username}`}
        />
      )}
    </div>
  );
}
