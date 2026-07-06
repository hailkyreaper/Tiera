"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export async function setUsername(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const username = (formData.get("username") as string)?.trim();

  if (!USERNAME_PATTERN.test(username)) {
    redirect(
      `/onboard/username?error=${encodeURIComponent(
        "Username must be 3-20 characters: letters, numbers, or underscore only.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, username });

  if (error) {
    const message =
      error.code === "23505"
        ? "That username is already taken."
        : "Something went wrong. Try a different username.";
    redirect(`/onboard/username?error=${encodeURIComponent(message)}`);
  }

  redirect("/");
}
