import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const ONBOARDING_EXEMPT_PATHS = [
  "/onboard/username",
  "/login",
  "/signup",
  "/signup/check-email",
  "/auth/confirm",
  "/error",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session if expired — required for Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isExempt = ONBOARDING_EXEMPT_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  if (user && !isExempt) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    // A failed query here used to be indistinguishable from "no profile
    // row" — a transient DB blip would wrongly bounce an already-onboarded
    // user back to /onboard/username on every request until it cleared.
    // Only redirect on a genuine "no row found" (no error, no profile);
    // an actual query failure just logs and lets the request through.
    if (profileError) {
      console.error(
        `Middleware: checking onboarding status: ${profileError.message}`,
      );
    } else if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboard/username";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
