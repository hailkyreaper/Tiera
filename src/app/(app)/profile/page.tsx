import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, CalendarDays, Sparkles } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FavoritesRow } from "@/components/favorites-row";
import { ExploreListCard } from "@/components/explore/list-card";
import { ProfileTabs } from "@/components/profile-tabs";
import { LibraryTab } from "@/components/library-tab";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Avatar } from "@/components/avatar";
import { RecommendationsRail } from "@/components/recommendations-rail";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { getUserListCards, cleanupAbandonedDrafts } from "@/lib/db/list-cards";
import { cn } from "@/lib/utils";
import {
  getLibraryBooks,
  sortLibraryBooks,
  type LibrarySort,
} from "@/lib/db/library";

// Rendered twice: once in its original mobile position (`lg:hidden`,
// unchanged markup/classes so mobile stays pixel-identical) and once inside
// the desktop header row (`hidden lg:flex`), matching design/Desktop.png's
// horizontal avatar+stats layout — CSS alone can't relocate an element
// across a different parent's painted background depending on breakpoint,
// so this renders the same three stats twice rather than one repositioned
// via responsive classes (same pattern already used for NavBar/Sidebar).
function ProfileStats({
  listsCount,
  booksRankedCount,
  followingCount,
  className,
}: {
  listsCount: number;
  booksRankedCount: number;
  followingCount: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-1 flex-col items-center lg:flex-none">
        <span className="text-xl font-semibold text-foreground">
          {listsCount}
        </span>
        <span className="text-xs text-muted-foreground uppercase">
          Tier Lists
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center lg:flex-none">
        <span className="text-xl font-semibold text-foreground">
          {booksRankedCount}
        </span>
        <span className="text-xs text-muted-foreground uppercase">
          Books Ranked
        </span>
      </div>
      <Link
        href="/profile/following"
        className="flex flex-1 flex-col items-center lg:flex-none"
      >
        <span className="text-xl font-semibold text-foreground">
          {followingCount}
        </span>
        <span className="text-xs text-muted-foreground uppercase">
          Following
        </span>
      </Link>
    </div>
  );
}

// Same rendered-twice reasoning as ProfileStats above — design/Desktop.png
// shows bio/location/joined inside the same header card as the avatar and
// name (not below it, as mobile has always shown it), so the desktop
// instance moves into that column while the mobile instance keeps its
// original position/classes untouched via `lg:hidden`.
function ProfileBio({
  bio,
  location,
  joinedDate,
  className,
}: {
  bio?: string | null;
  location?: string | null;
  joinedDate: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {bio && <p className="text-sm text-foreground">{bio}</p>}
      {location && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {location}
        </span>
      )}
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        Joined {joinedDate}
      </span>
    </div>
  );
}

type ProfileRow = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    edit?: string;
    tab?: string;
    sort?: string;
  }>;
}) {
  const { error, edit, tab: rawTab, sort: rawSort } = await searchParams;
  const tab: "lists" | "library" = rawTab === "library" ? "library" : "lists";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio, location")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const { data: myLists } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_draft", false);

  const listIds = (myLists ?? []).map((list) => list.id);
  const listsCount = listIds.length;

  const { count: booksRankedCount } =
    listIds.length > 0
      ? await supabase
          .from("tier_list_items")
          .select("id", { count: "exact", head: true })
          .in("tier_list_id", listIds)
          .neq("tier", "unranked")
      : { count: 0 };

  const { count: followingCount } = await supabase
    .from("follows")
    .select("following_id", { count: "exact", head: true })
    .eq("follower_id", user.id);

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const favoriteBooks = await getFavoriteBooks(supabase, user.id, 5);
  if (tab === "lists") {
    await cleanupAbandonedDrafts(supabase, user.id);
  }
  const listCards =
    tab === "lists" ? await getUserListCards(supabase, user.id) : [];

  const libraryBooksRaw =
    tab === "library" ? await getLibraryBooks(supabase, user.id) : [];
  const sort: LibrarySort =
    rawSort === "title" ||
    rawSort === "author" ||
    rawSort === "rating" ||
    rawSort === "custom"
      ? rawSort
      : "recent";
  const libraryBooks = sortLibraryBooks(libraryBooksRaw, sort);

  return (
    <div className="flex w-full flex-1 lg:gap-6 lg:p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-3xl xl:max-w-4xl">
        <div className="relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-b-[20px] bg-gradient-to-br from-primary/60 via-indigo-950 to-purple-950 px-4 pt-5 pb-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6 lg:rounded-[20px] lg:px-8 lg:py-8">
          <div className="absolute -top-16 -left-10 size-56 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute top-0 -right-12 size-48 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35))]" />

          {edit !== "true" && (
            <Link
              href="/profile?edit=true"
              className="absolute top-4 right-4 z-10"
            >
              <Button type="button" variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          )}

          <div className="z-10 flex flex-col items-center gap-1 lg:flex-row lg:items-center lg:gap-4">
            <div className="rounded-full p-1">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.username ?? ""}
                imageSize={144}
                sizeClassName="size-24 lg:size-36"
                textClassName="text-2xl lg:text-4xl"
                className="lg:ring-4 lg:ring-primary"
              />
            </div>

            <div className="flex flex-col items-center lg:items-start">
              <div className="text-center lg:text-left">
                {profile?.display_name && (
                  <p className="text-lg font-semibold text-foreground lg:text-xl">
                    {profile.display_name}
                  </p>
                )}
                <p
                  className={
                    profile?.display_name
                      ? "text-sm text-muted-foreground"
                      : "text-lg font-semibold text-foreground lg:text-xl"
                  }
                >
                  @{profile?.username}
                </p>
              </div>

              {edit !== "true" && (
                <ProfileBio
                  bio={profile?.bio}
                  location={profile?.location}
                  joinedDate={joinedDate}
                  className="hidden lg:flex lg:flex-col lg:items-start lg:gap-1 lg:pt-2 lg:text-left"
                />
              )}
            </div>
          </div>

          <ProfileStats
            listsCount={listsCount}
            booksRankedCount={booksRankedCount ?? 0}
            followingCount={followingCount ?? 0}
            className="z-10 hidden lg:flex lg:w-auto lg:gap-10 lg:pt-10"
          />
        </div>

        <div className="flex flex-1 flex-col items-center gap-6 px-4 pt-4 pb-4 text-center">
          <ProfileStats
            listsCount={listsCount}
            booksRankedCount={booksRankedCount ?? 0}
            followingCount={followingCount ?? 0}
            className="flex lg:hidden"
          />

          {edit === "true" ? (
            <form
              action={updateProfile}
              className="flex w-full flex-col gap-4 text-left"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  maxLength={50}
                  defaultValue={profile?.display_name ?? ""}
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="avatar">Profile picture</Label>
                <label
                  htmlFor="avatar"
                  className="inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-sm bg-muted px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  Upload
                </label>
                <input
                  id="avatar"
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="sr-only"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  name="bio"
                  maxLength={160}
                  defaultValue={profile?.bio ?? ""}
                  placeholder="Fantasy, sci-fi, and anything with great characters."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  maxLength={100}
                  defaultValue={profile?.location ?? ""}
                  placeholder="Seattle, WA"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Save
                </Button>
                <Link href="/profile" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          ) : (
            <ProfileBio
              bio={profile?.bio}
              location={profile?.location}
              joinedDate={joinedDate}
              className="flex w-full flex-col items-start gap-1 text-left lg:hidden"
            />
          )}

          {edit !== "true" && (
            <>
              <FavoritesRow
                books={favoriteBooks}
                viewMoreHref="/profile/favorites"
              />

              <ProfileTabs current={tab} />

              {tab === "lists" ? (
                <div className="flex w-full flex-col gap-3">
                  <h2 className="text-xs font-semibold text-left text-muted-foreground uppercase">
                    Lists
                  </h2>
                  {listCards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tier lists yet.
                    </p>
                  ) : (
                    listCards.map((list) => (
                      <ExploreListCard
                        key={list.id}
                        id={list.id}
                        title={list.title}
                        username={profile?.username ?? ""}
                        avatarUrl={profile?.avatar_url}
                        createdAt={list.createdAt}
                        likeCount={list.likeCount}
                        commentCount={list.commentCount}
                        isPublic={list.isPublic}
                        isDraft={list.isDraft}
                        preview={list.preview}
                        fromTab="profile"
                        showOwnerControls
                      />
                    ))
                  )}

                  <div className="hidden w-full items-center justify-between gap-4 rounded-sm bg-card p-6 lg:flex">
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Discover your next favorite
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Compare tier lists and find books you&apos;ll actually
                          love.
                        </p>
                      </div>
                    </div>
                    <Link href="/explore">
                      <Button type="button">Explore Lists</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <LibraryTab books={libraryBooks} currentSort={sort} />
              )}
            </>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <ThemeToggleButton />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </div>

      {edit !== "true" && (
        <Suspense fallback={null}>
          <RecommendationsRail />
        </Suspense>
      )}
    </div>
  );
}
