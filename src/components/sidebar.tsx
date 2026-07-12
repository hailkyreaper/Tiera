import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "./sidebar-nav";
import { Avatar } from "@/components/avatar";

// Logo lives in TopBar now, not here — having it in both places read as
// redundant once the top bar existed. Sidebar starts straight at the nav.

type ProfileRow = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

// Desktop-only left rail (hidden below `lg`, NavBar covers mobile — see that
// component). Server component so the bottom user card can be fetched here
// directly; the interactive nav itself is split out into the client
// SidebarNav since it needs usePathname/router.
export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: ProfileRow | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();
    profile = data;
  }

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-80 shrink-0 flex-col border-r border-border p-6 lg:flex">
      <SidebarNav />

      <div className="flex-1" />

      {profile && (
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-sm p-2.5 hover:bg-muted"
        >
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name || profile.username}
            imageSize={40}
            sizeClassName="size-10"
            textClassName="text-sm"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {profile.display_name || profile.username}
            </span>
            <span className="truncate text-sm text-muted-foreground">
              @{profile.username}
            </span>
          </div>
        </Link>
      )}
    </aside>
  );
}
