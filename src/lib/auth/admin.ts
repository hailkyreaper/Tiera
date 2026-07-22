import type { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/assert";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function isAdmin(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<boolean> {
  // Deliberately fails closed on error (falls through to `false`, same as
  // a genuine non-admin) rather than throwing — a security check should
  // never accidentally grant access just because the query hiccuped.
  // logSupabaseError still surfaces the failure in server logs, so a
  // legitimate admin wrongly denied by a transient DB error is at least
  // debuggable instead of silently indistinguishable from "not an admin."
  const data = logSupabaseError(
    await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle<{ is_admin: boolean }>(),
    "checking admin status",
    null,
  );

  return data?.is_admin ?? false;
}
