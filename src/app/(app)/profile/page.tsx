import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
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
import { AvatarChangeControl } from "@/components/avatar-change-control";
import { ProfileBio } from "@/components/profile-bio";
import { RecommendationsRail } from "@/components/recommendations-rail";
import { createClient } from "@/lib/supabase/server";
import { assertNoSupabaseError } from "@/lib/supabase/assert";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { getUserListCards, cleanupAbandonedDrafts } from "@/lib/db/list-cards";
import { cn } from "@/lib/utils";
import {
  getLibraryBooks,
  sortLibraryBooks,
  type LibrarySort,
} from "@/lib/db/library";

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
        <span className="text-lg font-semibold text-foreground lg:text-xl">
          {listsCount}
        </span>
        <span className="text-xs text-muted-foreground uppercase">
          Tier Lists
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center lg:flex-none">
        <span className="text-lg font-semibold text-foreground lg:text-xl">
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
        <span className="text-lg font-semibold text-foreground lg:text-xl">
          {followingCount}
        </span>
        <span className="text-xs text-muted-foreground uppercase">
          Following
        </span>
      </Link>
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

  const profile = assertNoSupabaseError(
    await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, bio, location")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    "fetching profile",
  );

  const myLists = assertNoSupabaseError(
    await supabase
      .from("tier_lists")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_draft", false),
    "fetching your lists",
  );

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
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col xl:max-w-4xl">
        <div className="relative flex flex-col gap-3 px-4 pt-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          {edit !== "true" && (
            <Link
              href="/profile?edit=true"
              // z-20, not z-10 like its siblings (avatar row, stats row) —
              // at equal z-index, later DOM elements paint over earlier
              // ones regardless of position: absolute, so this button was
              // being visually and functionally covered by content that
              // comes after it in the markup (confirmed live via
              // elementFromPoint at the button's own coordinates resolving
              // to the avatar row on mobile, the stats row on desktop —
              // clicks landed on those instead of the button underneath).
              className="absolute top-4 right-4 z-20"
            >
              <Button type="button" variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          )}

          {/* Mobile: avatar + name row, then bio → location+joined stacked
           * full-width below it (matches design/topmatches-style profile
           * mockup). Desktop keeps its own untouched block right after.
           * Edit mode gets its own centered, name/username-free layout
           * instead — those are already editable as form fields below, so
           * showing them again as plain text next to the avatar was
           * redundant once you're in edit mode. */}
          <div className="z-10 flex flex-col gap-3 lg:hidden">
            {edit === "true" ? (
              <div className="flex flex-col items-center gap-2">
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.username ?? ""}
                  imageSize={144}
                  sizeClassName="size-24"
                  textClassName="text-3xl"
                  className="ring-2 ring-primary"
                />
                <AvatarChangeControl formId="edit-profile-form" context="mobile" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-1">
                    <Avatar
                      src={profile?.avatar_url}
                      name={profile?.username ?? ""}
                      imageSize={144}
                      sizeClassName="size-16"
                      textClassName="text-2xl"
                      className="ring-2 ring-primary"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col items-start">
                    {profile?.display_name && (
                      <p className="truncate text-lg font-semibold text-foreground">
                        {profile.display_name}
                      </p>
                    )}
                    <p
                      className={cn(
                        "truncate",
                        profile?.display_name
                          ? "text-sm text-muted-foreground"
                          : "text-lg font-semibold text-foreground",
                      )}
                    >
                      @{profile?.username}
                    </p>
                  </div>
                </div>

                <ProfileBio
                  bio={profile?.bio}
                  location={profile?.location}
                  joinedDate={joinedDate}
                  metaInline
                  className="flex flex-col items-start gap-1 text-left"
                />
              </>
            )}
          </div>

          <div className="z-10 hidden lg:flex lg:flex-row lg:items-center lg:gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full p-1">
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.username ?? ""}
                  imageSize={144}
                  sizeClassName="size-36"
                  textClassName="text-4xl"
                  className="ring-4 ring-primary"
                />
              </div>
              {edit === "true" && (
                <AvatarChangeControl formId="edit-profile-form" context="desktop" />
              )}
            </div>

            <div className="flex flex-col items-start">
              <div className="text-left">
                {profile?.display_name && (
                  <p className="text-xl font-semibold text-foreground">
                    {profile.display_name}
                  </p>
                )}
                <p
                  className={
                    profile?.display_name
                      ? "text-sm text-muted-foreground"
                      : "text-xl font-semibold text-foreground"
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
                  className="flex flex-col items-start gap-1 pt-2 text-left"
                />
              )}
            </div>
          </div>

          <ProfileStats
            listsCount={listsCount}
            booksRankedCount={booksRankedCount ?? 0}
            followingCount={followingCount ?? 0}
            className={cn(
              "z-10 flex w-full divide-x divide-border/60 border-b border-border/60 py-3 lg:w-auto lg:gap-10 lg:divide-x-0 lg:border-0 lg:pt-10 lg:pb-0",
              // Hidden on mobile in edit mode (already redundant with the
              // centered avatar-only header above it there) — desktop edit
              // mode is untouched, still shows it.
              edit === "true" && "hidden lg:flex",
            )}
          />
        </div>

        <div className="flex flex-1 flex-col items-center gap-6 px-4 pt-4 pb-4 text-center">
          {edit === "true" ? (
            <form
              id="edit-profile-form"
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
          ) : null}

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
