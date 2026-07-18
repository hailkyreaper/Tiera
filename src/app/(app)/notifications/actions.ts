"use server";

import { createClient } from "@/lib/supabase/server";

// No dedicated /notifications page (dropdown-only UI, see NotificationsBell)
// — this still lives under an (app)/notifications folder, matching every
// other actions.ts file's route-colocated convention.
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", user.id)
    .eq("read", false);
}
