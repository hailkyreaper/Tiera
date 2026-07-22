"use client";

import { useState } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/lib/format-time";
import { markAllNotificationsRead } from "@/app/(app)/notifications/actions";
import type { NotificationItem } from "@/lib/db/notifications";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  follow: UserPlus,
  comment: MessageCircle,
  like: Heart,
} as const;

function notificationHref(notification: NotificationItem): string {
  if (notification.type === "follow") {
    return `/u/${notification.actorUsername}`;
  }
  return notification.tierListId ? `/lists/${notification.tierListId}` : "#";
}

function notificationText(notification: NotificationItem): string {
  const name = notification.actorDisplayName ?? `@${notification.actorUsername}`;
  switch (notification.type) {
    case "follow":
      return `${name} started following you`;
    case "comment":
      return `${name} commented on "${notification.tierListTitle ?? "your list"}"`;
    case "like":
      return `${name} liked "${notification.tierListTitle ?? "your list"}"`;
  }
}

export function NotificationsPopover({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  function handleOpenChange(open: boolean) {
    if (!open || unreadCount === 0) return;

    // Optimistic: clear the badge and read-dots immediately rather than
    // waiting on a round-trip — this is a "did you see it" flag, not
    // something that needs to survive a failed request being noticed.
    setUnreadCount(0);
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead();
  }

  return (
    <Popover.Root onOpenChange={handleOpenChange}>
      <Popover.Trigger
        aria-label="Notifications"
        className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-primary" />
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup className="w-80 rounded-sm bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Notifications
              </h2>
            </div>

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <div className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto">
                {notifications.map((notification) => {
                  const Icon = TYPE_ICON[notification.type];
                  return (
                    <Popover.Close
                      key={notification.id}
                      render={<Link href={notificationHref(notification)} />}
                      nativeButton={false}
                      className="flex items-start gap-3 px-4 py-3 text-left hover:bg-muted active:bg-muted"
                    >
                      <Avatar
                        src={notification.actorAvatarUrl}
                        name={notification.actorUsername}
                        imageSize={36}
                        sizeClassName="size-9"
                        textClassName="text-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          {notificationText(notification)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <Icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          notification.read
                            ? "text-muted-foreground"
                            : "text-primary",
                        )}
                      />
                    </Popover.Close>
                  );
                })}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
