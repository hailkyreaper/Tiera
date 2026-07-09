import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type IdRow = { id: string };

// The center nav "Create" button lands here. There's no browsing UI of its
// own — it immediately creates a blank list and redirects into that list's
// own page, which doubles as the create/edit screen (styled per
// createlist.png).
export default async function CreateListEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("tier_lists")
    .insert({ user_id: user.id, title: "", is_public: false, is_draft: true })
    .select("id")
    .single<IdRow>();

  if (error || !data) {
    redirect("/profile");
  }

  redirect(`/lists/${data.id}?edit=true&new=true`);
}
