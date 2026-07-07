import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function goToCompare(formData: FormData) {
  "use server";
  const username = (formData.get("username") as string)?.trim();
  if (username) {
    redirect(`/compare/${username}`);
  }
}

export default async function ComparePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Compare</h1>
      <p className="text-muted-foreground">
        See how your taste in books lines up with someone else&apos;s.
      </p>
      <form action={goToCompare} className="flex w-full flex-col gap-3 text-left">
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Their username</Label>
          <Input id="username" name="username" placeholder="e.g. jordanbooks" required />
        </div>
        <Button type="submit" className="w-full">
          Compare
        </Button>
      </form>
    </div>
  );
}
