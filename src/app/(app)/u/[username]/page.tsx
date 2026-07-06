import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileRow = { id: string; username: string };
type TierListRow = { id: string; title: string };

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .maybeSingle<ProfileRow>();

  if (!profile) {
    notFound();
  }

  const { data: tierLists } = await supabase
    .from("tier_lists")
    .select("id, title")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .returns<TierListRow[]>();

  const lists = tierLists ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">
        @{profile.username}
      </h1>

      {lists.length === 0 ? (
        <p className="text-muted-foreground">
          No public tier lists yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {lists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`}>
              <Card className="transition-colors hover:bg-muted">
                <CardHeader>
                  <CardTitle className="text-base">{list.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
