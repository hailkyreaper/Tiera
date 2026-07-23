import { setUsername } from "./actions";
import { cancelOnboarding } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardUsernamePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Choose a username</CardTitle>
          <CardDescription>
            This is the handle others will see on your public lists and
            comments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setUsername} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                pattern="[A-Za-z0-9_]{3,20}"
                minLength={3}
                maxLength={20}
                required
                placeholder="e.g. bookish_beau"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>

          {/* Escape hatch — there was previously no way back from here at
              all, most noticeably after "Continue without an account,"
              a one-click action someone could easily want to undo. */}
          <form action={cancelOnboarding} className="mt-4">
            <button
              type="submit"
              className="w-full text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              Not you? Start over
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
