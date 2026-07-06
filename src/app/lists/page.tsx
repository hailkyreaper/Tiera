import Link from "next/link";
import { redirect } from "next/navigation";
import { createTierList } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type TierListRow = {
  id: string;
  title: string;
};

export default async function ListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tierLists } = await supabase
    .from("tier_lists")
    .select("id, title")
    .order("created_at", { ascending: false })
    .returns<TierListRow[]>();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Your lists</h1>

      <form action={createTierList} className="flex gap-2">
        <Input
          name="title"
          placeholder="New list name (e.g. Favorite Sci-Fi)"
          className="flex-1"
        />
        <Button type="submit">Create list</Button>
      </form>

      <div className="flex flex-col gap-3">
        {tierLists?.length ? (
          tierLists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`}>
              <Card className="transition-colors hover:bg-muted">
                <CardHeader>
                  <CardTitle className="text-base">{list.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-muted-foreground">
            You don&apos;t have any tier lists yet — create one above.
          </p>
        )}
      </div>
    </div>
  );
}
