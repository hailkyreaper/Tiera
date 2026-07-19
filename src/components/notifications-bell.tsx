import { createClient } from "@/lib/supabase/server";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "@/lib/db/notifications";
import { NotificationsPopover } from "@/components/notifications-popover";

// Server-fetches initial data, hands it to the client popover — same
// Server-Component-fetches/Client-Component-handles-interaction split used
// by Sidebar/SidebarNav. Desktop-only for now (rendered inside TopBar,
// which is `lg:flex`) — the mobile counterpart (MobileTopBar) was removed
// after it was suspected of causing a mobile layout/click issue; mobile
// notifications need a new home before this comes back on small screens.
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
