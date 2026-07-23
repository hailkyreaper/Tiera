"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

// Shared by both real entry points to the same form (the standalone
// /signup page and the "/" landing page, which now embeds this same form
// directly) — each needs its own error redirect target so a failed
// submission sends someone back to wherever they actually were, not to
// the other page.
async function signUpWithPassword(formData: FormData, errorPath: string) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error) {
    redirect(`${errorPath}?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup/check-email");
}

export async function signup(formData: FormData) {
  return signUpWithPassword(formData, "/signup");
}

export async function signupFromHome(formData: FormData) {
  return signUpWithPassword(formData, "/");
}

// Real Supabase anonymous auth (supabase.auth.signInAnonymously()) — a
// genuine session/account, no email or password. Requires the "Anonymous
// Sign-Ins" toggle enabled in the Supabase project's Auth settings; if it's
// off, this fails with a real error message shown back on "/" rather than
// silently doing nothing. Same onboarding path as everyone else afterward —
// middleware redirects any authenticated user with no `profiles` row to
// /onboard/username regardless of how they signed in.
export async function continueAnonymously() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/explore");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
