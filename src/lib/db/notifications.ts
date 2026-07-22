import type { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/assert";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type NotificationType = "follow" | "comment" | "like";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actorUsername: string;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  tierListId: string | null;
  tierListTitle: string | null;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  actor_id: string;
  tier_list_id: string | null;
  read: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type TierListRow = { id: string; title: string };

const NOTIFICATIONS_LIMIT = 20;

// Two follow-up queries (profiles, tier_lists) rather than a PostgREST
// embed — notifications.actor_id only has a real FK to auth.users, not to
// profiles directly, so an embedded `profiles!actor_id(...)` join isn't
// available; same batch-fetch-then-Map pattern already used throughout
// (e.g. explore/page.tsx's profileByUserId).
// Backs the notification bell — supplementary top-bar UI, not core page
// content, so failures here (logSupabaseError below) degrade to "no
// notifications" rather than throwing and taking down the whole page.
export async function getNotifications(
  supabase: SupabaseServerClient,
  userId: string,
  limit = NOTIFICATIONS_LIMIT,
): Promise<NotificationItem[]> {
  const rows = logSupabaseError(
    await supabase
      .from("notifications")
      .select("id, type, actor_id, tier_list_id, read, created_at")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<NotificationRow[]>(),
    "fetching notifications",
    [],
  );

  const items = rows ?? [];
  if (items.length === 0) return [];

  const actorIds = [...new Set(items.map((row) => row.actor_id))];
  const listIds = [
    ...new Set(
      items
        .map((row) => row.tier_list_id)
        .filter((id): id is string => !!id),
    ),
  ];

  const [profilesResult, listsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", actorIds)
      .returns<ProfileRow[]>(),
    listIds.length > 0
      ? supabase
          .from("tier_lists")
          .select("id, title")
          .in("id", listIds)
          .returns<TierListRow[]>()
      : Promise.resolve({ data: [] as TierListRow[], error: null }),
  ]);
  const profiles = logSupabaseError(
    profilesResult,
    "fetching notification actor profiles",
    [],
  );
  const lists = logSupabaseError(
    listsResult,
    "fetching notification tier lists",
    [],
  );

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const listById = new Map((lists ?? []).map((l) => [l.id, l]));

  return items.map((row) => {
    const actor = profileById.get(row.actor_id);
    const list = row.tier_list_id ? listById.get(row.tier_list_id) : undefined;

    return {
      id: row.id,
      type: row.type,
      read: row.read,
      createdAt: row.created_at,
      actorUsername: actor?.username ?? "unknown",
      actorDisplayName: actor?.display_name ?? null,
      actorAvatarUrl: actor?.avatar_url ?? null,
      tierListId: row.tier_list_id,
      tierListTitle: list?.title ?? null,
    };
  });
}

export async function getUnreadNotificationCount(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("read", false);

  return count ?? 0;
}
