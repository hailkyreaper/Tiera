import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { MapPin, CalendarDays } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FavoritesRow } from "@/components/favorites-row";
import { ExploreListCard } from "@/components/explore/list-card";
import { ProfileTabs } from "@/components/profile-tabs";
import { LibrarySection } from "@/components/library-section";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteBooks } from "@/lib/db/favorites";
import { getUserListCards } from "@/lib/db/list-cards";
import {
  getLibraryBooks,
  sortLibraryBooks,
  type LibrarySort,
} from "@/lib/db/library";

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

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const favoriteBooks = await getFavoriteBooks(supabase, user.id, 5);
  const listCards =
    tab === "lists" ? await getUserListCards(supabase, user.id) : [];

  const libraryBooksRaw =
    tab === "library" ? await getLibraryBooks(supabase, user.id) : [];
  const sort: LibrarySort =
    rawSort === "title" || rawSort === "author" || rawSort === "rating"
      ? rawSort
      : "recent";
  const libraryBooks = sortLibraryBooks(libraryBooksRaw, sort);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div className="relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-b-[20px] bg-gradient-to-br from-primary/60 via-indigo-950 to-purple-950 px-6 pt-5 pb-6">
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

        {profile?.avatar_url ? (
          <div className="z-10 rounded-full p-1">
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={96}
              height={96}
              className="size-24 rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="z-10 rounded-full p-1">
            <div className="flex size-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          </div>
        )}

        <div className="z-10 text-center">
          {profile?.display_name && (
            <p className="text-lg font-semibold text-foreground">
              {profile.display_name}
            </p>
          )}
          <p
            className={
              profile?.display_name
                ? "text-sm text-muted-foreground"
                : "text-lg font-semibold text-foreground"
            }
          >
            @{profile?.username}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 px-6 pt-5 pb-12 text-center">
        <div className="flex w-full justify-around">
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-foreground">
              {listsCount}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Tier Lists
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-foreground">
              {booksRankedCount ?? 0}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Books Ranked
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-muted-foreground">
              —
            </span>
            <span className="text-xs text-muted-foreground uppercase">
              Avg Match
            </span>
          </div>
        </div>

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
              <Input id="avatar" type="file" name="avatar" accept="image/*" />
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
          <div className="flex w-full flex-col items-start gap-1 text-left">
            {profile?.bio && (
              <p className="text-sm text-foreground">{profile.bio}</p>
            )}
            {profile?.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Joined {joinedDate}
            </span>
          </div>
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
                    You don&apos;t have any tier lists yet.
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
                      preview={list.preview}
                      fromTab="profile"
                    />
                  ))
                )}
              </div>
            ) : (
              <LibrarySection books={libraryBooks} currentSort={sort} />
            )}
          </>
        )}

        <form action={logout} className="mt-auto pt-6">
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}
