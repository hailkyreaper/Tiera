import { createClient } from "@/lib/supabase/server";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "@/lib/db/notifications";
import { NotificationsPopover } from "@/components/notifications-popover";

// Server-fetches initial data, hands it to the client popover — same
// Server-Component-fetches/Client-Component-handles-interaction split used
// by Sidebar/SidebarNav. Rendered twice (desktop TopBar, mobile
// MobileTopBar), each hidden at the other's breakpoint via CSS — same
// "duplicate but only one ever visible" approach already used for Explore's
// two tab bars, rather than a shared client-side data-fetching boundary.
export async function NotificationsBell() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(supabase, user.id),
    getUnreadNotificationCount(supabase, user.id),
  ]);

  return (
    <NotificationsPopover
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
